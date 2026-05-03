/**
 * OpportunityBatchProcessor - Batchable implementation for opportunity processing
 * @description Processes opportunities in batches for revenue calculations
 * @group Batch
 */
public class OpportunityBatchProcessor implements Database.Batchable<sObject>, Database.Stateful, Schedulable {
    
    public String query;
    public Integer totalProcessed = 0;
    public Integer totalErrors = 0;
    public String processingLog = '';
    
    /**
     * @description Constructor with optional query override
     * @param customQuery Custom SOQL query for batch scope
     */
    public OpportunityBatchProcessor(String customQuery) {
        this.query = customQuery;
    }
    
    public OpportunityBatchProcessor() {
        this.query = 'SELECT Id, Name, Amount, StageName, CloseDate, AccountId FROM Opportunity WHERE IsClosed = false';
    }
    
    /**
     * @description Start method - returns query locator
     * @param bc Batch context
     * @return Database.QueryLocator
     */
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(query);
    }
    
    /**
     * @description Execute method - processes each batch
     * @param bc Batch context
     * @param scope List of opportunities in current batch
     */
    public void execute(Database.BatchableContext bc, List<Opportunity> scope) {
        List<Opportunity> opportunitiesToUpdate = new List<Opportunity>();
        
        for (Opportunity opp : scope) {
            try {
                opp.Description = 'Processed by batch on ' + DateTime.now().format();
                opportunitiesToUpdate.add(opp);
                totalProcessed++;
            } catch (Exception e) {
                totalErrors++;
                processingLog += 'Error processing ' + opp.Id + ': ' + e.getMessage() + '\n';
            }
        }
        
        if (!opportunitiesToUpdate.isEmpty()) {
            update opportunitiesToUpdate;
        }
    }
    
    /**
     * @description Finish method - executes after all batches complete
     * @param bc Batch context
     */
    public void finish(Database.BatchableContext bc) {
        AsyncApexJob job = [SELECT Id, Status, NumberOfErrors, JobItemsProcessed, TotalJobItems 
                           FROM AsyncApexJob WHERE Id = :bc.getJobId()];
        
        System.debug('Batch completed. Processed: ' + totalProcessed + ', Errors: ' + totalErrors);
        
        if (totalErrors > 0) {
            Logger.log('OpportunityBatchProcessor', 'finish', 
                      'Batch completed with ' + totalErrors + ' errors. Log: ' + processingLog, 'WARNING');
        }
    }
    
    /**
     * @description Schedulable execute method
     * @param sc Schedulable context
     */
    public void execute(SchedulableContext sc) {
        Database.executeBatch(new OpportunityBatchProcessor(), 200);
    }
    
    /**
     * @description Schedule the batch job
     * @param cronExpression Cron expression for scheduling
     */
    public static void scheduleBatch(String cronExpression) {
        System.schedule('Opportunity Batch Processor', cronExpression, new OpportunityBatchProcessor());
    }
}
