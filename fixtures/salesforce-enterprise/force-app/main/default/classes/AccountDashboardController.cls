/**
 * AccountDashboardController - Controller for Account Dashboard Visualforce page
 * @description Provides data and actions for the account dashboard
 * @group Visualforce
 */
public class AccountDashboardController {
    
    public List<Account> accounts { get; set; }
    public String selectedIndustry { get; set; }
    public String searchTerm { get; set; }
    public Integer totalAccounts { get; set; }
    public Decimal totalRevenue { get; set; }
    public Decimal averageRevenue { get; set; }
    public String topIndustry { get; set; }
    
    public AccountDashboardController() {
        selectedIndustry = '';
        searchTerm = '';
        loadDashboardData();
    }
    
    public void loadDashboardData() {
        accounts = [SELECT Id, Name, Industry, AnnualRevenue, BillingCity, Type 
                   FROM Account 
                   WHERE AnnualRevenue != null 
                   ORDER BY AnnualRevenue DESC 
                   LIMIT 100];
        
        totalAccounts = [SELECT COUNT() FROM Account];
        
        AggregateResult[] revenueResults = [SELECT SUM(AnnualRevenue) totalRev, AVG(AnnualRevenue) avgRev 
                                           FROM Account WHERE AnnualRevenue != null];
        
        if (!revenueResults.isEmpty()) {
            totalRevenue = (Decimal) revenueResults[0].get('totalRev');
            averageRevenue = (Decimal) revenueResults[0].get('avgRev');
        }
        
        AggregateResult[] industryResults = [SELECT Industry, COUNT(Id) cnt 
                                            FROM Account 
                                            WHERE Industry != null 
                                            GROUP BY Industry 
                                            ORDER BY COUNT(Id) DESC 
                                            LIMIT 1];
        
        if (!industryResults.isEmpty()) {
            topIndustry = (String) industryResults[0].get('Industry');
        }
    }
    
    public List<SelectOption> getIndustryOptions() {
        List<SelectOption> options = new List<SelectOption>();
        Set<String> industries = new Set<String>();
        
        for (Account acc : [SELECT DISTINCT Industry FROM Account WHERE Industry != null]) {
            industries.add(acc.Industry);
        }
        
        for (String industry : industries) {
            options.add(new SelectOption(industry, industry));
        }
        
        return options;
    }
    
    public PageReference refreshData() {
        loadDashboardData();
        return null;
    }
    
    public void searchAccounts() {
        String searchQuery = '%' + searchTerm + '%';
        accounts = [SELECT Id, Name, Industry, AnnualRevenue, BillingCity, Type 
                   FROM Account 
                   WHERE Name LIKE :searchQuery 
                   AND (Industry = :selectedIndustry OR :selectedIndustry = '')
                   ORDER BY Name 
                   LIMIT 100];
    }
    
    public PageReference exportToCSV() {
        String csv = 'Id,Name,Industry,AnnualRevenue,BillingCity,Type\n';
        
        for (Account acc : accounts) {
            csv += '"' + acc.Id + '","' + acc.Name + '","' + acc.Industry + '","' + 
                   acc.AnnualRevenue + '","' + acc.BillingCity + '","' + acc.Type + '"\n';
        }
        
        PageReference pageRef = new PageReference('data:text/csv;charset=utf-8,' + EncodingUtil.urlEncode(csv, 'UTF-8'));
        pageRef.setRedirect(true);
        return pageRef;
    }
}
