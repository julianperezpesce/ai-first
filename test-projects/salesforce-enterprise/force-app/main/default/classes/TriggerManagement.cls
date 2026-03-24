/**
 * TriggerManagement - Utility class for trigger bypass management
 * @description Allows bypassing of triggers via custom metadata or hierarchy settings
 * @group Core
 */
public without sharing class TriggerManagement {
    
    private static final String BYPASS_TRIGGERS_SETTING = 'TriggerBypass__c';
    
    /**
     * @description Checks if a specific trigger is bypassed
     * @param triggerName The name of the trigger to check
     * @return Boolean True if trigger is bypassed
     */
    public static Boolean isTriggerBypassed(String triggerName) {
        Trigger_Bypass__mdt bypassSetting = Trigger_Bypass__mdt.getInstance(triggerName);
        if (bypassSetting != null) {
            return bypassSetting.Is_Bypassed__c;
        }
        return false;
    }
    
    /**
     * @description Checks if a specific trigger is bypassed for current user
     * @param triggerName The name of the trigger
     * @return Boolean True if trigger is bypassed for user
     */
    public static Boolean isTriggerBypassedForUser(String triggerName) {
        return isTriggerBypassed(triggerName) || 
               FeatureManagement.checkPermission('Bypass_' + triggerName);
    }
    
    /**
     * @description Bypasses a trigger for current execution context
     * @param triggerName The name of the trigger to bypass
     */
    public static void bypassTrigger(String triggerName) {
        Set<String> bypassedTriggers = getBypassedTriggers();
        bypassedTriggers.add(triggerName);
        setBypassedTriggers(bypassedTriggers);
    }
    
    /**
     * @description Removes bypass for a trigger
     * @param triggerName The name of the trigger
     */
    public static void removeBypass(String triggerName) {
        Set<String> bypassedTriggers = getBypassedTriggers();
        bypassedTriggers.remove(triggerName);
        setBypassedTriggers(bypassedTriggers);
    }
    
    /**
     * @description Gets all currently bypassed triggers
     * @return Set<String> Set of bypassed trigger names
     */
    public static Set<String> getBypassedTriggers() {
        Object bypassValue = SessionManagement.getSessionValue(BYPASS_TRIGGERS_SETTING);
        if (bypassValue != null) {
            return new Set<String>((List<String>) JSON.deserialize((String) bypassValue, List<String>.class));
        }
        return new Set<String>();
    }
    
    /**
     * @description Sets bypassed triggers in session
     * @param bypassedTriggers Set of trigger names to bypass
     */
    private static void setBypassedTriggers(Set<String> bypassedTriggers) {
        SessionManagement.setSessionValue(BYPASS_TRIGGERS_SETTING, JSON.serialize(bypassedTriggers));
    }
}
