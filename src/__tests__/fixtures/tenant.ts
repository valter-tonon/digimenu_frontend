export const mockTenant = {
  id: 1,
  uuid: '02efe224-e368-4a7a-a153-5fc49cd9c5ac',
  name: 'Empresa X',
  url: 'empresa-x',
  logo: 'http://localhost/storage/logo-empresa-x.png',
  opening_hours: {
    opens_at: '00:00:00',
    closes_at: '23:59:00',
    is_open: true
  },
  min_order_value: 20.00,
  delivery_fee: 5.00,
  estimated_delivery_time: '30-45 min'
};

export const mockClosedTenant = {
  ...mockTenant,
  opening_hours: {
    opens_at: '08:00:00',
    closes_at: '22:00:00',
    is_open: false
  }
};

export const mockTenantWithHighMinOrder = {
  ...mockTenant,
  min_order_value: 50.00
};