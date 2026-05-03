({
    doInit: function(component, event, helper) {
        component.set('v.columns', [
            {label: 'Name', fieldName: 'Name', type: 'text'},
            {label: 'Industry', fieldName: 'Industry', type: 'text'},
            {label: 'Annual Revenue', fieldName: 'AnnualRevenue', type: 'currency'}
        ]);
        helper.loadAccounts(component);
    },
    
    handleSearchChange: function(component, event, helper) {
        var searchTerm = component.get('v.searchTerm');
        helper.debouncedSearch(component, searchTerm);
    },
    
    handleIndustryChange: function(component, event, helper) {
        helper.loadAccounts(component);
    },
    
    handleAccountSelect: function(component, event, helper) {
        var accountId = event.getParam('accountId');
        component.set('v.selectedAccount', accountId);
    },
    
    handleRecordUpdated: function(component, event, helper) {
        var eventParams = event.getParams();
        if (eventParams.changeType === "CHANGED") {
            helper.loadAccounts(component);
        }
    },
    
    refreshAccounts: function(component, event, helper) {
        helper.loadAccounts(component);
    }
})
