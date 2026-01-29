
import { MenuItem } from './types';

export const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Nasi Kucing Teri', price: 3000, cost: 1800, category: 'Makanan' },
  { id: '2', name: 'Nasi Kucing Tempe', price: 3000, cost: 1800, category: 'Makanan' },
  { id: '3', name: 'Sate Usus', price: 2000, cost: 1000, category: 'Sate' },
  { id: '4', name: 'Sate Telur Puyuh', price: 3500, cost: 2200, category: 'Sate' },
  { id: '5', name: 'Sate Kikil', price: 2500, cost: 1500, category: 'Sate' },
  { id: '6', name: 'Tempe Mendoan', price: 1000, cost: 600, category: 'Gorengan' },
  { id: '7', name: 'Bakwan Goreng', price: 1000, cost: 600, category: 'Gorengan' },
  { id: '8', name: 'Tahu Isi', price: 1000, cost: 600, category: 'Gorengan' },
  { id: '9', name: 'Wedang Jahe', price: 5000, cost: 2500, category: 'Minuman' },
  { id: '10', name: 'Es Teh Manis', price: 3000, cost: 1200, category: 'Minuman' },
  { id: '11', name: 'Kopi Joss', price: 6000, cost: 3000, category: 'Minuman' },
  { id: '12', name: 'Susu Jahe', price: 6000, cost: 3500, category: 'Minuman' },
];

export const CATEGORIES: string[] = ['Semua', 'Makanan', 'Sate', 'Gorengan', 'Minuman', 'Lainnya'];
