import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { inventoryApi, reconApi, fuelApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function StatCard({
  label, value, sub, accent = 'blue', alert = false,
}: {
  label: string; value: string | number; sub?: string; accent?: 'blue' | 'amber' | 'red' | 'green'; alert?: boolean;
}) {
  const ring: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50', amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50',   green: 'border-green-200 bg-green-50',
  };
  const text: Record<string, string> = {
    blue: 'text-blue-700', amber: 'text-amber-600', red: 'text-red-600', green: 'text-green-700',
  };
  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm ${alert ? ring[accent] : 'border-gray-100'}`}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${alert ? text[accent] : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function QuickAction({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
    >
      <span className="text-base w-5 text-center">{icon}</span>
      {label}
    </button>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();

  const { data: lowStock } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.list({ lowStock: true }),
  });

  const { data: recon } = useQuery({
    queryKey: ['recon', 'daily'],
    queryFn: () => reconApi.daily(),
  });

  const { data: tanks } = useQuery({
    queryKey: ['fuel', 'tanks'],
    queryFn: () => fuelApi.tanks(),
  });

  const today = recon?.[0];
  const totalFuelVolume = tanks?.reduce((s: number, t: any) => s + Number(t.currentVolume), 0) ?? 0;
  const lowFuelTanks = tanks?.filter((t: any) => {
    const pct = t.capacity > 0 ? (Number(t.currentVolume) / Number(t.capacity)) * 100 : 0;
    return pct < 20;
  }) ?? [];

  const barData = recon
    ?.slice(0, 7)
    .reverse()
    .map((c: any) => ({
      date: new Date(c.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: Number(c.totalSales),
    })) ?? [];

  const lineData = recon
    ?.slice(0, 14)
    .reverse()
    .map((c: any) => ({
      date: new Date(c.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      profit: Number(c.cashVariance ?? 0),
    })) ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Today's Sales"
          value={today ? `$${Number(today.totalSales).toFixed(2)}` : '—'}
          sub={today?.status ?? 'No close yet'}
          accent="blue"
        />
        <StatCard
          label="Inventory Alerts"
          value={lowStock?.length ?? '—'}
          sub={lowStock?.length ? 'Items below reorder point' : 'All stock healthy'}
          accent="amber"
          alert={(lowStock?.length ?? 0) > 0}
        />
        <StatCard
          label="Fuel on Hand"
          value={`${totalFuelVolume.toFixed(0)} gal`}
          sub={lowFuelTanks.length ? `${lowFuelTanks.length} tank(s) low` : `${tanks?.length ?? 0} tank(s)`}
          accent="red"
          alert={lowFuelTanks.length > 0}
        />
        <StatCard
          label="Cash Variance"
          value={today?.cashVariance != null ? `$${Number(today.cashVariance).toFixed(2)}` : '—'}
          sub="vs counted cash"
          accent={Math.abs(Number(today?.cashVariance ?? 0)) > 10 ? 'red' : 'green'}
          alert={Math.abs(Number(today?.cashVariance ?? 0)) > 10}
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="space-y-0.5">
            <QuickAction label="Add New Item"            icon="+" onClick={() => nav('/price-book')} />
            <QuickAction label="Check Low Stock"         icon="⚠" onClick={() => nav('/inventory')} />
            <QuickAction label="New Daily Close"         icon="✓" onClick={() => nav('/reconciliation')} />
            <QuickAction label="Log Fuel Delivery"       icon="⛽" onClick={() => nav('/fuel')} />
            <QuickAction label="Manage Promotions"       icon="◇" onClick={() => nav('/promotions')} />
            <QuickAction label="Import POS Data"         icon="↑" onClick={() => nav('/pos')} />
          </div>
        </div>

        {/* Sales line chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Daily Trend (14 days)</p>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Variance']} contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="profit" stroke="#2563EB" strokeWidth={2} dot={{ r: 3, fill: '#2563EB' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">No close data yet</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly bar chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Weekly Sales Breakdown</p>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={28}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Sales']} contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="sales" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No close data yet</div>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Low Stock Alerts</p>
            {(lowStock?.length ?? 0) > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {lowStock.length} item{lowStock.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-50 max-h-[220px] overflow-y-auto">
            {lowStock?.length > 0 ? (
              lowStock.map((item: any) => (
                <div key={item.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <span className="text-gray-800 truncate">{item.name}</span>
                  <span className="text-red-500 font-medium ml-4 shrink-0">
                    {item.currentStock} left
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">All stock levels healthy</div>
            )}
          </div>

          {/* Fuel tanks below */}
          {tanks?.length > 0 && (
            <>
              <div className="px-4 py-2 border-t border-gray-100 border-b border-gray-50">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Fuel Tanks</p>
              </div>
              <div className="divide-y divide-gray-50">
                {tanks.map((t: any) => {
                  const pct = t.capacity > 0 ? (Number(t.currentVolume) / Number(t.capacity)) * 100 : 0;
                  const color = pct < 20 ? 'bg-red-500' : pct < 40 ? 'bg-amber-400' : 'bg-green-500';
                  return (
                    <div key={t.id} className="px-4 py-2.5">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-700 font-medium">Tank {t.tankNumber} — {t.productGrade}</span>
                        <span className="text-gray-400">{Number(t.currentVolume).toFixed(0)} / {Number(t.capacity).toFixed(0)} gal</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
