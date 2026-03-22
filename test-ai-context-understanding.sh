#!/bin/bash
# Test: Ask AI to understand project from ai-context
# Usage: ./test-ai-context-understanding.sh [project-path]

PROJECT_DIR="${1:-.}"

echo "=== Testing AI Context Understanding ==="
echo ""

CONTEXT=$(cat "$PROJECT_DIR/ai-context/ai_context.md" 2>/dev/null)
if [ -z "$CONTEXT" ]; then
    echo "Error: No ai-context found in $PROJECT_DIR"
    exit 1
fi

echo "Project Context:"
echo "---"
echo "$CONTEXT"
echo "---"
echo ""
echo "Ask an AI: 'What does this project do based on the context above?'"
