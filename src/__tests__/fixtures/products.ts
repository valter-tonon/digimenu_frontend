import { Product } from '@/domain/entities/Product';

export const mockProduct: Product = {
  id: 1,
  uuid: 'test-product-uuid-1',
  name: 'X-Bacon',
  description: 'Hambúrguer artesanal com bacon crocante, alface, tomate e molho especial',
  price: 30.00,
  promotional_price: null,
  is_featured: true,
  is_popular: false,
  is_on_promotion: false,
  category_id: 1,
  image: 'http://localhost/storage/x-bacon.jpg',
  tags: ['picante', 'novo'],
  additionals: [
    {
      id: 1,
      name: 'Bacon Extra',
      description: 'Porção extra de bacon',
      price: 5.00,
      is_active: true
    },
    {
      id: 2,
      name: 'Queijo Cheddar',
      description: 'Fatia de queijo cheddar',
      price: 3.00,
      is_active: true
    }
  ]
};

export const mockPromotionalProduct: Product = {
  id: 2,
  uuid: 'test-product-uuid-2',
  name: 'X-Salada Promoção',
  description: 'Hambúrguer com salada em promoção especial',
  price: 25.00,
  promotional_price: 20.00,
  is_featured: false,
  is_popular: true,
  is_on_promotion: true,
  category_id: 1,
  image: 'http://localhost/storage/x-salada.jpg',
  tags: ['promocao', 'vegetariano'],
  additionals: []
};

export const mockProducts: Product[] = [
  mockProduct,
  mockPromotionalProduct,
  {
    id: 3,
    uuid: 'test-product-uuid-3',
    name: 'X-Tudo',
    description: 'Hambúrguer completo com todos os ingredientes',
    price: 35.00,
    promotional_price: null,
    is_featured: false,
    is_popular: true,
    is_on_promotion: false,
    category_id: 1,
    image: 'http://localhost/storage/x-tudo.jpg',
    tags: ['popular'],
    additionals: [
      {
        id: 3,
        name: 'Batata Frita',
        description: 'Porção de batata frita',
        price: 8.00,
        is_active: true
      }
    ]
  }
];