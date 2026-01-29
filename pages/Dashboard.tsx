
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { TrendingUp, Users, ShoppingBag, CreditCard, Calculator } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const stats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const todaySales = transactions.filter(t => t.timestamp >= today);
    
    const calculateStats = (list: Transaction[]) => {
      const revenue = list.reduce((acc, curr) => acc + curr.total, 0);
      const cost = list.reduce((acc, trx) => {
        return acc + trx.items.reduce((itemAcc, item) => itemAcc + ((item.cost || 0) * item.quantity), 0);
      }, 0);
      return { revenue, profit: revenue - cost, count: list.length };
    };

    const totalStats = calculateStats(transactions);
    const todayStats = calculateStats(todaySales);

    return {
      totalRevenue: totalStats.revenue,
      totalProfit: totalStats.profit,
      todayRevenue: todayStats.revenue,
      todayProfit: todayStats.profit,
      totalOrders: totalStats.count,
      todayOrders: todayStats.count,
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = d.setHours(0,0,0,0);
      const dayEnd = d.setHours(23,59,59,999);
      
      const daySales = transactions.filter(t => t.timestamp >= dayStart && t.timestamp <= dayEnd);
      const revenue = daySales.reduce((acc, curr) => acc + curr.total, 0);
      
      data.push({
        name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        revenue
      });
    }
    return data;
  }, [transactions]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">Ringkasan Penjualan</h2>
        <p className="text-gray-500">Pantau performa angkringanmu hari ini.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<TrendingUp className="text-green-600" />} 
          title="Omzet Hari Ini" 
          value={formatIDR(stats.todayRevenue)}
          trend="Pendapatan kotor"
        />
        <StatCard 
          icon={<Calculator className="text-blue-600" />} 
          title="Laba Hari Ini" 
          value={formatIDR(stats.todayProfit)}
          trend="Setelah potong modal"
        />
        <StatCard 
          icon={<ShoppingBag className="text-blue-600" />} 
          title="Pesanan Hari Ini" 
          value={stats.todayOrders.toString()}
          trend={`${stats.todayOrders} transaksi`}
        />
        <StatCard 
          icon={<CreditCard className="text-purple-600" />} 
          title="Total Omzet" 
          value={formatIDR(stats.totalRevenue)}
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6">Grafik Omzet 7 Hari Terakhir</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(v) => `Rp${v/1000}k`} />
              <Tooltip 
                cursor={{fill: '#f9fafb'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number) => [formatIDR(val), 'Pendapatan']}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 6 ? '#2563eb' : '#93c5fd'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, trend }: { icon: React.ReactNode, title: string, value: string, trend?: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h4 className="text-xl font-bold mt-1 text-gray-800">{value}</h4>
        {trend && <p className="text-xs text-blue-600 mt-1 font-medium">{trend}</p>}
      </div>
    </div>
  </div>
);

export default Dashboard;
