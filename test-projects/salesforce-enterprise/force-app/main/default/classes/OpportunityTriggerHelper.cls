/**
 * OpportunityTriggerHelper - Helper methods for Opportunity triggers
 * @description Shared utility methods for Opportunity trigger handling
 * @group Triggers
 */
public with sharing class OpportunityTriggerHelper {
    
    private static Boolean bypassReopenCheck = false;
    
    /**
     * @description Checks if opportunity can be reopened
     * @return Boolean True if reopening is allowed
     */
    public static Boolean canReopenOpportunity() {
        return bypassReopenCheck || FeatureManagement.checkPermission('Can_Reopen_Opportunity');
    }
    
    /**
     * @description Updates account total revenue based on won opportunities
     * @param accountIds Set of account IDs to update
     */
    public static void updateAccountTotalRevenue(Set<Id> accountIds) {
        if (accountIds == null || accountIds.isEmpty()) {
            return;
        }
        
        List<Account> accountsToUpdate = new List<Account>();
        
        for (Account acct : [SELECT Id, Total_Opportunity_Amount__c,
                             (SELECT Amount FROM Opportunities WHERE IsWon = true)
                             FROM Account WHERE Id IN :accountIds]) {
            Decimal totalRevenue = 0;
            for (Opportunity opp : acct.Opportunities) {
                totalRevenue += opp.Amount != null ? opp.Amount : 0;
            }
            acct.Total_Opportunity_Amount__c = totalRevenue;
            accountsToUpdate.add(acct);
        }
        
        if (!accountsToUpdate.isEmpty()) {
            update accountsToUpdate;
        }
    }
    
    /**
     * @description Sends win notifications for closed won opportunities
     * @param opportunities List of closed won opportunities
     */
    public static void sendWinNotifications(List<Opportunity> opportunities) {
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        
        for (Opportunity opp : opportunities) {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setSubject('Opportunity Won: ' + opp.Name);
            mail.setPlainTextBody('Congratulations! The opportunity ' + opp.Name + 
                                  ' has been marked as Closed Won with amount: $' + opp.Amount);
            mail.setTargetObjectId(opp.OwnerId);
            emails.add(mail);
        }
        
        if (!emails.isEmpty()) {
            // Messaging.sendEmail(emails);
        }
    }
    
    /**
     * @description Gets the default close date for new opportunities
     * @return Date Default close date (90 days from today)
     */
    public static Date getDefaultCloseDate() {
        return Date.today().addDays(90);
    }
}
