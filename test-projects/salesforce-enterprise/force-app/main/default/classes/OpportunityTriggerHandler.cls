/**
 * OpportunityTriggerHandler - Handler class for OpportunityTrigger
 * @description Business logic for Opportunity trigger events
 * @group Triggers
 */
public with sharing class OpportunityTriggerHandler {
    
    /**
     * @description Handles before insert logic
     * @param newOpportunities List of new opportunities
     */
    public void onBeforeInsert(List<Opportunity> newOpportunities) {
        setDefaultValues(newOpportunities);
        validateOpportunities(newOpportunities);
    }
    
    /**
     * @description Handles before update logic
     * @param newOpportunities List of updated opportunities
     * @param oldOpportunityMap Map of old opportunity values
     */
    public void onBeforeUpdate(List<Opportunity> newOpportunities, 
                               Map<Id, Opportunity> oldOpportunityMap) {
        validateStageChanges(newOpportunities, oldOpportunityMap);
        checkForClosedWonReopen(newOpportunities, oldOpportunityMap);
    }
    
    /**
     * @description Handles before delete logic
     * @param oldOpportunityMap Map of opportunities being deleted
     */
    public void onBeforeDelete(Map<Id, Opportunity> oldOpportunityMap) {
        preventDeletionOfClosedWon(oldOpportunityMap);
    }
    
    /**
     * @description Handles after insert logic
     * @param newOpportunities List of new opportunities
     */
    public void onAfterInsert(List<Opportunity> newOpportunities) {
        updateAccountRevenue(newOpportunities);
        createActivityHistory(newOpportunities);
    }
    
    /**
     * @description Handles after update logic
     * @param newOpportunities List of updated opportunities
     * @param oldOpportunityMap Map of old opportunity values
     */
    public void onAfterUpdate(List<Opportunity> newOpportunities,
                              Map<Id, Opportunity> oldOpportunityMap) {
        updateAccountRevenue(newOpportunities);
        sendNotificationsForStageChange(newOpportunities, oldOpportunityMap);
    }
    
    /**
     * @description Handles after delete logic
     * @param oldOpportunityMap Map of opportunities deleted
     */
    public void onAfterDelete(Map<Id, Opportunity> oldOpportunityMap) {
        updateAccountRevenueOnDelete(oldOpportunityMap);
    }
    
    /**
     * @description Handles after undelete logic
     * @param newOpportunities List of restored opportunities
     */
    public void onAfterUndelete(List<Opportunity> newOpportunities) {
        updateAccountRevenue(newOpportunities);
    }
    
    /**
     * @description Sets default values for new opportunities
     * @param opportunities List of opportunities
     */
    private void setDefaultValues(List<Opportunity> opportunities) {
        for (Opportunity opp : opportunities) {
            if (String.isBlank(opp.LeadSource)) {
                opp.LeadSource = 'Direct';
            }
            if (opp.Probability == null && String.isNotBlank(opp.StageName)) {
                opp.Probability = getDefaultProbability(opp.StageName);
            }
        }
    }
    
    /**
     * @description Validates opportunities
     * @param opportunities List of opportunities to validate
     */
    private void validateOpportunities(List<Opportunity> opportunities) {
        for (Opportunity opp : opportunities) {
            if (opp.Amount != null && opp.Amount < 0) {
                opp.addError('Opportunity amount cannot be negative');
            }
            if (opp.CloseDate < Date.today() && Trigger.isInsert) {
                opp.addError('Close date cannot be in the past for new opportunities');
            }
        }
    }
    
    /**
     * @description Validates stage changes
     * @param newOpportunities Updated opportunities
     * @param oldOpportunityMap Map of old values
     */
    private void validateStageChanges(List<Opportunity> newOpportunities,
                                      Map<Id, Opportunity> oldOpportunityMap) {
        for (Opportunity opp : newOpportunities) {
            Opportunity oldOpp = oldOpportunityMap.get(opp.Id);
            if (oldOpp != null && opp.StageName != oldOpp.StageName) {
                if (oldOpp.StageName == 'Closed Won' && !OpportunityTriggerHelper.canReopenOpportunity()) {
                    opp.addError('Cannot change stage from Closed Won without approval');
                }
            }
        }
    }
    
    /**
     * @description Checks if closed won opportunity is being reopened
     */
    private void checkForClosedWonReopen(List<Opportunity> newOpportunities,
                                         Map<Id, Opportunity> oldOpportunityMap) {
        for (Opportunity opp : newOpportunities) {
            Opportunity oldOpp = oldOpportunityMap.get(opp.Id);
            if (oldOpp != null && oldOpp.IsWon && !opp.IsWon) {
                opp.addError('Closed Won opportunities cannot be reopened');
            }
        }
    }
    
    /**
     * @description Prevents deletion of closed won opportunities
     * @param oldOpportunityMap Map of opportunities being deleted
     */
    private void preventDeletionOfClosedWon(Map<Id, Opportunity> oldOpportunityMap) {
        for (Opportunity opp : oldOpportunityMap.values()) {
            if (opp.IsWon) {
                opp.addError('Cannot delete Closed Won opportunities');
            }
        }
    }
    
    /**
     * @description Updates account revenue based on opportunities
     * @param opportunities List of opportunities
     */
    private void updateAccountRevenue(List<Opportunity> opportunities) {
        Set<Id> accountIds = new Set<Id>();
        for (Opportunity opp : opportunities) {
            if (opp.AccountId != null) {
                accountIds.add(opp.AccountId);
            }
        }
        
        if (!accountIds.isEmpty()) {
            OpportunityTriggerHelper.updateAccountTotalRevenue(accountIds);
        }
    }
    
    /**
     * @description Updates account revenue on delete
     * @param oldOpportunityMap Map of deleted opportunities
     */
    private void updateAccountRevenueOnDelete(Map<Id, Opportunity> oldOpportunityMap) {
        Set<Id> accountIds = new Set<Id>();
        for (Opportunity opp : oldOpportunityMap.values()) {
            if (opp.AccountId != null) {
                accountIds.add(opp.AccountId);
            }
        }
        
        if (!accountIds.isEmpty()) {
            OpportunityTriggerHelper.updateAccountTotalRevenue(accountIds);
        }
    }
    
    /**
     * @description Creates activity history for new opportunities
     * @param opportunities List of opportunities
     */
    private void createActivityHistory(List<Opportunity> opportunities) {
        List<Task> tasks = new List<Task>();
        for (Opportunity opp : opportunities) {
            tasks.add(new Task(
                Subject = 'Follow up on ' + opp.Name,
                WhatId = opp.Id,
                ActivityDate = Date.today().addDays(7),
                Status = 'Not Started'
            ));
        }
        insert tasks;
    }
    
    /**
     * @description Sends notifications for stage changes
     * @param newOpportunities Updated opportunities
     * @param oldOpportunityMap Map of old values
     */
    private void sendNotificationsForStageChange(List<Opportunity> newOpportunities,
                                                 Map<Id, Opportunity> oldOpportunityMap) {
        List<Opportunity> closedWonOpps = new List<Opportunity>();
        
        for (Opportunity opp : newOpportunities) {
            Opportunity oldOpp = oldOpportunityMap.get(opp.Id);
            if (oldOpp != null && opp.StageName == 'Closed Won' && oldOpp.StageName != 'Closed Won') {
                closedWonOpps.add(opp);
            }
        }
        
        if (!closedWonOpps.isEmpty()) {
            OpportunityTriggerHelper.sendWinNotifications(closedWonOpps);
        }
    }
    
    /**
     * @description Gets default probability for stage
     * @param stageName The opportunity stage
     * @return Integer Default probability percentage
     */
    private Integer getDefaultProbability(String stageName) {
        Map<String, Integer> probabilityMap = new Map<String, Integer>{
            'Prospecting' => 10,
            'Qualification' => 20,
            'Needs Analysis' => 30,
            'Value Proposition' => 50,
            'Id. Decision Makers' => 60,
            'Perception Analysis' => 70,
            'Proposal/Price Quote' => 75,
            'Negotiation/Review' => 90,
            'Closed Won' => 100,
            'Closed Lost' => 0
        };
        return probabilityMap.get(stageName) != null ? probabilityMap.get(stageName) : 0;
    }
}
