trigger AccountTrigger on Account (before insert, before update, after insert, after update) {
    
    if (Trigger.isBefore) {
        if (Trigger.isInsert || Trigger.isUpdate) {
            for (Account acc : Trigger.new) {
                if (acc.Industry == null) {
                    acc.Industry = 'Other';
                }
                if (acc.Name != null && acc.Name.length() > 80) {
                    acc.Name.addError('Account name cannot exceed 80 characters');
                }
            }
        }
    }
    
    if (Trigger.isAfter) {
        if (Trigger.isInsert) {
            List<Task> tasks = new List<Task>();
            for (Account acc : Trigger.new) {
                Task t = new Task(
                    Subject = 'Welcome ' + acc.Name,
                    WhatId = acc.Id,
                    Status = 'Not Started',
                    Priority = 'Normal'
                );
                tasks.add(t);
            }
            if (!tasks.isEmpty()) {
                insert tasks;
            }
        }
    }
}
