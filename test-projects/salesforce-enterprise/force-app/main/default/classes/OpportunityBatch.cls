/**
 * OpportunityBatch - Batch Apex class for processing opportunities
 * @description Processes large sets of opportunities for status updates and calculations
 * @author Salesforce Enterprise Team
 * @group Batch
 */
global class OpportunityBatch implements Database.Batchable<SObject>, Database.Stateful {
    
    global Integer recordsProcessed = 0;
    global List<String> processedOpportunityIds = new List<String>();
    global String query;
    
    /**
     * @description Constructor with query parameter
     * @param queryString SOQL query to select opportunities
     */
    global OpportunityBatch(String queryString) {
        this.query = queryString;
    }
    
    /**
     * @description Constructor with stage filter
     * @param stageName The opportunity stage to filter on
     */
    global OpportunityBatch(String stageName, Boolean isActive) {
        this.query = 'SELECT Id, Name, Amount, StageName, CloseDate, AccountId, ' +
                     'Probability, AnnualRevenue, Description FROM Opportunity ' +
                     'WHERE IsClosed = false AND IsWon = false';
        if (String.isNotBlank(stageName)) {
            this.query += ' AND StageName = :stageName';
        }
    }
    
    /**
     * @description Start method - collects records to process
     * @param BC BatchableContext for tracking job
     * @return Database.QueryLocator Returns the query locator with opportunity records
     */
    global Database.QueryLocator start(Database.BatchableContext BC) {
        if (String.isBlank(this.query)) {
            this.query = 'SELECT Id, Name, Amount, StageName, CloseDate, AccountId, ' +
                         'Probability, AnnualRevenue, Description FROM Opportunity ' +
                         'WHERE IsClosed = false';
        }
        
        Logger.log('OpportunityBatch', 'start', 'Starting batch job with query: ' + this.query, 'INFO');
        return Database.getQueryLocator(this.query);
    }
    
    /**
     * @description Execute method - processes each batch of records
     * @param BC BatchableContext for tracking job
     * @param scope List of Opportunity records to process
     */
    global void execute(Database.BatchableContext BC, List<Opportunity> scope) {
        List<Opportunity> opportunitiesToUpdate = new List<Opportunity>();
        
        for (Opportunity opp : scope) {
            // Calculate probability based on days until close
            Integer daysUntilClose = Date.today().daysBetween(opp.CloseDate);
            
            if (daysUntilClose < 0) {
                opp.Probability = 0;
            } else if (daysUntilClose < 30) {
                opp.Probability = 75;
            } else if (daysUntilClose < 60) {
                opp.Probability = 50;
            } else {
                opp.Probability = 25;
            }
            
            // Set default description if blank
            if (String.isBlank(opp.Description)) {
                opp.Description = 'Auto-processed on ' + Date.today().format();
            }
            
            opportunitiesToUpdate.add(opp);
            recordsProcessed++;
            processedOpportunityIds.add(opp.Id);
        }
        
        if (!opportunitiesToUpdate.isEmpty()) {
            update opportunitiesToUpdate;
            Logger.log('OpportunityBatch', 'execute', 'Updated ' + opportunitiesToUpdate.size() + ' opportunities', 'INFO');
        }
    }
    
    /**
     * @description Finish method - called after all batches complete
     * @param BC BatchableContext for tracking job
     */
    global void finish(Database.BatchableContext BC) {
        // Get job results
        AsyncApexJob job = [SELECT Id, Status, NumberOfErrors, JobItemsProcessed, 
                           TotalJobItems, CreatedBy.Email 
                           FROM AsyncApexJob WHERE Id = :BC.getJobId()];
        
        Logger.log('OpportunityBatch', 'finish', 
                   'Batch job completed with status: ' + job.Status + 
                   '. Processed ' + recordsProcessed + ' records.', 'INFO');
        
        // Send notification email
        if (job.Status == 'Completed' && job.NumberOfErrors == 0) {
            sendSuccessNotification(job);
        } else if (job.NumberOfErrors > 0) {
            sendFailureNotification(job);
        }
    }
    
    /**
     * @description Sends success notification email
     * @param job The AsyncApexJob record
     */
    private void sendSuccessNotification(AsyncApexJob job) {
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        String[] toAddresses = new String[] {job.CreatedBy.Email};
        mail.setToAddresses(toAddresses);
        mail.setSubject('Opportunity Batch Job Completed Successfully');
        mail.setPlainTextBody('The Opportunity batch processing job has completed successfully.\n\n' +
                              'Status: ' + job.Status + '\n' +
                              'Records Processed: ' + recordsProcessed + '\n' +
                              'Job Items Processed: ' + job.JobItemsProcessed);
        // Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }
    
    /**
     * @description Sends failure notification email
     * @param job The AsyncApexJob record
     */
    private void sendFailureNotification(AsyncApexJob job) {
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        String[] toAddresses = new String[] {job.CreatedBy.Email};
        mail.setToAddresses(toAddresses);
        mail.setSubject('Opportunity Batch Job Failed');
        mail.setPlainTextBody('The Opportunity batch processing job has completed with errors.\n\n' +
                              'Status: ' + job.Status + '\n' +
                              'Number of Errors: ' + job.NumberOfErrors + '\n' +
                              'Please review the logs for more details.');
        // Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }
}
