#!/usr/bin/env bash
# af (AI-First) Installer - curl -fsSL https://raw.githubusercontent.com/julianperezpesce/ai-first/master/install.sh | bash
set -e

AF_VERSION="${AF_VERSION:-1.2.1}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js not installed. Install Node.js 18+ first."
        exit 1
    fi
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js 18+ required. Current: $(node -v)"
        exit 1
    fi
    log_info "Node.js $(node -v) detected"
}

install_af() {
    log_info "Installing af@${AF_VERSION}..."
    npm install -g "af@${AF_VERSION}"
    log_info "af installed successfully!"
}

verify_install() {
    if command -v af &> /dev/null; then
        echo ""
        echo "  af init          Initialize AI context"
        echo "  af index         Generate SQLite index"
        echo "  af doctor        Check repository health"
        echo "  af --help        Show all commands"
        echo ""
        log_info "Installation complete!"
    else
        log_error "Installation failed - af not in PATH"
        exit 1
    fi
}

echo ""
echo "  ██╗  ██╗ ██████╗ ████████╗███████╗"
echo "  ██║  ██║██╔═══██╗╚══██╔══╝██╔════╝"
echo "  ███████║██║   ██║   ██║   █████╗  "
echo "  ██╔══██║██║   ██║   ██║   ██╔══╝  "
echo "  ██║  ██║╚██████╔╝   ██║   ███████╗"
echo "  ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚══════╝"
echo "  AI-First CLI Installer"
echo ""

check_node
install_af
verify_install
