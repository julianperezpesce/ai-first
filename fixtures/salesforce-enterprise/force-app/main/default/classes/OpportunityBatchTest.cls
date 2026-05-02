/**
 * OpportunityBatchTest - Test class for OpportunityBatch
 * @description Unit tests for Opportunity batch processing
 * @group Tests
 */
@IsTest
private class OpportunityBatchTest {
    
    @testSetup
    static void setupTestData() {
        Account testAccount = new Account(
            Name = 'Batch Test Account',
            Industry = 'Technology',
            Active__c = true
        );
        insert testAccount;
        
        List<Opportunity> opportunities = new List<Opportunity>();
        for (Integer i = 0; i < 10; i++) {
            opportunities.add(new Opportunity(
                Name = 'Batch Test Opportunity ' + i,
                StageName = 'Prospecting',
                CloseDate = Date.today().addDays(30 + i * 10),
                Amount = 50000 + (i * 10000),
                AccountId = testAccount.Id,
                Description = ''
            ));
        }
        insert opportunities;
    }
    
    @isTest
    static void testBatchExecution() {
        Test.startTest();
        OpportunityBatch batch = new OpportunityBatch('Prospecting', false);
        Id batchId = Database.executeBatch(batch, 5);
        Test.stopTest();
        
        System.assertNotEquals(null, batchId, 'Batch job should be executed');
        
        List<Opportunity> updatedOpps = [SELECT Id, Probability, Description 
                                         FROM Opportunity 
                                         WHERE Description != ''];
        System.assertEquals(10, updatedOpps.size(), 'All opportunities should be updated');
    }
    
    @isTest
    static void testBatchWithCustomQuery() {
        Test.startTest();
        String customQuery = 'SELECT Id, Name, Amount, StageName, CloseDate, ' +
                             'Probability FROM Opportunity LIMIT 5';
        OpportunityBatch batch = new OpportunityBatch(customQuery);
        Id batchId = Database.executeBatch(batch, 2);
        Test.stopTest();
        
        System.assertNotEquals(null, batchId, 'Batch job should be executed');
    }
    
    @isTest
    static void testBatchStateRetention() {
        Test.startTest();
        OpportunityBatch batch = new OpportunityBatch('Prospecting', false);
        Id batchId = Database.executeBatch(batch, 5);
        Test.stopTest();
        
        // Verify job completed
        AsyncApexJob job = [SELECT Status, JobItemsProcessed, TotalJobItems 
                           FROM AsyncApexJob WHERE Id = :batchId];
        System.assertEquals('Completed', job.Status, 'Batch job should complete');
    }
}
