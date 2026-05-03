({
    loadAccounts: function(component) {
        component.set('v.isLoading', true);
        var action = component.get('c.getAccounts');
        action.setParams({
            searchTerm: component.get('v.searchTerm'),
            industryFilter: component.get('v.industryFilter')
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === 'SUCCESS') {
                component.set('v.accounts', response.getReturnValue());
            } else if (state === 'ERROR') {
                var errors = response.getError();
                if (errors && errors[0] && errors[0].message) {
                    console.error('Error: ' + errors[0].message);
                }
            }
            component.set('v.isLoading', false);
        });
        $A.enqueueAction(action);
    },
    
    debouncedSearch: function(component, searchTerm) {
        var timer = component.get('v.searchTimer');
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(function() {
            this.loadAccounts(component);
        }.bind(this), 300);
        component.set('v.searchTimer', timer);
    }
})
