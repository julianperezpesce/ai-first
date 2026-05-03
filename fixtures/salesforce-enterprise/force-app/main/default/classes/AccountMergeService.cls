/**
 * AccountMergeService - Invocable method for merging duplicate accounts
 * @description Provides invocable methods for Flow-based account merging
 * @group Automation
 */
public class AccountMergeService {
    
    /**
     * @description Invocable method to merge duplicate accounts
     * @param requests List of merge requests from Flow
     * @return List of merge results
     */
    @InvocableMethod(label='Merge Duplicate Accounts' 
                     description='Merges duplicate accounts and reassigns related records'
                     category='Account Management')
    public static List<MergeResult> mergeAccounts(List<MergeRequest> requests) {
        List<MergeResult> results = new List<MergeResult>();
        
        for (MergeRequest request : requests) {
            MergeResult result = new MergeResult();
            try {
                Account masterAccount = [SELECT Id, Name FROM Account WHERE Id = :request.masterAccountId LIMIT 1];
                Account duplicateAccount = [SELECT Id, Name FROM Account WHERE Id = :request.duplicateAccountId LIMIT 1];
                
                merge masterAccount duplicateAccount;
                
                result.isSuccess = true;
                result.masterAccountId = request.masterAccountId;
                result.message = 'Successfully merged ' + duplicateAccount.Name + ' into ' + masterAccount.Name;
            } catch (Exception e) {
                result.isSuccess = false;
                result.message = 'Error merging accounts: ' + e.getMessage();
            }
            results.add(result);
        }
        
        return results;
    }
    
    /**
     * @description Input wrapper for invocable method
     */
    public class MergeRequest {
        @InvocableVariable(label='Master Account ID' description='The account to merge into' required=true)
        public Id masterAccountId;
        
        @InvocableVariable(label='Duplicate Account ID' description='The account to merge from' required=true)
        public Id duplicateAccountId;
        
        @InvocableVariable(label='Reassign Contacts' description='Whether to reassign contacts to master account')
        public Boolean reassignContacts = true;
        
        @InvocableVariable(label='Reassign Opportunities' description='Whether to reassign opportunities to master account')
        public Boolean reassignOpportunities = true;
    }
    
    /**
     * @description Output wrapper for invocable method
     */
    public class MergeResult {
        @InvocableVariable(label='Is Success' description='Whether the merge was successful')
        public Boolean isSuccess;
        
        @InvocableVariable(label='Master Account ID' description='The merged account ID')
        public Id masterAccountId;
        
        @InvocableVariable(label='Message' description='Result message')
        public String message;
    }
}
