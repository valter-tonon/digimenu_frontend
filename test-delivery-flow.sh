#!/bin/bash

# Frontend Testing Suite - Delivery Flow Test Runner
# This script runs different types of tests for the delivery flow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"
COVERAGE=false
WATCH=false
DOCKER=false
VERBOSE=false
HEADLESS=true

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE        Test type: unit, integration, e2e, all (default: all)"
    echo "  -c, --coverage         Run with coverage report"
    echo "  -w, --watch           Run in watch mode"
    echo "  -d, --docker          Run tests inside Docker container"
    echo "  -v, --verbose         Verbose output"
    echo "  -h, --headless        Run E2E tests in headless mode (default: true)"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -t unit -c                    # Run unit tests with coverage"
    echo "  $0 -t e2e --no-headless         # Run E2E tests with browser UI"
    echo "  $0 -d -t all -c                 # Run all tests with coverage in Docker"
    echo "  $0 -w -t unit                   # Run unit tests in watch mode"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TEST_TYPE="$2"
            shift 2
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -w|--watch)
            WATCH=true
            shift
            ;;
        -d|--docker)
            DOCKER=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--headless)
            HEADLESS=true
            shift
            ;;
        --no-headless)
            HEADLESS=false
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate test type
if [[ ! "$TEST_TYPE" =~ ^(unit|integration|e2e|all)$ ]]; then
    print_error "Invalid test type: $TEST_TYPE"
    print_error "Valid types: unit, integration, e2e, all"
    exit 1
fi

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to check if services are running
check_services() {
    print_status "Checking if required services are running..."
    
    if [[ "$DOCKER" == true ]]; then
        check_docker
        
        # Check if containers are running
        if ! docker-compose ps | grep -q "frontend.*Up"; then
            print_warning "Frontend container is not running. Starting services..."
            docker-compose up -d frontend
            sleep 10
        fi
        
        if ! docker-compose ps | grep -q "laravel.test.*Up"; then
            print_warning "Backend container is not running. Starting services..."
            docker-compose up -d laravel.test
            sleep 10
        fi
    else
        # Check if services are running locally
        if ! curl -s http://localhost:3000 > /dev/null; then
            print_warning "Frontend is not running on localhost:3000"
            print_warning "Please start the frontend with: npm run dev"
        fi
        
        if ! curl -s http://localhost:80 > /dev/null; then
            print_warning "Backend is not running on localhost:80"
            print_warning "Please start the backend services"
        fi
    fi
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    local cmd="npm run test:unit"
    
    if [[ "$COVERAGE" == true ]]; then
        cmd="npm run test:coverage -- src/__tests__/unit"
    fi
    
    if [[ "$WATCH" == true ]]; then
        cmd="$cmd -- --watch"
    fi
    
    if [[ "$VERBOSE" == true ]]; then
        cmd="$cmd -- --reporter=verbose"
    fi
    
    if [[ "$DOCKER" == true ]]; then
        docker-compose exec frontend $cmd
    else
        eval $cmd
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    local cmd="npm run test:integration"
    
    if [[ "$COVERAGE" == true ]]; then
        cmd="npm run test:coverage -- src/__tests__/integration"
    fi
    
    if [[ "$WATCH" == true ]]; then
        cmd="$cmd -- --watch"
    fi
    
    if [[ "$VERBOSE" == true ]]; then
        cmd="$cmd -- --reporter=verbose"
    fi
    
    if [[ "$DOCKER" == true ]]; then
        docker-compose exec frontend $cmd
    else
        eval $cmd
    fi
}

# Function to run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."
    
    # Ensure services are running for E2E tests
    check_services
    
    local cmd="npx playwright test"
    
    if [[ "$HEADLESS" == false ]]; then
        cmd="$cmd --headed"
    fi
    
    if [[ "$VERBOSE" == true ]]; then
        cmd="$cmd --reporter=list"
    fi
    
    # Add specific E2E test directory
    cmd="$cmd src/__tests__/e2e"
    
    if [[ "$DOCKER" == true ]]; then
        docker-compose exec frontend $cmd
    else
        eval $cmd
    fi
}

# Function to generate test report
generate_report() {
    print_status "Generating test reports..."
    
    if [[ "$COVERAGE" == true ]]; then
        print_status "Coverage report available at: coverage/index.html"
    fi
    
    if [[ "$TEST_TYPE" == "e2e" || "$TEST_TYPE" == "all" ]]; then
        print_status "E2E test report available at: playwright-report/index.html"
    fi
}

# Function to setup test environment
setup_test_env() {
    print_status "Setting up test environment..."
    
    # Set test environment variables
    export NODE_ENV=test
    export NEXT_PUBLIC_API_URL=http://laravel.test/api/v1
    export NEXT_PUBLIC_API_BASE_URL=http://laravel.test
    
    if [[ "$DOCKER" == true ]]; then
        export NEXT_PUBLIC_API_URL=http://laravel.test/api/v1
        export NEXT_PUBLIC_API_BASE_URL=http://laravel.test
    fi
    
    print_status "Environment variables set for testing"
}

# Function to cleanup after tests
cleanup() {
    print_status "Cleaning up test environment..."
    
    # Kill any hanging processes
    pkill -f "vitest" || true
    pkill -f "playwright" || true
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_status "Starting Frontend Testing Suite - Delivery Flow"
    print_status "Test Type: $TEST_TYPE"
    print_status "Coverage: $COVERAGE"
    print_status "Watch Mode: $WATCH"
    print_status "Docker Mode: $DOCKER"
    print_status "Verbose: $VERBOSE"
    
    # Setup trap for cleanup
    trap cleanup EXIT
    
    # Setup test environment
    setup_test_env
    
    # Install dependencies if needed
    if [[ "$DOCKER" == true ]]; then
        print_status "Installing dependencies in Docker..."
        docker-compose exec frontend npm install
    else
        if [[ ! -d "node_modules" ]]; then
            print_status "Installing dependencies..."
            npm install
        fi
    fi
    
    # Run tests based on type
    case $TEST_TYPE in
        "unit")
            run_unit_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "all")
            print_status "Running all test types..."
            run_unit_tests
            print_success "Unit tests completed"
            
            run_integration_tests
            print_success "Integration tests completed"
            
            run_e2e_tests
            print_success "E2E tests completed"
            ;;
    esac
    
    # Generate reports
    generate_report
    
    print_success "All tests completed successfully!"
}

# Run main function
main "$@"