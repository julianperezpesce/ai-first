/**
 * AccountController - Apex Controller for Account Lightning Web Components
 * @description Provides methods for Account CRUD operations via AuraEnabled
 * @author Salesforce Enterprise Team
 * @group Core
 */
public with sharing class AccountController {
    
    /**
     * @description Retrieves all active accounts with optional filtering
     * @param searchTerm Optional search term for account name filtering
     * @param industryFilter Optional industry filter
     * @return List<Account> List of matching accounts
     */
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts(String searchTerm, String industryFilter) {
        List<Account> accounts = new List<Account>();
        
        String query = 'SELECT Id, Name, Industry, AnnualRevenue, NumberOfEmployees, ' +
                       'BillingCity, BillingState, Type, OwnerId FROM Account WHERE Active__c = true';
        
        if (String.isNotBlank(searchTerm)) {
            query += ' AND Name LIKE \'%' + String.escapeSingleQuotes(searchTerm) + '%\'';
        }
        
        if (String.isNotBlank(industryFilter)) {
            query += ' AND Industry = :industryFilter';
        }
        
        query += ' ORDER BY Name LIMIT 100';
        
        try {
            accounts = Database.query(query);
        } catch (QueryException e) {
            Logger.log('AccountController', 'getAccounts', e.getMessage(), 'ERROR');
            throw new AuraHandledException('Error retrieving accounts: ' + e.getMessage());
        }
        
        return accounts;
    }
    
    /**
     * @description Creates a new account with validation
     * @param accountData JSON string containing account field values
     * @return Account The newly created account
     */
    @AuraEnabled
    public static Account createAccount(String accountData) {
        Account newAccount = (Account) JSON.deserialize(accountData, Account.class);
        
        if (String.isBlank(newAccount.Name)) {
            throw new AuraHandledException('Account name is required');
        }
        
        try {
            insert newAccount;
            Logger.log('AccountController', 'createAccount', 'Account created: ' + newAccount.Id, 'INFO');
            return newAccount;
        } catch (DmlException e) {
            Logger.log('AccountController', 'createAccount', e.getMessage(), 'ERROR');
            throw new AuraHandledException('Error creating account: ' + e.getMessage());
        }
    }
    
    /**
     * @description Updates an existing account
     * @param accountData JSON string containing updated account values
     * @return Account The updated account
     */
    @AuraEnabled
    public static Account updateAccount(String accountData) {
        Account updatedAccount = (Account) JSON.deserialize(accountData, Account.class);
        
        try {
            update updatedAccount;
            Logger.log('AccountController', 'updateAccount', 'Account updated: ' + updatedAccount.Id, 'INFO');
            return updatedAccount;
        } catch (DmlException e) {
            Logger.log('AccountController', 'updateAccount', e.getMessage(), 'ERROR');
            throw new AuraHandledException('Error updating account: ' + e.getMessage());
        }
    }
    
    /**
     * @description Deletes an account by ID
     * @param accountId The ID of the account to delete
     * @return Boolean True if deletion was successful
     */
    @AuraEnabled
    public static Boolean deleteAccount(Id accountId) {
        try {
            delete [SELECT Id FROM Account WHERE Id = :accountId];
            Logger.log('AccountController', 'deleteAccount', 'Account deleted: ' + accountId, 'INFO');
            return true;
        } catch (DmlException e) {
            Logger.log('AccountController', 'deleteAccount', e.getMessage(), 'ERROR');
            throw new AuraHandledException('Error deleting account: ' + e.getMessage());
        }
    }
    
    /**
     * @description Gets account summary statistics
     * @param accountId The ID of the account
     * @return Map<String, Object> Summary data including opportunities and contacts
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getAccountSummary(Id accountId) {
        Map<String, Object> summary = new Map<String, Object>();
        
        Account acct = [SELECT Id, Name, AnnualRevenue, 
                        (SELECT Id, Name, Amount, StageName FROM Opportunities),
                        (SELECT Id, Name, Email FROM Contacts)
                        FROM Account WHERE Id = :accountId];
        
        summary.put('accountName', acct.Name);
        summary.put('totalOpportunities', acct.Opportunities.size());
        summary.put('totalContacts', acct.Contacts.size());
        summary.put('annualRevenue', acct.AnnualRevenue);
        
        Decimal totalOppAmount = 0;
        for (Opportunity opp : acct.Opportunities) {
            totalOppAmount += opp.Amount != null ? opp.Amount : 0;
        }
        summary.put('totalOpportunityAmount', totalOppAmount);
        
        return summary;
    }
}
