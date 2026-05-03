trigger OrderEventTrigger on Order_Event__e (after insert) {
    OrderEventTriggerHandler.handleAfterInsert(Trigger.new);
}
