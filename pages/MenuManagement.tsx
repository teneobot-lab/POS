
import React, { useState } from 'react';
import { MenuItem, Category } from '../types';
import { CATEGORIES } from '../constants';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

interface MenuProps {
  menuItems: MenuItem[];
  onUpdateMenu: (menu: MenuItem[]) => void;
}

const MenuManagement: React.FC<MenuProps> = ({ menuItems, onUpdateMenu }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState(''); // Modal / HPP
  const [category, setCategory] = useState<Category>('Makanan');

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setPrice(item.price.toString());
      setCost(item.cost?.toString() || '');
      setCategory(item.category);
    } else {
      setEditingItem(null);
      setName('');
      setPrice('');
      setCost('');
      setCategory('Makanan');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name || !price) return;
    
    const newItem: MenuItem = {
      id: editingItem?.id || Date.now().toString(),
      name,
      price: parseInt(price),
      cost: cost ? parseInt(cost) : 0,
      category
    };

    let updatedMenu: MenuItem[];
    if (editingItem) {
      updatedMenu = menuItems.map(m => m.id === editingItem.id ? newItem : m);
    } else {
      updatedMenu = [...menuItems, newItem];
    }

    onUpdateMenu(updatedMenu);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus menu ini?')) {
      onUpdateMenu(menuItems.filter(m => m.id !== id));
    }
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Menu</h2>
          <p className="text-gray-500">Kelola daftar makanan, sate, dan modal (HPP).</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          Tambah Menu
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {menuItems.map(item => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl">
                {item.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{item.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded tracking-tighter">
                    {item.category}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-blue-600">Jual: {formatIDR(item.price)}</span>
                    <span className="text-[10px] text-gray-400 font-medium italic">Modal: {formatIDR(item.cost || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => openModal(item)}
                className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(item.id)}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Simple Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingItem ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Nama Menu</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Misal: Nasi Kucing Teri"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Harga Jual (Rp)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="3000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Modal / HPP (Rp)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="2000"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Kategori</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                >
                  {CATEGORIES.filter(c => c !== 'Semua').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
