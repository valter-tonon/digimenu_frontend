-- Test Database Seeding Script
-- This script creates test data for the delivery flow tests

USE testing;

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE orders;
TRUNCATE TABLE order_items;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE tenants;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert test tenant
INSERT INTO tenants (
    id, 
    uuid, 
    name, 
    url, 
    logo, 
    is_open, 
    opens_at, 
    closes_at, 
    min_order_value, 
    delivery_fee, 
    estimated_delivery_time,
    created_at, 
    updated_at
) VALUES (
    1,
    '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
    'Empresa X',
    'empresa-x',
    NULL,
    1,
    '00:00:00',
    '23:59:00',
    20.00,
    5.00,
    '30-45 min',
    NOW(),
    NOW()
);

-- Insert test categories
INSERT INTO categories (
    id,
    name,
    slug,
    description,
    image,
    tenant_id,
    created_at,
    updated_at
) VALUES 
(1, 'Lanches', 'lanches', 'Deliciosos lanches', NULL, 1, NOW(), NOW()),
(2, 'Bebidas', 'bebidas', 'Bebidas refrescantes', NULL, 1, NOW(), NOW()),
(3, 'Sobremesas', 'sobremesas', 'Doces e sobremesas', NULL, 1, NOW(), NOW());

-- Insert test products
INSERT INTO products (
    id,
    uuid,
    name,
    description,
    price,
    promotional_price,
    is_featured,
    is_popular,
    is_on_promotion,
    category_id,
    tenant_id,
    image,
    tags,
    created_at,
    updated_at
) VALUES 
(
    1,
    'product-uuid-1',
    'X-Bacon',
    'Delicioso hambúrguer com bacon',
    30.00,
    NULL,
    1,
    0,
    0,
    1,
    1,
    'http://localhost/storage/test.webp',
    '["picante", "novo"]',
    NOW(),
    NOW()
),
(
    2,
    'product-uuid-2',
    'X-Salada',
    'Hambúrguer com salada',
    25.00,
    20.00,
    0,
    1,
    1,
    1,
    1,
    'http://localhost/storage/test2.webp',
    '["saudável"]',
    NOW(),
    NOW()
),
(
    3,
    'product-uuid-3',
    'Coca-Cola',
    'Refrigerante gelado',
    5.00,
    NULL,
    0,
    1,
    0,
    2,
    1,
    'http://localhost/storage/coca.webp',
    '["gelado"]',
    NOW(),
    NOW()
),
(
    4,
    'product-uuid-4',
    'Pudim',
    'Pudim de leite condensado',
    8.00,
    6.00,
    1,
    0,
    1,
    3,
    1,
    'http://localhost/storage/pudim.webp',
    '["doce", "cremoso"]',
    NOW(),
    NOW()
);

-- Insert test additionals
INSERT INTO additionals (
    id,
    name,
    price,
    product_id,
    created_at,
    updated_at
) VALUES 
(1, 'Bacon Extra', 5.00, 1, NOW(), NOW()),
(2, 'Queijo Extra', 3.00, 1, NOW(), NOW()),
(3, 'Alface Extra', 1.00, 2, NOW(), NOW()),
(4, 'Tomate Extra', 1.50, 2, NOW(), NOW());

-- Create test user for orders
INSERT INTO users (
    id,
    name,
    email,
    phone,
    created_at,
    updated_at
) VALUES (
    1,
    'Test User',
    'test@example.com',
    '(11) 99999-9999',
    NOW(),
    NOW()
);

-- Insert test customer addresses
INSERT INTO customer_addresses (
    id,
    user_id,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    zip_code,
    is_default,
    created_at,
    updated_at
) VALUES (
    1,
    1,
    'Rua Teste',
    '123',
    'Apto 45',
    'Centro',
    'São Paulo',
    'SP',
    '01234-567',
    1,
    NOW(),
    NOW()
);

COMMIT;