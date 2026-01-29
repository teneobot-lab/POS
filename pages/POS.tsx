
import React, { useState, useMemo } from 'react';
import { MenuItem, CartItem, Category, Transaction } from '../types';
import { CATEGORIES } from '../constants';
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle2, Banknote, Coins } from 'lucide-react';

interface POSProps {
  menuItems: MenuItem[];
  onCheckout: (transaction: Transaction) => void;
}

const POS: React.FC<POSProps> = ({ menuItems, onCheckout }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'Transfer'>('Cash');
  const [amountReceived, setAmountReceived] = useState<number | ''>('');

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const deleteFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  
  const changeAmount = useMemo(() => {
    if (typeof amountReceived === 'number' && amountReceived >= cartTotal) {
      return amountReceived - cartTotal;
    }
    return 0;
  }, [amountReceived, cartTotal]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Cash' && (amountReceived === '' || amountReceived < cartTotal)) return;
    
    const transaction: Transaction = {
      id: `TRX-${Date.now()}`,
      timestamp: Date.now(),
      items: [...cart],
      total: cartTotal,
      paymentMethod
    };

    onCheckout(transaction);
    setCart([]);
    setAmountReceived('');
    setIsCheckingOut(true);
    setTimeout(() => setIsCheckingOut(false), 2000);
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const quickAmounts = [cartTotal, 5000, 10000, 20000, 50000, 100000].filter(a => a >= cartTotal || a === cartTotal);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full animate-in fade-in duration-500">
      {/* Items Section */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari menu angkringan..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all
                  ${selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-200'}
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all text-left flex flex-col justify-between h-36 relative group overflow-hidden"
            >
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-tighter mb-1 block">
                  {item.category}
                </span>
                <h4 className="font-bold text-gray-800 line-clamp-2 leading-tight">{item.name}</h4>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-600">{formatIDR(item.price)}</span>
                <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Plus size={16} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart & Checkout Section */}
      <div className="lg:col-span-5 xl:col-span-4 h-[calc(100vh-140px)] sticky top-8">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ShoppingCart size={20} className="text-blue-600" />
              Keranjang
            </h3>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-bold">
              {cart.reduce((a, b) => a + b.quantity, 0)} Item
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <ShoppingCart size={48} className="mb-4" />
                <p className="text-sm text-center">Keranjang masih kosong.<br/>Klik menu untuk menambah pesanan.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</h5>
                    <p className="text-xs text-gray-500">{formatIDR(item.price)} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:bg-white rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="p-1 hover:bg-white rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={() => deleteFromCart(item.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout UI */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-5">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
                <span>Metode Bayar</span>
                <div className="flex gap-2">
                  {(['Cash', 'QRIS', 'Transfer'] as const).map(m => (
                    <button 
                      key={m}
                      onClick={() => {
                        setPaymentMethod(m);
                        if (m !== 'Cash') setAmountReceived('');
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${paymentMethod === m ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'Cash' && cart.length > 0 && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="number" 
                      placeholder="Uang Diterima..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value === '' ? '' : parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map(amt => (
                      <button 
                        key={amt}
                        onClick={() => setAmountReceived(amt)}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all"
                      >
                        {amt === cartTotal ? 'Uang Pas' : formatIDR(amt).replace(',00', '')}
                      </button>
                    ))}
                  </div>

                  {typeof amountReceived === 'number' && amountReceived >= cartTotal && (
                    <div className="flex justify-between items-center p-3 bg-green-50 border border-green-100 rounded-xl">
                      <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                        <Coins size={16} />
                        <span>Kembalian:</span>
                      </div>
                      <span className="text-lg font-black text-green-700">{formatIDR(changeAmount)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1 border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center text-gray-500 text-sm font-medium">
                <span>Total Tagihan</span>
                <span className="font-bold">{formatIDR(cartTotal)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-800 font-black text-lg uppercase tracking-tight">Harus Bayar</span>
                <span className="text-2xl font-black text-gray-900">{formatIDR(cartTotal)}</span>
              </div>
            </div>

            <button 
              disabled={cart.length === 0 || (paymentMethod === 'Cash' && (amountReceived === '' || amountReceived < cartTotal))}
              onClick={handleCheckout}
              className={`
                w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                ${(cart.length === 0 || (paymentMethod === 'Cash' && (amountReceived === '' || amountReceived < cartTotal)))
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'}
              `}
            >
              {isCheckingOut ? (
                <>
                  <CheckCircle2 size={22} />
                  Lunas!
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  {paymentMethod === 'Cash' ? 'Selesaikan Bayar' : 'Konfirmasi Bayar'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
