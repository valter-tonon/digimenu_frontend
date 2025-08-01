#!/bin/bash

# Setup Test Database Script
# This script sets up the test database with required data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Database configuration
DB_HOST=${DB_HOST:-mysql}
DB_PORT=${DB_PORT:-3306}
DB_USERNAME=${DB_USERNAME:-sail}
DB_PASSWORD=${DB_PASSWORD:-password}
DB_DATABASE=${DB_DATABASE:-testing}

# Check if we're running in Docker
if [[ -f /.dockerenv ]]; then
    DOCKER_MODE=true
    print_status "Running in Docker container"
else
    DOCKER_MODE=false
    print_status "Running on host system"
fi

# Function to wait for database
wait_for_database() {
    print_status "Waiting for database to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
            print_success "Database is ready!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - Database not ready, waiting..."
        sleep 2
        ((attempt++))
    done
    
    print_error "Database is not ready after $max_attempts attempts"
    return 1
}

# Function to create test database if it doesn't exist
create_test_database() {
    print_status "Creating test database if it doesn't exist..."
    
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$DB_DATABASE\`;"
    
    if [[ $? -eq 0 ]]; then
        print_success "Test database '$DB_DATABASE' is ready"
    else
        print_error "Failed to create test database"
        return 1
    fi
}

# Function to run migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if [[ "$DOCKER_MODE" == true ]]; then
        # We're inside the frontend container, need to call Laravel container
        print_status "Running migrations via Laravel container..."
        # This would need to be called from the main docker-compose context
        print_warning "Migrations should be run from the Laravel container"
        print_warning "Run: docker-compose exec laravel.test php artisan migrate --database=testing"
    else
        # Running on host, assume Laravel is available
        if command -v php > /dev/null && [[ -f "../artisan" ]]; then
            cd .. && php artisan migrate --database=testing
            cd frontend
        else
            print_warning "Laravel not found on host system"
            print_warning "Please run migrations manually: php artisan migrate --database=testing"
        fi
    fi
}

# Function to seed test data
seed_test_data() {
    print_status "Seeding test data..."
    
    local script_path="./scripts/seed-test-db.sql"
    
    if [[ ! -f "$script_path" ]]; then
        print_error "Seed script not found: $script_path"
        return 1
    fi
    
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" < "$script_path"
    
    if [[ $? -eq 0 ]]; then
        print_success "Test data seeded successfully"
    else
        print_error "Failed to seed test data"
        return 1
    fi
}

# Function to verify test data
verify_test_data() {
    print_status "Verifying test data..."
    
    local tenant_count=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" -D"$DB_DATABASE" -se "SELECT COUNT(*) FROM tenants WHERE uuid = '02efe224-e368-4a7a-a153-5fc49cd9c5ac';")
    local product_count=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" -D"$DB_DATABASE" -se "SELECT COUNT(*) FROM products;")
    local category_count=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" -D"$DB_DATABASE" -se "SELECT COUNT(*) FROM categories;")
    
    print_status "Test tenant count: $tenant_count"
    print_status "Test product count: $product_count"
    print_status "Test category count: $category_count"
    
    if [[ "$tenant_count" -eq 1 && "$product_count" -ge 4 && "$category_count" -ge 3 ]]; then
        print_success "Test data verification passed"
        return 0
    else
        print_error "Test data verification failed"
        return 1
    fi
}

# Main execution
main() {
    print_status "Setting up test database..."
    
    # Wait for database to be ready
    if ! wait_for_database; then
        exit 1
    fi
    
    # Create test database
    if ! create_test_database; then
        exit 1
    fi
    
    # Run migrations
    run_migrations
    
    # Seed test data
    if ! seed_test_data; then
        exit 1
    fi
    
    # Verify test data
    if ! verify_test_data; then
        exit 1
    fi
    
    print_success "Test database setup completed successfully!"
}

# Run main function
main "$@"