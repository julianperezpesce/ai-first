/**
 * OpportunityTrigger - Trigger for Opportunity object
 * @description Handles before and after trigger events for Opportunity
 * @author Salesforce Enterprise Team
 * @group Triggers
 */
trigger OpportunityTrigger on Opportunity (
    before insert,
    before update,
    before delete,
    after insert,
    after update,
    after delete,
    after undelete
) {
    
    // Disable trigger if bypassed
    if (TriggerManagement.isTriggerBypassed('Opportunity')) {
        return;
    }
    
    OpportunityTriggerHandler handler = new OpportunityTriggerHandler();
    
    if (Trigger.isBefore) {
        if (Trigger.isInsert) {
            handler.onBeforeInsert(Trigger.new);
        }
        if (Trigger.isUpdate) {
            handler.onBeforeUpdate(Trigger.new, Trigger.oldMap);
        }
        if (Trigger.isDelete) {
            handler.onBeforeDelete(Trigger.oldMap);
        }
    }
    
    if (Trigger.isAfter) {
        if (Trigger.isInsert) {
            handler.onAfterInsert(Trigger.new);
        }
        if (Trigger.isUpdate) {
            handler.onAfterUpdate(Trigger.new, Trigger.oldMap);
        }
        if (Trigger.isDelete) {
            handler.onAfterDelete(Trigger.oldMap);
        }
        if (Trigger.isUndelete) {
            handler.onAfterUndelete(Trigger.new);
        }
    }
}
