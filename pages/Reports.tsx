
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Category, MenuItem } from '../types';
import { 
  FileText, 
  Download, 
  Table as TableIcon, 
  Info, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Calculator, 
  Coins, 
  Wallet,
  ListFilter,
  X,
  ChevronRight,
  ChevronDown,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  transactions: Transaction[];
}

// Elegant Blue Palette for charts
const COLORS = ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const [operationalExpenses, setOperationalExpenses] = useState<number>(() => {
    const saved = localStorage.getItem('angkringan_expenses');
    return saved ? parseInt(saved) : 0;
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    localStorage.setItem('angkringan_expenses', operationalExpenses.toString());
  }, [operationalExpenses]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(trx => {
      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        matchesDate = matchesDate && trx.timestamp >= start;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        matchesDate = matchesDate && trx.timestamp <= end;
      }
      return matchesDate;
    });
  }, [transactions, startDate, endDate]);

  const categoryChartData = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredTransactions.forEach(trx => {
      trx.items.forEach(item => {
        const cat = item.category || 'Lainnya';
        distribution[cat] = (distribution[cat] || 0) + (item.price * item.quantity);
      });
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const itemSalesDetail = useMemo(() => {
    const itemStats: Record<string, { name: string, category: string, totalQty: number, totalRevenue: number, totalCost: number }> = {};
    
    filteredTransactions.forEach(trx => {
      trx.items.forEach(item => {
        if (!itemStats[item.id]) {
          itemStats[item.id] = { 
            name: item.name, 
            category: item.category, 
            totalQty: 0, 
            totalRevenue: 0,
            totalCost: 0
          };
        }
        itemStats[item.id].totalQty += item.quantity;
        itemStats[item.id].totalRevenue += (item.price * item.quantity);
        itemStats[item.id].totalCost += ((item.cost || 0) * item.quantity);
      });
    });

    const grouped: Record<string, typeof itemStats[string][]> = {};
    Object.values(itemStats).forEach(stat => {
      if (!grouped[stat.category]) grouped[stat.category] = [];
      grouped[stat.category].push(stat);
    });

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredTransactions]);

  const dailyData = useMemo(() => {
    const data: Record<string, number> = {};
    if (!startDate && !endDate) {
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        data[dateStr] = 0;
      }
    }
    filteredTransactions.forEach(trx => {
      const dateStr = new Date(trx.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      data[dateStr] = (data[dateStr] || 0) + trx.total;
    });
    return Object.entries(data).map(([name, revenue]) => ({ name, revenue }));
  }, [filteredTransactions, startDate, endDate]);

  const calculations = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((acc, curr) => acc + curr.total, 0);
    const totalHPP = filteredTransactions.reduce((acc, trx) => {
      return acc + trx.items.reduce((itemAcc, item) => itemAcc + ((item.cost || 0) * item.quantity), 0);
    }, 0);
    const grossProfit = totalRevenue - totalHPP;
    const netProfit = grossProfit - operationalExpenses;

    return { totalRevenue, totalHPP, grossProfit, netProfit };
  }, [filteredTransactions, operationalExpenses]);

  const exportToExcel = () => {
    if (filteredTransactions.length === 0) return alert('Tidak ada data untuk diekspor');
    const data = filteredTransactions.map(t => ({
      'ID Transaksi': t.id,
      'Tanggal': new Date(t.timestamp).toLocaleString('id-ID'),
      'Metode': t.paymentMethod,
      'Total (IDR)': t.total
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `Laporan_${Date.now()}.xlsx`);
  };

  const exportToPDF = () => {
    if (filteredTransactions.length === 0) return alert('Tidak ada data untuk diekspor');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Header Design - Solid Blue Elegant
    doc.setFillColor(30, 64, 175); // Darker blue for elegance
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ANGKRINGAN POS', margin, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan Penjualan & Analisis Laba Bersih', margin, 25);

    const periodStr = startDate || endDate ? `${startDate || '...'} s/d ${endDate || '...'}` : 'Seluruh Waktu';
    doc.text(`Periode: ${periodStr}`, pageWidth - margin, 25, { align: 'right' });
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth - margin, 18, { align: 'right' });

    // Financial Summary Section (Cards style)
    let yPos = 50;
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Finansial Utama', margin, yPos);
    
    yPos += 8;
    const cardWidth = (pageWidth - (margin * 2) - 10) / 4;
    
    const drawCard = (x: number, y: number, label: string, value: string, color: [number, number, number]) => {
      doc.setFillColor(248, 250, 252); // Very light slate
      doc.roundedRect(x, y, cardWidth, 25, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, cardWidth, 25, 2, 2, 'S');
      
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(label, x + 4, y + 8);
      
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(value, x + 4, y + 17);
    };

    drawCard(margin, yPos, 'TOTAL OMZET', formatIDR(calculations.totalRevenue), [15, 23, 42]);
    drawCard(margin + cardWidth + 3.3, yPos, 'TOTAL MODAL', formatIDR(calculations.totalHPP), [220, 38, 38]);
    drawCard(margin + (cardWidth * 2) + 6.6, yPos, 'BIAYA OPERASIONAL', formatIDR(operationalExpenses), [37, 99, 235]);
    drawCard(margin + (cardWidth * 3) + 10, yPos, 'LABA BERSIH', formatIDR(calculations.netProfit), [22, 163, 74]);

    // Item Detailed Sales Section
    yPos += 40;
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Analisis Produk & Margin', margin, yPos);

    const itemTableData: any[] = [];
    itemSalesDetail.forEach(([category, items]) => {
      items.forEach(item => {
        itemTableData.push([
          item.name,
          category,
          item.totalQty,
          formatIDR(item.totalRevenue),
          formatIDR(item.totalCost),
          formatIDR(item.totalRevenue - item.totalCost)
        ]);
      });
    });

    autoTable(doc, {
      startY: yPos + 4,
      head: [['Menu', 'Kategori', 'Qty', 'Omzet', 'Modal', 'Laba']],
      body: itemTableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] }
      }
    });

    // Transaction List Section
    doc.addPage();
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Riwayat Detil Transaksi', margin, 20);

    const transTableData = filteredTransactions.map(t => [
      t.id,
      new Date(t.timestamp).toLocaleString('id-ID'),
      t.paymentMethod,
      t.items.map(i => `${i.name} (${i.quantity}x)`).join(', '),
      formatIDR(t.total)
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['Trx ID', 'Tanggal & Waktu', 'Metode', 'Item Terjual', 'Total']],
      body: transTableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // Footer with Page Numbering
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`AngkringanPOS - Halaman ${i} dari ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`Laporan_Angkringan_Blue_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan & Analitik</h2>
          <p className="text-gray-500">Pantau performa bisnis dengan data akurat.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
            <Calendar size={18} className="text-blue-500" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm focus:outline-none font-medium text-slate-600" />
            <span className="text-slate-300">sampai</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm focus:outline-none font-medium text-slate-600" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <PieChartIcon size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-800">Kontribusi Omzet</h3>
            </div>
            <button onClick={() => setIsDetailModalOpen(true)} className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-100 transition-colors">
              <ListFilter size={14} /> Detail Margin
            </button>
          </div>
          <div className="h-72 w-full">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value">
                    {categoryChartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatIDR(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: '600'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400 italic">Data belum tersedia</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={20} className="text-blue-600" />
            <h3 className="font-bold text-gray-800">Tren Pendapatan Harian</h3>
          </div>
          <div className="h-72 w-full">
            {filteredTransactions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={(v) => `Rp${v/1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatIDR(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400 italic">Data belum tersedia</div>}
          </div>
        </div>
      </div>

      <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator size={20} className="text-blue-600" />
            <h3 className="font-bold text-gray-800">Perhitungan Keuntungan Bersih</h3>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Biaya Operasional</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
              <input 
                type="number" 
                value={operationalExpenses || ''} 
                onChange={(e) => setOperationalExpenses(parseInt(e.target.value) || 0)} 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 w-44" 
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatBox label="Total Omzet" value={formatIDR(calculations.totalRevenue)} color="text-slate-800" bg="bg-slate-50" icon={<Coins size={16} />} />
          <StatBox label="Modal (HPP)" value={formatIDR(calculations.totalHPP)} color="text-red-600" bg="bg-red-50/30" icon={<Wallet size={16} />} />
          <StatBox label="Laba Kotor" value={formatIDR(calculations.grossProfit)} color="text-blue-600" bg="bg-blue-50/50" icon={<TrendingUp size={16} />} />
          <StatBox label="Laba Bersih" value={formatIDR(calculations.netProfit)} color="text-white" bg="bg-blue-600" shadow icon={<Calculator size={16} />} />
        </div>
      </section>

      {/* Export Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExportCard 
          icon={<TableIcon size={32} />} 
          title="Ekspor Data Excel" 
          desc="Format .xlsx untuk pengolahan data akuntansi lanjut." 
          color="bg-blue-50" 
          textColor="text-blue-600" 
          btnColor="bg-blue-600" 
          onExport={exportToExcel} 
        />
        <ExportCard 
          icon={<FileText size={32} />} 
          title="Unduh Laporan PDF" 
          desc="Format .pdf elegan A4 siap cetak untuk arsip resmi." 
          color="bg-blue-100/50" 
          textColor="text-blue-700" 
          btnColor="bg-slate-800" 
          onExport={exportToPDF} 
        />
      </div>

      {/* Detailed Sales Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsDetailModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-3"><ListFilter size={28} /> Analisis Margin Produk</h3>
                <p className="text-blue-100 text-sm mt-1">Rincian performa setiap item dalam menu Anda.</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              {itemSalesDetail.map(([category, items]) => (
                <div key={category} className="space-y-4">
                  <h4 className="text-sm font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl inline-block uppercase tracking-widest">{category}</h4>
                  <div className="overflow-hidden border border-slate-100 rounded-[1.5rem] shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Menu</th>
                          <th className="px-6 py-4 text-center">Terjual</th>
                          <th className="px-6 py-4 text-right">Omzet</th>
                          <th className="px-6 py-4 text-right">Modal</th>
                          <th className="px-6 py-4 text-right">Laba</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                            <td className="px-6 py-4 text-center font-medium text-slate-600">{item.totalQty}</td>
                            <td className="px-6 py-4 text-right font-semibold text-slate-700">{formatIDR(item.totalRevenue)}</td>
                            <td className="px-6 py-4 text-right text-red-500 font-medium">{formatIDR(item.totalCost)}</td>
                            <td className="px-6 py-4 text-right font-black text-blue-600">{formatIDR(item.totalRevenue - item.totalCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-10 py-3 bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 active:scale-95 transition-all">Selesai</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color, bg, shadow, icon }: any) => (
  <div className={`p-6 ${bg} rounded-[1.5rem] border border-slate-100 ${shadow ? 'shadow-xl shadow-blue-100' : ''} flex flex-col gap-2`}>
    <div className="flex items-center gap-2 opacity-50">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className={`text-xl font-black tracking-tight ${color}`}>{value}</p>
  </div>
);

const ExportCard = ({ icon, title, desc, color, textColor, btnColor, onExport }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
    <div>
      <div className={`w-16 h-16 ${color} ${textColor} rounded-2xl flex items-center justify-center mb-5`}>{icon}</div>
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{desc}</p>
    </div>
    <button 
      onClick={onExport} 
      className={`mt-8 py-4 ${btnColor} text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:opacity-90`}
    >
      <Download size={20} />
      Simpan Laporan
    </button>
  </div>
);

export default Reports;
