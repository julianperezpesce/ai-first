#!/bin/bash

# E2E Test Runner for ai-first-cli
# Runs all commands on all test projects

set -e

CLI="node dist/commands/ai-first.js"
PROJECTS=(
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

echo "========================================"
echo "ai-first-cli E2E Test Suite"
echo "========================================"

# Build first
echo "Building..."
npm run build

# Test each command on each project
for project in "${PROJECTS[@]}"; do
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
