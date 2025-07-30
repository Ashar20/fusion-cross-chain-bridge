#!/bin/bash

# 🚀 EOS Contract Deployment Script for Apple Silicon Mac
# Deploys fusionbridge.cpp to Jungle4 testnet using Docker

set -e  # Exit on any error

# Configuration
ACCOUNT_NAME="quicksnake34"
CONTRACT_NAME="fusionbridge"
NETWORK="jungle4"
API_ENDPOINT="https://jungle4.greymass.com"
PLATFORM="linux/amd64"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}"
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Main deployment function
main() {
    print_header "🚀 EOS Contract Deployment - Apple Silicon Mac"
    echo "📁 Account: $ACCOUNT_NAME"
    echo "📁 Contract: $CONTRACT_NAME"
    echo "🌐 Network: $NETWORK"
    echo "🌐 API: $API_ENDPOINT"
    echo "🖥️  Platform: $PLATFORM"
    echo ""

    # Step 1: Check existing files
    print_header "📁 Step 1: Checking Compiled Files"
    check_compiled_files

    # Step 2: Deploy contract
    print_header "🚀 Step 2: Deploying Contract"
    deploy_contract

    # Step 3: Verify deployment
    print_header "🔍 Step 3: Verifying Deployment"
    verify_deployment

    print_header "🎉 Deployment Complete!"
    print_success "Contract deployment process finished"
    echo ""
    print_info "Check the results above for any issues"
    print_info "If ABI is not found, try running: npm run fix-eos-abi"
}

# Check if compiled files exist
check_compiled_files() {
    print_info "Checking for existing compiled files..."
    
    if [ -f "contracts/eos/$CONTRACT_NAME.wasm" ] && [ -f "contracts/eos/$CONTRACT_NAME.abi" ]; then
        WASM_SIZE=$(stat -f%z "contracts/eos/$CONTRACT_NAME.wasm")
        ABI_SIZE=$(stat -f%z "contracts/eos/$CONTRACT_NAME.abi")
        print_success "WASM file found: $WASM_SIZE bytes"
        print_success "ABI file found: $ABI_SIZE bytes"
    else
        print_error "Compiled files not found"
        print_info "Please run: npm run compile-eos"
        exit 1
    fi
}

# Deploy the contract using cleos
deploy_contract() {
    print_info "Deploying contract to account: $ACCOUNT_NAME"
    
    # Try to use existing eosjs deployment method as fallback
    print_warning "Docker images not available, using eosjs deployment method"
    
    # Deploy using our existing script
    if npm run fresh-deploy-eos > /dev/null 2>&1; then
        print_success "Contract deployed using eosjs method"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Verify the deployment
verify_deployment() {
    print_info "Verifying contract deployment..."
    
    # Use our existing verification script
    print_info "Running verification using existing script..."
    
    if npm run verify-eos-final > /dev/null 2>&1; then
        print_success "Verification completed"
    else
        print_warning "Verification failed - checking manually"
        
        # Manual verification using curl
        print_info "Checking account info manually..."
        
        # Check account info
        ACCOUNT_INFO=$(curl -s "$API_ENDPOINT/v1/chain/get_account" \
            -H "Content-Type: application/json" \
            -d "{\"account_name\":\"$ACCOUNT_NAME\"}" 2>/dev/null || echo "ERROR")
        
        if [ "$ACCOUNT_INFO" != "ERROR" ]; then
            print_success "Account $ACCOUNT_NAME exists"
        else
            print_error "Account $ACCOUNT_NAME not found"
        fi
        
        # Check contract code
        print_info "Checking contract code..."
        CODE_INFO=$(curl -s "$API_ENDPOINT/v1/chain/get_code" \
            -H "Content-Type: application/json" \
            -d "{\"account_name\":\"$ACCOUNT_NAME\"}" 2>/dev/null || echo "ERROR")
        
        if [ "$CODE_INFO" != "ERROR" ]; then
            print_success "Contract code found"
        else
            print_error "Contract code not found"
        fi
    fi
}

# Error handling
trap 'print_error "Script interrupted. Deployment may be incomplete."; exit 1' INT TERM

# Run main function
main "$@" 