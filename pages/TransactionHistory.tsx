
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { Search, Calendar, ChevronRight, X, Receipt, CreditCard, Clock, Hash, Coins } from 'lucide-react';

interface HistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<HistoryProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(ts));
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(trx => {
      const matchesSearch = trx.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           trx.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        matchesDate = matchesDate && trx.timestamp >= start;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        matchesDate = matchesDate && trx.timestamp <= end;
      }

      return matchesSearch && matchesDate;
    });
  }, [transactions, searchTerm, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const calculateTrxCost = (trx: Transaction) => {
    return trx.items.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 relative">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h2>
          <p className="text-gray-500">Daftar semua pesanan yang telah dibayar.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari ID atau menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-10"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1 h-10">
            <Calendar size={16} className="text-gray-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs focus:outline-none text-gray-600"
            />
            <span className="text-gray-300 text-xs">s/d</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs focus:outline-none text-gray-600"
            />
          </div>

          {(searchTerm || startDate || endDate) && (
            <button 
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all h-10"
            >
              <X size={14} />
              Reset
            </button>
          )}
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">ID Transaksi</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4">Detail Item</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    {transactions.length === 0 
                      ? "Belum ada transaksi terekam." 
                      : "Tidak ada transaksi yang cocok dengan filter."}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(trx => (
                  <tr 
                    key={trx.id} 
                    onClick={() => setSelectedTransaction(trx)}
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 font-medium">{trx.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{formatDate(trx.timestamp)}</td>
                    <td className="px-6 py-4">
                      <span className={`
                        px-2 py-1 rounded-md text-[10px] font-bold uppercase
                        ${trx.paymentMethod === 'Cash' ? 'bg-green-50 text-green-700' : 
                          trx.paymentMethod === 'QRIS' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}
                      `}>
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 line-clamp-1 max-w-xs">
                        {trx.items.map(i => `${i.name} (${i.quantity}x)`).join(', ')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-800">{formatIDR(trx.total)}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setSelectedTransaction(null)}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <Receipt size={24} />
                <h3 className="text-xl font-bold">Detail Transaksi</h3>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                    <Hash size={12} /> ID Transaksi
                  </div>
                  <p className="font-mono text-sm text-gray-700 font-semibold">{selectedTransaction.id}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                    <Clock size={12} /> Waktu
                  </div>
                  <p className="text-sm text-gray-700 font-semibold">{formatDate(selectedTransaction.timestamp)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase border-b border-gray-100 pb-2">Rincian Menu</h4>
                <div className="space-y-4">
                  {selectedTransaction.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">{item.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 italic">
                          {formatIDR(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-800">{formatIDR(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profit Summary Section */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Coins size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Ringkasan Margin</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Total Modal (HPP)</span>
                  <span className="font-semibold text-gray-700">{formatIDR(calculateTrxCost(selectedTransaction))}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Laba Transaksi</span>
                  <span className="font-bold text-green-600">{formatIDR(selectedTransaction.total - calculateTrxCost(selectedTransaction))}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0">
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-800 font-black text-lg">Total Bayar</span>
                <span className="text-2xl font-black text-blue-600">{formatIDR(selectedTransaction.total)}</span>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="w-full mt-6 py-3 bg-gray-800 text-white rounded-2xl font-bold hover:bg-gray-900 transition-all active:scale-[0.98]"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
