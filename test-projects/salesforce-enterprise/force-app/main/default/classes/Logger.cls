/**
 * Logger - Centralized logging utility for Salesforce
 * @description Provides structured logging across the application
 * @group Core
 */
public with sharing class Logger {
    
    public enum Severity {
        DEBUG,
        INFO,
        WARNING,
        ERROR,
        CRITICAL
    }
    
    /**
     * @description Logs a message with severity level
     * @param className Name of the class logging the message
     * @param methodName Name of the method
     * @param message The log message
     * @param severity The severity level
     */
    public static void log(String className, String methodName, String message, String severity) {
        Log__c logEntry = new Log__c(
            Class_Name__c = className,
            Method_Name__c = methodName,
            Message__c = message,
            Severity__c = severity,
            User_Id__c = UserInfo.getUserId(),
            Timestamp__c = Datetime.now()
        );
        
        insertLogEntry(logEntry);
    }
    
    /**
     * @description Logs a message with DEBUG severity
     */
    public static void debug(String className, String methodName, String message) {
        log(className, methodName, message, 'DEBUG');
    }
    
    /**
     * @description Logs a message with INFO severity
     */
    public static void info(String className, String methodName, String message) {
        log(className, methodName, message, 'INFO');
    }
    
    /**
     * @description Logs a message with WARNING severity
     */
    public static void warn(String className, String methodName, String message) {
        log(className, methodName, message, 'WARNING');
    }
    
    /**
     * @description Logs a message with ERROR severity
     */
    public static void error(String className, String methodName, String message) {
        log(className, methodName, message, 'ERROR');
    }
    
    /**
     * @description Logs a message with CRITICAL severity
     */
    public static void critical(String className, String methodName, String message) {
        log(className, methodName, message, 'CRITICAL');
    }
    
    /**
     * @description Logs an exception
     * @param className Name of the class
     * @param methodName Name of the method
     * @param ex The exception to log
     */
    public static void logException(String className, String methodName, Exception ex) {
        Log__c logEntry = new Log__c(
            Class_Name__c = className,
            Method_Name__c = methodName,
            Message__c = ex.getMessage(),
            Stack_Trace__c = ex.getStackTraceString(),
            Severity__c = 'ERROR',
            User_Id__c = UserInfo.getUserId(),
            Timestamp__c = Datetime.now()
        );
        
        insertLogEntry(logEntry);
    }
    
    /**
     * @description Inserts log entry with retry logic
     * @param logEntry The log entry to insert
     */
    private static void insertLogEntry(Log__c logEntry) {
        try {
            insert logEntry;
        } catch (DmlException ex) {
            System.debug(LoggingLevel.ERROR, 'Failed to insert log entry: ' + ex.getMessage());
        }
    }
}
