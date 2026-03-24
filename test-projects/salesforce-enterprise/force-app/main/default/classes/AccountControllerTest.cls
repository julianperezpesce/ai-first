/**
 * AccountControllerTest - Test class for AccountController
 * @description Unit tests for Account CRUD operations
 * @group Tests
 */
@IsTest
private class AccountControllerTest {
    
    @testSetup
    static void setupTestData() {
        // Create test accounts
        List<Account> testAccounts = new List<Account>();
        for (Integer i = 0; i < 5; i++) {
            testAccounts.add(new Account(
                Name = 'Test Account ' + i,
                Industry = 'Technology',
                AnnualRevenue = 100000 * (i + 1),
                NumberOfEmployees = 100 * (i + 1),
                BillingCity = 'San Francisco',
                BillingState = 'CA',
                Type = 'Customer - Direct',
                Active__c = true
            ));
        }
        insert testAccounts;
        
        // Create test contacts
        Contact testContact = new Contact(
            FirstName = 'John',
            LastName = 'Doe',
            Email = 'john.doe@test.com',
            AccountId = testAccounts[0].Id
        );
        insert testContact;
    }
    
    @isTest
    static void testGetAccounts() {
        Test.startTest();
        List<Account> accounts = AccountController.getAccounts(null, null);
        Test.stopTest();
        
        System.assertNotEquals(null, accounts, 'Accounts list should not be null');
        System.assertEquals(5, accounts.size(), 'Should return 5 test accounts');
    }
    
    @isTest
    static void testGetAccountsWithSearchTerm() {
        Test.startTest();
        List<Account> accounts = AccountController.getAccounts('Test Account 1', null);
        Test.stopTest();
        
        System.assertNotEquals(null, accounts, 'Accounts list should not be null');
        System.assertEquals(1, accounts.size(), 'Should return 1 account matching search');
        System.assertEquals('Test Account 1', accounts[0].Name, 'Account name should match');
    }
    
    @isTest
    static void testGetAccountsWithIndustryFilter() {
        Test.startTest();
        List<Account> accounts = AccountController.getAccounts(null, 'Technology');
        Test.stopTest();
        
        System.assertNotEquals(null, accounts, 'Accounts list should not be null');
        System.assertEquals(5, accounts.size(), 'All accounts are Technology industry');
    }
    
    @isTest
    static void testCreateAccount() {
        Test.startTest();
        Account newAccount = new Account(
            Name = 'New Test Account',
            Industry = 'Healthcare',
            AnnualRevenue = 500000,
            Active__c = true
        );
        String accountJson = JSON.serialize(newAccount);
        Account created = AccountController.createAccount(accountJson);
        Test.stopTest();
        
        System.assertNotEquals(null, created.Id, 'Created account should have an ID');
        System.assertEquals('New Test Account', created.Name, 'Account name should match');
    }
    
    @isTest
    static void testCreateAccountWithoutName() {
        Test.startTest();
        try {
            Account invalidAccount = new Account(Industry = 'Healthcare');
            String accountJson = JSON.serialize(invalidAccount);
            AccountController.createAccount(accountJson);
            System.assert(false, 'Should have thrown AuraHandledException');
        } catch (AuraHandledException e) {
            System.assertEquals('Account name is required', e.getMessage(), 'Error message should match');
        }
        Test.stopTest();
    }
    
    @isTest
    static void testUpdateAccount() {
        Test.startTest();
        Account existingAccount = [SELECT Id, Name FROM Account LIMIT 1];
        existingAccount.AnnualRevenue = 999999;
        String accountJson = JSON.serialize(existingAccount);
        Account updated = AccountController.updateAccount(accountJson);
        Test.stopTest();
        
        System.assertEquals(999999, updated.AnnualRevenue, 'Annual revenue should be updated');
    }
    
    @isTest
    static void testDeleteAccount() {
        Test.startTest();
        Account accountToDelete = [SELECT Id FROM Account LIMIT 1];
        Boolean result = AccountController.deleteAccount(accountToDelete.Id);
        Test.stopTest();
        
        System.assertEquals(true, result, 'Delete should return true');
        Integer remainingAccounts = [SELECT COUNT() FROM Account WHERE Id = :accountToDelete.Id];
        System.assertEquals(0, remainingAccounts, 'Account should be deleted');
    }
    
    @isTest
    static void testGetAccountSummary() {
        Test.startTest();
        Account testAccount = [SELECT Id FROM Account LIMIT 1];
        Map<String, Object> summary = AccountController.getAccountSummary(testAccount.Id);
        Test.stopTest();
        
        System.assertNotEquals(null, summary, 'Summary should not be null');
        System.assertEquals('Test Account 0', summary.get('accountName'), 'Account name should match');
        System.assertEquals(1, summary.get('totalContacts'), 'Should have 1 contact');
    }
    
    @isTest
    static void testGetAccountsEmptyResult() {
        Test.startTest();
        List<Account> accounts = AccountController.getAccounts('NonExistentAccount', null);
        Test.stopTest();
        
        System.assertNotEquals(null, accounts, 'Accounts list should not be null');
        System.assertEquals(0, accounts.size(), 'Should return empty list');
    }
}
