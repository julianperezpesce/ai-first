import { LightningElement, wire, track } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class AccountList extends LightningElement {
    @track accounts = [];
    @track filteredAccounts = [];
    @track searchTerm = '';
    @track industryFilter = '';
    @track isLoading = false;
    @track error = null;
    
    @track industries = [
        { value: '', label: 'All Industries' },
        { value: 'Technology', label: 'Technology' },
        { value: 'Healthcare', label: 'Healthcare' },
        { value: 'Finance', label: 'Finance' },
        { value: 'Manufacturing', label: 'Manufacturing' },
        { value: 'Retail', label: 'Retail' }
    ];

    @wire(getAccounts, { searchTerm: '$searchTerm', industryFilter: '$industryFilter' })
    wiredAccounts({ error, data }) {
        if (data) {
            this.accounts = data;
            this.filteredAccounts = data;
            this.error = null;
        } else if (error) {
            this.error = error.body ? error.body.message : 'Unknown error';
            this.showToast('Error', this.error, 'error');
        }
    }

    handleSearchTermChange(event) {
        this.isLoading = true;
        this.searchTerm = event.target.value;
        setTimeout(() => {
            this.isLoading = false;
        }, 300);
    }

    handleIndustryChange(event) {
        this.industryFilter = event.target.value;
    }

    handleRefresh() {
        this.searchTerm = '';
        this.industryFilter = '';
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
        }, 500);
    }

    handleAccountClick(event) {
        const accountId = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('accountselect', {
            detail: { accountId }
        }));
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }

    get hasAccounts() {
        return this.filteredAccounts && this.filteredAccounts.length > 0;
    }
}
