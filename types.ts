
export type Category = 'Makanan' | 'Sate' | 'Gorengan' | 'Minuman' | 'Lainnya';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  cost?: number; // Modal / HPP per item
  category: Category;
  imageUrl?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Transaction {
  id: string;
  timestamp: number;
  items: CartItem[];
  total: number;
  paymentMethod: 'Cash' | 'QRIS' | 'Transfer';
}

export type Page = 'POS' | 'History' | 'Menu' | 'Reports' | 'Dashboard';
