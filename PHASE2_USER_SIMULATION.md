# Phase 2: User Simulation Results - Architecture & Entrypoints Fixes

## Test Setup
- **Project**: test-projects/salesforce-cli
- **Command**: `af init --root test-projects/salesforce-cli`
- **Date**: 2026-03-23

## Results

### ✅ architecture.md - "Contains 0 files" FIXED

**BEFORE**: Included incorrect entries like:
```
| sfdx-project.json | Contains 0 files |
| ANALISIS_COMPLETO.md | Contains 0 files |
| CHANGELOG.md | Contains 0 files |
```

**AFTER**: Only actual directories are shown:
```
| Module | Responsibility |
|--------|----------------|
| `.ai-dev` | Contains 25 files |
| `ai-context` | Contains 15 files |
| `force-app` | Contains 3 files |
```

### ✅ entrypoints.md - Salesforce Support ADDED

**BEFORE**: Empty entrypoints

**AFTER**:
```
## API

| Name | Path | Command |
|------|------|--------|
| AccountController | `force-app/main/default/classes/AccountController.cls` | - |
| OpportunityController | `force-app/main/default/classes/OpportunityController.cls` | - |
| AccountTrigger | `force-app/main/default/triggers/AccountTrigger.trigger` | - |
```

### ✅ tech_stack.md - Salesforce Info

```
**Languages**: Markdown, JSON, Apex, Apex Trigger
**Frameworks**: Salesforce DX, Salesforce

## Salesforce
- **API Version**: 58.0
- **Apex Classes**: 2
- **Triggers**: 1
- **SObjects**: Account
```

## Changes Made

### Fix 1: architecture.ts
```typescript
// Added check to skip root-level files misidentified as directories
if (moduleFiles.length === 0) {
  continue;
}
```

### Fix 2: entrypoints.ts
- Added `discoverSalesforceEntrypoints()` function
- Added `extractApexMethods()` helper
- Detects Apex classes and triggers
- Identifies annotated methods (@AuraEnabled, @RestResource, @webservice)

## Test Results

| Test Suite | Result |
|------------|--------|
| Unit Tests (169) | ✅ PASS |
| Adapter Functional Tests (11) | ✅ PASS |
| Salesforce User Simulation | ✅ PASS |

## Next Steps
- Phase 3: Universal Framework Detection (Android, iOS, Go, Rust, PHP)
