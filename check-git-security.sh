#!/bin/bash

# Git Security Checker
# Checks if any sensitive files are being tracked by Git

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header "GIT SECURITY CHECK"

echo "Checking for sensitive files in Git repository..."
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a Git repository"
    exit 1
fi

# Check for .env files being tracked
echo "🔍 Checking for .env files..."
env_files=$(git ls-files | grep -E '\.env' || true)

if [ -z "$env_files" ]; then
    print_success "No .env files are being tracked by Git"
else
    print_error "Found .env files being tracked:"
    echo "$env_files" | while read file; do
        echo "  - $file"
    done
    echo ""
    echo "To remove them from Git (but keep locally):"
    echo "$env_files" | while read file; do
        echo "  git rm --cached \"$file\""
    done
fi

# Check for other sensitive patterns
echo ""
echo "🔍 Checking for other sensitive files..."

sensitive_patterns=(
    "*.key"
    "*.pem"
    "*.p12"
    "*.pfx"
    "secrets.json"
    "keys.json"
    "**/secrets/*"
    "**/keys/*"
)

found_sensitive=false
for pattern in "${sensitive_patterns[@]}"; do
    files=$(git ls-files | grep -E "${pattern//\*/.*}" || true)
    if [ ! -z "$files" ]; then
        if [ "$found_sensitive" = false ]; then
            print_warning "Found potentially sensitive files:"
            found_sensitive=true
        fi
        echo "$files" | while read file; do
            echo "  - $file"
        done
    fi
done

if [ "$found_sensitive" = false ]; then
    print_success "No sensitive files found in Git tracking"
fi

# Check .gitignore effectiveness
echo ""
echo "🔍 Checking .gitignore effectiveness..."

if [ -f ".gitignore" ]; then
    print_success ".gitignore file exists"
    
    # Check if common patterns are ignored
    patterns_to_check=(
        ".env"
        "*.env"
        "**/.env*"
        "node_modules/"
        "*.log"
    )
    
    missing_patterns=()
    for pattern in "${patterns_to_check[@]}"; do
        if ! grep -q "$pattern" .gitignore; then
            missing_patterns+=("$pattern")
        fi
    done
    
    if [ ${#missing_patterns[@]} -eq 0 ]; then
        print_success "All important patterns are in .gitignore"
    else
        print_warning "Missing patterns in .gitignore:"
        for pattern in "${missing_patterns[@]}"; do
            echo "  - $pattern"
        done
    fi
else
    print_error ".gitignore file not found"
fi

# Check for untracked .env files
echo ""
echo "🔍 Checking for untracked .env files..."

untracked_env=$(find . -name "*.env*" -type f | grep -v node_modules | grep -v .git || true)

if [ ! -z "$untracked_env" ]; then
    print_success "Found untracked .env files (this is good):"
    echo "$untracked_env" | while read file; do
        echo "  - $file"
    done
else
    print_warning "No .env files found - make sure they exist for services to work"
fi

# Check for staged sensitive files
echo ""
echo "🔍 Checking staged files..."

staged_files=$(git diff --cached --name-only | grep -E '\.(env|key|pem|p12|pfx)' || true)

if [ -z "$staged_files" ]; then
    print_success "No sensitive files are staged for commit"
else
    print_error "Sensitive files are staged for commit:"
    echo "$staged_files" | while read file; do
        echo "  - $file"
    done
    echo ""
    echo "To unstage them:"
    echo "$staged_files" | while read file; do
        echo "  git reset HEAD \"$file\""
    done
fi

echo ""
print_header "SECURITY RECOMMENDATIONS"

echo "1. 🔒 Never commit .env files or API keys"
echo "2. 📝 Use .env.example files to document required variables"
echo "3. 🔄 Rotate any credentials that were accidentally committed"
echo "4. 🛡️  Use environment variables in production"
echo "5. 📋 Document setup process in README"

echo ""
echo "📚 Safe practices:"
echo "  - Copy .env.example to .env and fill in real values"
echo "  - Use different credentials for dev/staging/production"
echo "  - Store production secrets in secure vaults"
echo "  - Regular security audits"

echo ""
if [ -z "$env_files" ] && [ "$found_sensitive" = false ] && [ -z "$staged_files" ]; then
    print_success "Repository appears secure! 🎉"
else
    print_warning "Please review and fix security issues above"
fi
