/**
 * NotificationQueueable - Queueable job for async notification processing
 * @description Sends notifications asynchronously with chaining support
 * @group Async
 */
public class NotificationQueueable implements Queueable {
    
    private List<Id> accountIds;
    private String notificationType;
    private Integer chainDepth;
    
    private static final Integer MAX_CHAIN_DEPTH = 5;
    
    /**
     * @description Constructor
     * @param accountIds List of account IDs to process
     * @param notificationType Type of notification to send
     */
    public NotificationQueueable(List<Id> accountIds, String notificationType) {
        this.accountIds = accountIds;
        this.notificationType = notificationType;
        this.chainDepth = 0;
    }
    
    /**
     * @description Constructor with chain depth tracking
     * @param accountIds List of account IDs
     * @param notificationType Notification type
     * @param chainDepth Current chain depth
     */
    public NotificationQueueable(List<Id> accountIds, String notificationType, Integer chainDepth) {
        this.accountIds = accountIds;
        this.notificationType = notificationType;
        this.chainDepth = chainDepth;
    }
    
    /**
     * @description Execute method - processes notifications and chains if needed
     * @param context Queueable context
     */
    public void execute(QueueableContext context) {
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        
        for (Id accountId : accountIds) {
            try {
                Account acc = [SELECT Id, Name, OwnerId FROM Account WHERE Id = :accountId LIMIT 1];
                
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                email.setTargetObjectId(acc.OwnerId);
                email.setSubject('Notification: ' + notificationType);
                email.setPlainTextBody('Account ' + acc.Name + ' requires attention.');
                email.setSaveAsActivity(false);
                
                emails.add(email);
            } catch (Exception e) {
                Logger.log('NotificationQueueable', 'execute', 
                          'Error processing account ' + accountId + ': ' + e.getMessage(), 'ERROR');
            }
        }
        
        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
        
        // Chain next batch if needed
        if (chainDepth < MAX_CHAIN_DEPTH && accountIds.size() > 10) {
            List<Id> remainingIds = new List<Id>();
            for (Integer i = 10; i < accountIds.size(); i++) {
                remainingIds.add(accountIds[i]);
            }
            
            if (!remainingIds.isEmpty()) {
                System.enqueueJob(new NotificationQueueable(remainingIds, notificationType, chainDepth + 1));
            }
        }
    }
    
    /**
     * @description Enqueue notification job
     * @param accountIds Account IDs to process
     * @param notificationType Notification type
     * @return Id Job ID
     */
    public static Id enqueueNotifications(List<Id> accountIds, String notificationType) {
        return System.enqueueJob(new NotificationQueueable(accountIds, notificationType));
    }
}
