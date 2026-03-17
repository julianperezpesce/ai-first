public with sharing class OpportunityController {
    
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getOpportunitiesByStage(String stageName) {
        return [SELECT Id, Name, Amount, CloseDate, StageName, Account.Name
                FROM Opportunity 
                WHERE StageName = :stageName
                ORDER BY CloseDate DESC
                LIMIT 50];
    }
    
    @AuraEnabled
    public static void closeWon(String opportunityId) {
        Opportunity opp = [SELECT Id, StageName FROM Opportunity WHERE Id = :opportunityId];
        opp.StageName = 'Closed Won';
        opp.CloseDate = Date.today();
        update opp;
    }
    
    public static void validateOpportunity(Opportunity opp) {
        if (opp.Amount != null && opp.Amount > 1000000) {
            opp.addError('Amount exceeds maximum allowed');
        }
    }
}
