#!/bin/bash

# E2E Test Runner for ai-first-cli
# Runs all commands on all test projects

set -e

CLI="node dist/commands/ai-first.js"
PROJECTS=("express-api" "nestjs-backend" "python-cli" "react-app")

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
  
  # Clean ai directory
  rm -rf "test-projects/$project/ai"
  
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
  if [ -d "test-projects/$project/ai" ]; then
    echo "Files generated:"
    ls "test-projects/$project/ai/"
    
    if [ -d "test-projects/$project/ai/context/features" ]; then
      FEATURES=$(ls -1 "test-projects/$project/ai/context/features/" 2>/dev/null | wc -l)
      echo "Features: $FEATURES"
    fi
    
    if [ -d "test-projects/$project/ai/context/flows" ]; then
      FLOWS=$(ls -1 "test-projects/$project/ai/context/flows/" 2>/dev/null | wc -l)
      echo "Flows: $FLOWS"
    fi
  else
    echo "ERROR: No ai directory created"
  fi
done

echo ""
echo "========================================"
echo "E2E Tests Complete"
echo "========================================"
