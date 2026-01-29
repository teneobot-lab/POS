import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  History, 
  UtensilsCrossed, 
  FileBarChart,
  LogOut,
  Menu as MenuIcon,
  X,
  RefreshCw,
  Settings,
  Cloud,
  CloudOff
} from 'lucide-react';
import { Page, MenuItem, Transaction } from './types';
import { INITIAL_MENU } from './constants';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import TransactionHistory from './pages/TransactionHistory';
import MenuManagement from './pages/MenuManagement';
import Reports from './pages/Reports';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('POS');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backendUrl, setBackendUrl] = useState<string>(() => localStorage.getItem('angkringan_url') || '');
  const [showSettings, setShowSettings] = useState(false);

  // Load Initial Data from Local
  useEffect(() => {
    try {
      const savedMenu = localStorage.getItem('angkringan_menu');
      const savedTransactions = localStorage.getItem('angkringan_transactions');

      if (savedMenu) {
        setMenuItems(JSON.parse(savedMenu));
      } else {
        setMenuItems(INITIAL_MENU);
        localStorage.setItem('angkringan_menu', JSON.stringify(INITIAL_MENU));
      }

      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
    } catch (e) {
      console.error("Error loading local data:", e);
      setMenuItems(INITIAL_MENU);
    }
  }, []);

  // Sync from Cloud when backendUrl is available
  useEffect(() => {
    if (backendUrl) {
      fetchAllData();
    }
  }, [backendUrl]);

  const fetchAllData = async () => {
    if (!backendUrl) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`${backendUrl}?action=get_data`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      if (data.menu && Array.isArray(data.menu) && data.menu.length > 0) {
        setMenuItems(data.menu);
        localStorage.setItem('angkringan_menu', JSON.stringify(data.menu));
      }
      
      if (data.transactions && Array.isArray(data.transactions)) {
        const parsed = data.transactions.map((t: any) => ({
          ...t,
          items: typeof t.items === 'string' ? JSON.parse(t.items) : t.items,
          timestamp: new Date(t.timestamp).getTime() || Date.now()
        })).sort((a: any, b: any) => b.timestamp - a.timestamp);
        
        setTransactions(parsed);
        localStorage.setItem('angkringan_transactions', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error("Cloud Sync Error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateMenu = async (newMenu: MenuItem[]) => {
    setMenuItems(newMenu);
    localStorage.setItem('angkringan_menu', JSON.stringify(newMenu));
    
    if (backendUrl) {
      setIsSyncing(true);
      try {
        await fetch(backendUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ action: 'update_menu', payload: newMenu })
        });
      } catch (e) {
        console.error("Cloud update menu error:", e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const addTransaction = async (transaction: Transaction) => {
    const updated = [transaction, ...transactions];
    setTransactions(updated);
    localStorage.setItem('angkringan_transactions', JSON.stringify(updated));

    if (backendUrl) {
      setIsSyncing(true);
      try {
        await fetch(backendUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ action: 'save_transaction', payload: transaction })
        });
      } catch (e) {
        console.error("Cloud save transaction error:", e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleSaveUrl = (url: string) => {
    const cleanUrl = url.trim();
    setBackendUrl(cleanUrl);
    localStorage.setItem('angkringan_url', cleanUrl);
    setShowSettings(false);
  };

  const navItems = [
    { id: 'Dashboard', label: 'Ringkasan', icon: <LayoutDashboard size={20} /> },
    { id: 'POS', label: 'Kasir (POS)', icon: <ShoppingCart size={20} /> },
    { id: 'History', label: 'Riwayat', icon: <History size={20} /> },
    { id: 'Menu', label: 'Menu Makanan', icon: <UtensilsCrossed size={20} /> },
    { id: 'Reports', label: 'Laporan Gaji', icon: <FileBarChart size={20} /> },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard': return <Dashboard transactions={transactions} />;
      case 'POS': return <POS menuItems={menuItems} onCheckout={addTransaction} />;
      case 'History': return <TransactionHistory transactions={transactions} />;
      case 'Menu': return <MenuManagement menuItems={menuItems} onUpdateMenu={updateMenu} />;
      case 'Reports': return <Reports transactions={transactions} />;
      default: return <POS menuItems={menuItems} onCheckout={addTransaction} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 overflow-hidden">
      
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors">
            <MenuIcon size={24} />
          </button>
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-sm">A</span>
            Angkringan
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {backendUrl ? (
            <button onClick={fetchAllData} className={`p-2 rounded-xl transition-all ${isSyncing ? 'animate-spin text-blue-600' : 'text-green-500'}`}>
              <RefreshCw size={20} />
            </button>
          ) : (
            <button onClick={() => setShowSettings(true)} className="p-2 text-gray-300 hover:text-amber-500 transition-colors">
              <CloudOff size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:w-64 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              <span className="bg-blue-600 text-white p-1 rounded">A</span>
              Angkringan
            </h1>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Smart POS System</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActivePage(item.id as Page); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activePage === item.id ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-gray-50 space-y-2">
          {!backendUrl && (
            <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 text-amber-600 font-bold text-xs hover:bg-amber-100 transition-colors">
              <Settings size={18} /> Setup Cloud Backend
            </button>
          )}
          
          {backendUrl && (
            <div className="flex items-center justify-between px-4 py-2 bg-green-50 rounded-xl mb-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-green-600">
                <Cloud size={14} /> Cloud Active
              </div>
              <button onClick={() => setShowSettings(true)} className="text-gray-400 hover:text-blue-600 transition-colors"><Settings size={14} /></button>
            </div>
          )}

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 font-bold transition-all">
            <LogOut size={20} />
            <span className="text-sm">Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
        <div className="p-5 lg:p-8 max-w-7xl mx-auto w-full page-transition">
          {renderPage()}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Setup Cloud Backend</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Tempelkan URL Web App dari Google Apps Script Anda untuk sinkronisasi data otomatis ke Google Sheets.</p>
            
            <input 
              type="text" 
              defaultValue={backendUrl}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-[10px] mb-6"
              id="urlInput"
            />

            <div className="flex gap-3">
              <button onClick={() => setShowSettings(false)} className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Batal</button>
              <button 
                onClick={() => {
                  const val = (document.getElementById('urlInput') as HTMLInputElement).value;
                  handleSaveUrl(val);
                }} 
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Hubungkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;