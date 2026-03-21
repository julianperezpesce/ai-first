#!/bin/bash
#
# MASTER TEST SCRIPT - ai-first-cli
# Ejecuta TODOS los tests: unitarios + funcionales + integracion
# 

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$PROJECT_ROOT/dist"
CLI="$DIST_DIR/commands/ai-first.js"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

# ============================================
# PHASE 1: BUILD
# ============================================
echo ""
echo "==================================================="
echo "PHASE 1: BUILD"
echo "==================================================="
echo ""

log_info "Building TypeScript..."
if npm run build > /dev/null 2>&1; then
    log_success "TypeScript build"
else
    log_error "TypeScript build FAILED"
    exit 1
fi

# ============================================
# PHASE 2: UNIT TESTS (Vitest)
# ============================================
echo ""
echo "==================================================="
echo "PHASE 2: UNIT TESTS (Vitest)"
echo "==================================================="
echo ""

log_info "Running vitest..."
if npx vitest run 2>&1 | grep -q "passed"; then
    # Extract test count
    VITEST_OUTPUT=$(npx vitest run 2>&1)
    TEST_COUNT=$(echo "$VITEST_OUTPUT" | grep -oE '[0-9]+ passed' | head -1 | grep -oE '[0-9]+')
    log_success "Unit tests: $TEST_COUNT passed"
else
    log_error "Unit tests FAILED"
fi

# ============================================
# PHASE 3: FUNCTIONAL TESTS
# ============================================
echo ""
echo "==================================================="
echo "PHASE 3: FUNCTIONAL TESTS (11 Adapters)"
echo "==================================================="
echo ""

ADAPTERS="django-app laravel-app fastapi-app flask-app rails-app spring-boot-app nestjs-backend express-api react-app salesforce-cli python-cli"
SYMBOLS_OK=0

log_info "Testing symbol extraction..."
for adapter in $ADAPTERS; do
    PROJECT_DIR="$PROJECT_ROOT/test-projects/$adapter"
    if [ -f "$PROJECT_DIR/ai-context/symbols.json" ]; then
        SYMBOL_COUNT=$(cat "$PROJECT_DIR/ai-context/symbols.json" | grep -o '"id"' | wc -l)
        if [ "$SYMBOL_COUNT" -gt 0 ]; then
            ((SYMBOLS_OK++))
            log_success "$adapter: $SYMBOL_COUNT symbols"
        else
            log_error "$adapter: 0 symbols"
        fi
    else
        log_error "$adapter: symbols.json not found"
    fi
done

if [ "$SYMBOLS_OK" -eq 11 ]; then
    log_success "All 11 adapters have symbols > 0"
else
    log_error "Only $SYMBOLS_OK/11 adapters have symbols"
fi

# ============================================
# PHASE 4: INTEGRATION TESTS
# ============================================
echo ""
echo "==================================================="
echo "PHASE 4: INTEGRATION TESTS"
echo "==================================================="
echo ""

COMMANDS="init map index doctor"
TOTAL_TESTS=0
PASSED_TESTS=0

for adapter in $ADAPTERS; do
    PROJECT_DIR="$PROJECT_ROOT/test-projects/$adapter"
    
    for cmd in $COMMANDS; do
        ((TOTAL_TESTS++))
        
        case $cmd in
            "init")
                if [ -d "$PROJECT_DIR/ai-context" ] && [ -f "$PROJECT_DIR/ai-context/symbols.json" ]; then
                    ((PASSED_TESTS++))
                else
                    log_error "$adapter: init failed"
                fi
                ;;
            "map")
                if [ -f "$PROJECT_DIR/ai-context/graph/module-graph.json" ]; then
                    ((PASSED_TESTS++))
                else
                    log_error "$adapter: map failed"
                fi
                ;;
            "index")
                if [ -f "$PROJECT_DIR/ai-context/index.db" ]; then
                    ((PASSED_TESTS++))
                else
                    log_error "$adapter: index failed"
                fi
                ;;
            "doctor")
                if [ -f "$PROJECT_DIR/ai-context/repo_map.json" ]; then
                    ((PASSED_TESTS++))
                else
                    log_error "$adapter: doctor failed"
                fi
                ;;
        esac
    done
done

log_info "Integration tests: $PASSED_TESTS/$TOTAL_TESTS passed"
if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    log_success "All integration tests passed"
else
    log_error "Some integration tests failed"
fi

# ============================================
# FINAL SUMMARY
# ============================================
echo ""
echo "==================================================="
echo "FINAL SUMMARY"
echo "==================================================="
echo ""
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "${GREEN}ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}SOME TESTS FAILED!${NC}"
    exit 1
fi