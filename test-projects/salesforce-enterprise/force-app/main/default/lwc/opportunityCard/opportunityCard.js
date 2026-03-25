import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import OPP_NAME from '@salesforce/schema/Opportunity.Name';
import OPP_STAGE from '@salesforce/schema/Opportunity.StageName';
import OPP_AMOUNT from '@salesforce/schema/Opportunity.Amount';
import OPP_CLOSE_DATE from '@salesforce/schema/Opportunity.CloseDate';
import OPP_ACCOUNT_NAME from '@salesforce/schema/Opportunity.Account.Name';

export default class OpportunityCard extends NavigationMixin(LightningElement) {
    @api recordId;
    @track opportunity = {};
    @track isLoading = false;

    @wire(getRecord, { recordId: '$recordId', fields: [OPP_NAME, OPP_STAGE, OPP_AMOUNT, OPP_CLOSE_DATE, OPP_ACCOUNT_NAME] })
    opportunityRecord;

    get name() {
        return getFieldValue(this.opportunityRecord.data, OPP_NAME);
    }

    get stage() {
        return getFieldValue(this.opportunityRecord.data, OPP_STAGE);
    }

    get amount() {
        return getFieldValue(this.opportunityRecord.data, OPP_AMOUNT);
    }

    get closeDate() {
        return getFieldValue(this.opportunityRecord.data, OPP_CLOSE_DATE);
    }

    get accountName() {
        return getFieldValue(this.opportunityRecord.data, OPP_ACCOUNT_NAME);
    }

    get stageColor() {
        const stageMap = {
            'Prospecting': 'slds-theme_warning',
            'Qualification': 'slds-theme_info',
            'Closed Won': 'slds-theme_success',
            'Closed Lost': 'slds-theme_error'
        };
        return stageMap[this.stage] || '';
    }

    get formattedAmount() {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(this.amount || 0);
    }

    get formattedCloseDate() {
        if (!this.closeDate) return '';
        return new Date(this.closeDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    get daysUntilClose() {
        if (!this.closeDate) return null;
        const today = new Date();
        const close = new Date(this.closeDate);
        const diffTime = close - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    get urgencyClass() {
        const days = this.daysUntilClose;
        if (days === null) return '';
        if (days < 0) return 'urgency-past';
        if (days < 7) return 'urgency-critical';
        if (days < 30) return 'urgency-warning';
        return 'urgency-normal';
    }

    handleViewRecord() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                actionName: 'view'
            }
        });
    }

    handleEditRecord() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                actionName: 'edit'
            }
        });
    }
}
