public with sharing class AccountController {
    
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [SELECT Id, Name, Industry, BillingCity 
                FROM Account 
                ORDER BY Name 
                LIMIT 100];
    }
    
    @AuraEnabled
    public static Account createAccount(String name, String industry) {
        Account acc = new Account(Name = name, Industry = industry);
        insert acc;
        return acc;
    }
    
    @AuraEnabled
    public static void updateAccountRating(String accountId, String rating) {
        Account acc = [SELECT Id FROM Account WHERE Id = :accountId];
        acc.Rating = rating;
        update acc;
    }
}
