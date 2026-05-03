/**
 * OrderEventTriggerHandler - Handles Order Event triggers
 * @description Processes incoming platform events for order updates
 * @group Integration
 */
public class OrderEventTriggerHandler {
    
    /**
     * @description Processes after insert trigger on Order Events
     * @param newEvents List of new platform event records
     */
    public static void handleAfterInsert(List<Order_Event__e> newEvents) {
        List<Task> tasksToCreate = new List<Task>();
        
        for (Order_Event__e event : newEvents) {
            if (event.Status__c == 'Created') {
                tasksToCreate.add(createFollowUpTask(event));
            }
        }
        
        if (!tasksToCreate.isEmpty()) {
            insert tasksToCreate;
        }
    }
    
    private static Task createFollowUpTask(Order_Event__e event) {
        return new Task(
            Subject = 'Follow up on Order ' + event.Order_Number__c,
            Status = 'Not Started',
            Priority = 'Normal',
            WhatId = event.Customer_Id__c,
            Description = 'New order created with amount: ' + event.Total_Amount__c
        );
    }
}
