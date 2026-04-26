import { useQuery } from '@tanstack/react-query';
import { inventoryApi, reconApi, fuelApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

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
  const totalFuelVolume = tanks?.reduce((sum: number, t: any) => sum + Number(t.currentVolume), 0) ?? 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">{user?.store?.name ?? 'Your Store'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Today's Sales"
          value={today ? `$${Number(today.totalSales).toFixed(2)}` : '—'}
          sub={today?.status ?? 'No close yet'}
        />
        <StatCard
          label="Cash Variance"
          value={today?.cashVariance != null ? `$${Number(today.cashVariance).toFixed(2)}` : '—'}
          sub={today ? 'vs counted' : ''}
        />
        <StatCard
          label="Low Stock Items"
          value={lowStock?.length ?? '—'}
          sub="Below reorder point"
        />
        <StatCard
          label="Fuel on Hand"
          value={`${totalFuelVolume.toFixed(0)} gal`}
          sub={`${tanks?.length ?? 0} tank(s)`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent closes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Daily Closes</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recon?.slice(0, 5).map((c: any) => (
              <div key={c.id} className="px-5 py-3 flex justify-between items-center text-sm">
                <span className="text-gray-700">{new Date(c.closeDate).toLocaleDateString()}</span>
                <span className="font-medium">${Number(c.totalSales).toFixed(2)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.status === 'RECONCILED' ? 'bg-green-100 text-green-700' :
                  c.status === 'FINALIZED' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{c.status}</span>
              </div>
            )) ?? (
              <p className="px-5 py-4 text-sm text-gray-400">No closes recorded yet.</p>
            )}
          </div>
        </div>

        {/* Fuel tanks */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Fuel Tanks</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {tanks?.map((t: any) => {
              const pct = t.capacity > 0 ? (Number(t.currentVolume) / Number(t.capacity)) * 100 : 0;
              return (
                <div key={t.id} className="px-5 py-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Tank {t.tankNumber} — {t.productGrade}</span>
                    <span className="text-gray-500">{Number(t.currentVolume).toFixed(0)} / {Number(t.capacity).toFixed(0)} gal</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${pct < 20 ? 'bg-red-500' : pct < 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            }) ?? (
              <p className="px-5 py-4 text-sm text-gray-400">No tanks configured yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
