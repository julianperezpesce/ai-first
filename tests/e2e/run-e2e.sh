#!/bin/bash

# E2E Test Runner for ai-first-cli
# Runs all commands on all test projects

set -e

CLI="node dist/commands/ai-first.js"
TEST_PROJECTS=(
  "android-kotlin-app"
  "django-app"
  "express-api"
  "fastapi-app"
  "flask-app"
  "go-microservice"
  "ios-swift-app"
  "laravel-app"
  "nestjs-backend"
  "php-vanilla"
  "python-cli"
  "rails-app"
  "react-app"
  "rust-cli"
  "salesforce-cli"
  "salesforce-enterprise"
  "spring-boot-app"
)

REAL_PROJECTS=(
  "django-rest-framework"
  "fastapi"
  "spring-petclinic"
  "go-zero"
  "filament"
)

REAL_PROJECTS_BASE="/home/julian/proyectos/ai-first-evaluator/real-projects"

echo "========================================"
echo "ai-first-cli E2E Test Suite"
echo "========================================"

# Build first
echo "Building..."
npm run build

# Test each command on each test project
for project in "${TEST_PROJECTS[@]}"; do
  echo ""
  echo "========================================"
  echo "Testing: $project"
  echo "========================================"
  
  # Clean ai-context directory
  rm -rf "test-projects/$project/ai-context"
   
   # Test init
   echo ""
   echo "--- init ---"
   $CLI init --root "test-projects/$project" || true
   
   # Test doctor
   echo ""
   echo "--- doctor ---"
   $CLI doctor --root "test-projects/$project" || true
   
   # Test map
   echo ""
   echo "--- map ---"
   $CLI map --root "test-projects/$project" || true
   
   # Test index
   echo ""
   echo "--- index ---"
   $CLI index --root "test-projects/$project" || true
   
   # Test explore
   echo ""
   echo "--- explore ---"
   $CLI explore all --root "test-projects/$project" || true
   
   # Test graph
   echo ""
   echo "--- graph ---"
   $CLI graph --root "test-projects/$project" || true
   
   # Test git
   echo ""
   echo "--- git ---"
   $CLI git --root "test-projects/$project" || true
   
   # Check results
   echo ""
   echo "--- Results ---"
   if [ -d "test-projects/$project/ai-context" ]; then
     echo "Files generated:"
     ls "test-projects/$project/ai-context/"
     
     if [ -d "test-projects/$project/ai-context/context/features" ]; then
       FEATURES=$(ls -1 "test-projects/$project/ai-context/context/features/" 2>/dev/null | wc -l)
       echo "Features: $FEATURES"
     fi
     
     if [ -d "test-projects/$project/ai-context/context/flows" ]; then
       FLOWS=$(ls -1 "test-projects/$project/ai-context/context/flows/" 2>/dev/null | wc -l)
       echo "Flows: $FLOWS"
     fi
    else
      echo "ERROR: No ai-context directory created"
    fi
done

# Test each command on each REAL project
for project in "${REAL_PROJECTS[@]}"; do
  echo ""
  echo "========================================"
  echo "Testing REAL: $project"
  echo "========================================"
  
  # Clean ai-context directory
  rm -rf "$REAL_PROJECTS_BASE/$project/ai-context"
   
   # Test init
   echo ""
   echo "--- init ---"
   $CLI init --root "$REAL_PROJECTS_BASE/$project" || true
   
   # Test doctor
   echo ""
   echo "--- doctor ---"
   $CLI doctor --root "$REAL_PROJECTS_BASE/$project" || true
   
   # Test map
   echo ""
   echo "--- map ---"
   $CLI map --root "$REAL_PROJECTS_BASE/$project" || true
   
   # Test index
   echo ""
   echo "--- index ---"
   $CLI index --root "$REAL_PROJECTS_BASE/$project" || true
   
   # Test explore
   echo ""
   echo "--- explore ---"
   $CLI explore all --root "$REAL_PROJECTS_BASE/$project" || true
   
   # Test graph
   echo ""
   echo "--- graph ---"
   $CLI graph --root "$REAL_PROJECTS_BASE/$project" || true
   
   # Test git
   echo ""
   echo "--- git ---"
   $CLI git --root "$REAL_PROJECTS_BASE/$project" || true
   
   # Check results
   echo ""
   echo "--- Results ---"
   if [ -d "$REAL_PROJECTS_BASE/$project/ai-context" ]; then
     echo "Files generated:"
     ls "$REAL_PROJECTS_BASE/$project/ai-context/"
   else
     echo "ERROR: No ai-context directory created"
   fi
done

echo ""
echo "========================================"
echo "E2E Tests Complete"
echo "========================================"

# MCP E2E Tests
echo ""
echo "========================================"
echo "MCP E2E Tests"
echo "========================================"

# Test MCP install
echo ""
echo "--- MCP install on express-api ---"
rm -rf "test-projects/express-api/.opencode"
$CLI init --root "test-projects/express-api" --install-mcp || true

if [ -f "test-projects/express-api/.opencode/mcp.json" ]; then
  echo "✅ .opencode/mcp.json created successfully"
  cat "test-projects/express-api/.opencode/mcp.json"
else
  echo "❌ .opencode/mcp.json NOT created"
fi

echo ""
echo "--- MCP install on django-app ---"
rm -rf "test-projects/django-app/.opencode"
$CLI init --root "test-projects/django-app" --install-mcp || true

if [ -f "test-projects/django-app/.opencode/mcp.json" ]; then
  echo "✅ .opencode/mcp.json created successfully"
else
  echo "❌ .opencode/mcp.json NOT created"
fi

echo ""
echo "========================================"
echo "Format Verification Tests"
echo "========================================"

# Verify entrypoints.md uses ### headers
echo ""
echo "--- Verifying entrypoints.md format ---"
if grep -q "^### " test-projects/express-api/ai-context/entrypoints.md; then
  echo "✅ entrypoints.md uses ### headers"
else
  echo "❌ entrypoints.md does NOT use ### headers"
fi

# Verify summary.md has Overview section
echo ""
echo "--- Verifying summary.md has Overview ---"
if grep -q "^## Overview" test-projects/express-api/ai-context/summary.md; then
  echo "✅ summary.md has Overview section"
else
  echo "❌ summary.md missing Overview section"
fi

# Verify architecture.md has functional descriptions
echo ""
echo "--- Verifying architecture.md descriptions ---"
if grep -q "implementation\|handling\|middleware\|logic" test-projects/express-api/ai-context/architecture.md; then
  echo "✅ architecture.md has functional descriptions"
else
  echo "❌ architecture.md may have generic phrases"
fi

# Verify ai_rules.md has framework instructions
echo ""
echo "--- Verifying ai_rules.md has framework instructions ---"
if grep -q "Framework.*Instructions\|Express.*middleware\|NestJS.*decorators" test-projects/express-api/ai-context/ai_rules.md; then
  echo "✅ ai_rules.md has framework instructions for Express"
else
  echo "❌ ai_rules.md missing framework instructions"
fi

# Verify ai_rules.md has framework instructions for NestJS
if grep -q "NestJS.*module\|@Controller\|@Injectable" test-projects/nestjs-backend/ai-context/ai_rules.md; then
  echo "✅ ai_rules.md has framework instructions for NestJS"
else
  echo "❌ ai_rules.md missing NestJS framework instructions"
fi

# Verify ai_rules.md has framework instructions for Django
if grep -q "Django.*Models\|Framework Instructions" test-projects/django-app/ai-context/ai_rules.md; then
  echo "✅ ai_rules.md has framework instructions for Django"
else
  echo "❌ ai_rules.md missing Django framework instructions"
fi

# Verify API contracts for Express
echo ""
echo "--- Verifying API contracts for Express ---"
if grep -q "GET\|POST\|PUT\|DELETE" test-projects/express-api/ai-context/ai_rules.md; then
  echo "✅ Express API contracts detected"
else
  echo "❌ Express API contracts missing"
fi

# Verify API contracts for Django (ViewSets)
echo ""
echo "--- Verifying API contracts for Django ---"
if grep -q "ViewSet\|@action" test-projects/django-app/ai-context/ai_rules.md; then
  echo "✅ Django API contracts (ViewSets) detected"
else
  echo "❌ Django API contracts missing"
fi

# Verify API contracts for NestJS
echo ""
echo "--- Verifying API contracts for NestJS ---"
if grep -q "@Get\|@Post\|@Controller" test-projects/nestjs-backend/ai-context/ai_rules.md; then
  echo "✅ NestJS API contracts detected"
else
  echo "❌ NestJS API contracts missing"
fi

# Verify REAL PROJECTS ai_context was generated
echo ""
echo "========================================"
echo "REAL Projects Verification"
echo "========================================"

# Verify django-rest-framework
echo ""
echo "--- Verifying django-rest-framework ---"
if [ -f "$REAL_PROJECTS_BASE/django-rest-framework/ai-context/ai_context.md" ]; then
  echo "✅ django-rest-framework ai_context generated"
else
  echo "❌ django-rest-framework ai_context missing"
fi

# Verify fastapi
echo ""
echo "--- Verifying fastapi ---"
if [ -f "$REAL_PROJECTS_BASE/fastapi/ai-context/ai_context.md" ]; then
  echo "✅ fastapi ai_context generated"
else
  echo "❌ fastapi ai_context missing"
fi

# Verify spring-petclinic
echo ""
echo "--- Verifying spring-petclinic ---"
if [ -f "$REAL_PROJECTS_BASE/spring-petclinic/ai-context/ai_context.md" ]; then
  echo "✅ spring-petclinic ai_context generated"
else
  echo "❌ spring-petclinic ai_context missing"
fi

# Verify go-zero
echo ""
echo "--- Verifying go-zero ---"
if [ -f "$REAL_PROJECTS_BASE/go-zero/ai-context/ai_context.md" ]; then
  echo "✅ go-zero ai_context generated"
else
  echo "❌ go-zero ai_context missing"
fi

# Verify filament
echo ""
echo "--- Verifying filament ---"
if [ -f "$REAL_PROJECTS_BASE/filament/ai-context/ai_context.md" ]; then
  echo "✅ filament ai_context generated"
else
  echo "❌ filament ai_context missing"
fi
