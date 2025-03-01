export interface Additional {
  id: string;
  name: string;
  price: number;
}

export const products = [
  {
    id: '1',
    name: 'Hambúrguer Clássico',
    description: 'Hambúrguer artesanal com queijo cheddar, alface, tomate e molho especial da casa. Acompanha batatas fritas.',
    price: 32.00,
    image: '/images/burguer.jpg',
    category: 'lanches',
    extras: ['Com fritas'],
    additionals: [
      { id: 'bacon', name: 'Bacon', price: 4.00 },
      { id: 'queijo', name: 'Queijo Extra', price: 3.00 },
      { id: 'cebola', name: 'Cebola Caramelizada', price: 3.50 },
      { id: 'ovo', name: 'Ovo', price: 2.50 },
    ]
  },
  {
    id: '2',
    name: 'Pizza Pepperoni',
    description: 'Pizza com pepperoni importado, queijo muçarela, orégano e molho de tomate caseiro.',
    price: 45.00,
    image: '/images/pizza.jpeg',
    category: 'pizzas',
    extras: ['8 fatias']
  },
  {
    id: '3',
    name: 'Salada Caesar',
    description: 'Mix de folhas, croutons, frango grelhado, parmesão e molho caesar.',
    price: 28.00,
    image: '/images/salad.jpg',
    category: 'saladas',
    extras: ['Molho à parte']
  },
  {
    id: '5',
    name: 'Coca-Cola',
    description: 'Refrigerante Coca-Cola 350ml',
    price: 6.90,
    image: '/images/coke.jpg',
    category: 'bebidas'
  }
];

export const categories = [
  'Pizzas',
  'Hamburguers',
  'Bebidas',
  'Sobremesas'
]; 