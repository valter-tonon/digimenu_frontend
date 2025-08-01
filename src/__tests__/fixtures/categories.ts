import { Category } from '@/domain/entities/Category';

export const mockCategory: Category = {
  id: 1,
  name: 'Lanches',
  description: 'Deliciosos hambúrgueres artesanais',
  image: 'http://localhost/storage/lanches.jpg',
  is_active: true,
  order: 1
};

export const mockCategories: Category[] = [
  mockCategory,
  {
    id: 2,
    name: 'Bebidas',
    description: 'Refrigerantes, sucos e bebidas geladas',
    image: 'http://localhost/storage/bebidas.jpg',
    is_active: true,
    order: 2
  },
  {
    id: 3,
    name: 'Sobremesas',
    description: 'Doces e sobremesas especiais',
    image: 'http://localhost/storage/sobremesas.jpg',
    is_active: true,
    order: 3
  }
];