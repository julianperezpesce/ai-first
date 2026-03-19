#!/usr/bin/env bash
# af (AI-First) Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/julianperezpesce/ai-first/master/install.sh | bash
set -e

AF_VERSION="${AF_VERSION:-1.2.2}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_step() { echo -e "${BLUE}→${NC} $1"; }

# Detect npm's global bin directory
get_npm_global_bin() {
    npm config get prefix --global 2>/dev/null
}

# Try to create symlink in a PATH directory
setup_symlink() {
    local src="$1"
    local name="af"
    
    # Try /usr/local/bin first (standard)
    if [ -w /usr/local/bin ] 2>/dev/null; then
        ln -sf "$src" /usr/local/bin/$name
        echo "/usr/local/bin/$name"
        return 0
    fi
    
    # Try ~/.local/bin (Freedesktop standard)
    if [ -w "$HOME/.local/bin" ] 2>/dev/null || mkdir -p "$HOME/.local/bin" 2>/dev/null; then
        ln -sf "$src" "$HOME/.local/bin/$name"
        echo "$HOME/.local/bin/$name"
        return 0
    fi
    
    # Try ~/bin (legacy)
    if [ -w "$HOME/bin" ] 2>/dev/null || mkdir -p "$HOME/bin" 2>/dev/null; then
        ln -sf "$src" "$HOME/bin/$name"
        echo "$HOME/bin/$name"
        return 0
    fi
    
    return 1
}

# Add directory to PATH in shell RC if not already present
ensure_path() {
    local dir="$1"
    local rcfile=""
    
    # Find the active shell RC file
    if [ -n "$ZSH_VERSION" ]; then
        rcfile="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        rcfile="$HOME/.bashrc"
    else
        rcfile="$HOME/.profile"
    fi
    
    # Check if dir is already in PATH
    if echo "$PATH" | tr ':' '\n' | grep -qx "$dir"; then
        return 0
    fi
    
    # Check if already added in RC
    if [ -f "$rcfile" ] && grep -q "$dir" "$rcfile" 2>/dev/null; then
        return 0
    fi
    
    # Add to RC
    echo "" >> "$rcfile"
    echo "# Added by ai-first-cli installer" >> "$rcfile"
    echo "export PATH=\"$dir:\$PATH\"" >> "$rcfile"
    
    log_warn "Added $dir to PATH in $rcfile"
    log_warn "Run: source $rcfile"
}

check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js not installed. Install Node.js 18+ first: https://nodejs.org"
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
    log_step "Installing af@${AF_VERSION}..."
    npm install -g "ai-first-cli@${AF_VERSION}" 2>&1
    log_info "npm install completed"
}

find_af_binary() {
    # Find the af binary in npm's global bin directory
    local prefix
    prefix=$(npm config get prefix --global 2>/dev/null || npm config get prefix 2>/dev/null)
    
    if [ -n "$prefix" ] && [ -f "$prefix/bin/af" ]; then
        echo "$prefix/bin/af"
        return 0
    fi
    
    if [ -n "$prefix" ] && [ -f "$prefix/bin/ai-first" ]; then
        echo "$prefix/bin/ai-first"
        return 0
    fi
    
    # Try common locations
    for dir in "$prefix/bin" "$HOME/.npm-global/bin" "/usr/local/bin" "$HOME/.local/bin" "$HOME/bin"; do
        if [ -f "$dir/af" ]; then
            echo "$dir/af"
            return 0
        fi
        if [ -f "$dir/ai-first" ]; then
            echo "$dir/ai-first"
            return 0
        fi
    done
    
    return 1
}

verify_install() {
    log_step "Verifying installation..."
    
    local af_path
    af_path=$(find_af_binary) || {
        log_error "Could not find af binary after installation"
        log_error "npm prefix: $(npm config get prefix 2>/dev/null)"
        exit 1
    }
    
    log_info "Found af at: $af_path"
    
    # Try to create symlink in PATH
    local symlink
    if symlink=$(setup_symlink "$af_path"); then
        log_info "Created symlink: $symlink"
    else
        log_warn "Could not create symlink in standard PATH location"
        # Try adding the binary's directory to PATH
        local bindir
        bindir=$(dirname "$af_path")
        ensure_path "$bindir"
    fi
    
    echo ""
    echo "  ╔══════════════════════════════════════╗"
    echo "  ║       af installation complete!     ║"
    echo "  ╚══════════════════════════════════════╝"
    echo ""
    echo "  Commands:"
    echo "    af init          Initialize AI context"
    echo "    af index         Generate SQLite index"
    echo "    af doctor        Check repository health"
    echo "    af --help        Show all commands"
    echo ""
    echo "  Quick start:"
    echo "    af init          # Generate context files"
    echo "    af doctor        # Check repository health"
    echo ""
}

echo ""
echo "  ██╗  ██╗ ██████╗ ████████╗███████╗"
echo "  ██║  ██║██╔═══██╗╚══██╔══╝██╔════╝"
echo "  ███████║██║   ██║   ██║   █████╗  "
echo "  ██╔══██║██║   ██║   ██║   ██╔══╝  "
echo "  ██║  ██║╚██████╔╝   ██║   ███████╗"
echo "  ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚══════╝"
echo "  AI-First CLI Installer v${AF_VERSION}"
echo ""

check_node
install_af
verify_install
