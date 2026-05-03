/**
 * OrderEventPublisher - Publishes Order Events for external integrations
 * @description Handles platform event publishing for order lifecycle
 * @group Integration
 */
public class OrderEventPublisher {
    
    /**
     * @description Publishes an order event after order creation
     * @param orderNumber The order number
     * @param customerId The customer account ID
     * @param totalAmount The total order amount
     */
    public static void publishOrderCreated(String orderNumber, Id customerId, Decimal totalAmount) {
        Order_Event__e event = new Order_Event__e(
            Order_Number__c = orderNumber,
            Customer_Id__c = customerId,
            Total_Amount__c = totalAmount,
            Status__c = 'Created'
        );
        
        Database.SaveResult result = EventBus.publish(event);
        
        if (!result.isSuccess()) {
            for (Database.Error error : result.getErrors()) {
                System.debug('Error publishing order event: ' + error.getMessage());
            }
        }
    }
    
    /**
     * @description Publishes order status update event
     * @param orderNumber The order number
     * @param status The new status
     */
    public static void publishOrderStatusUpdate(String orderNumber, String status) {
        Order_Event__e event = new Order_Event__e(
            Order_Number__c = orderNumber,
            Status__c = status
        );
        
        EventBus.publish(event);
    }
    
    /**
     * @description Bulk publish order events for batch processing
     * @param events List of order events to publish
     * @return Integer Number of successfully published events
     */
    public static Integer publishBulkEvents(List<Order_Event__e> events) {
        List<Database.SaveResult> results = EventBus.publish(events);
        
        Integer successCount = 0;
        for (Database.SaveResult result : results) {
            if (result.isSuccess()) {
                successCount++;
            }
        }
        
        return successCount;
    }
}
