import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionsApi, itemsApi } from '../lib/api';

const TYPES = ['FIXED_COMBO', 'PERCENT_DISCOUNT', 'FIXED_PRICE'];

function typeLabel(t: string) {
  if (t === 'FIXED_COMBO') return '2-for-X';
  if (t === 'PERCENT_DISCOUNT') return '% Off';
  if (t === 'FIXED_PRICE') return 'Fixed Price';
  return t;
}

export default function Promotions() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: promos, isLoading } = useQuery({ queryKey: ['promotions'], queryFn: promotionsApi.list });

  const upsert = useMutation({
    mutationFn: (body: any) => editing ? promotionsApi.update(editing.id, body) : promotionsApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); setShowForm(false); setEditing(null); },
  });

  const remove = useMutation({
    mutationFn: promotionsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  });

  function openEdit(p: any) { setEditing(p); setShowForm(true); }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Promotions</h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
          + New Promotion
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Type', 'Value', 'Items', 'Dates', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {promos?.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3"><span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{typeLabel(p.type)}</span></td>
                <td className="px-4 py-3 font-semibold">{p.type === 'PERCENT_DISCOUNT' ? `${Number(p.value)}%` : `$${Number(p.value).toFixed(2)}`}</td>
                <td className="px-4 py-3 text-gray-500">{p.items?.length ?? 0} item(s)</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => { if (confirm('Delete this promotion?')) remove.mutate(p.id); }} className="text-red-500 hover:underline text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !promos?.length && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No promotions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <PromoForm
          promo={editing}
          onSave={(body) => upsert.mutate(body)}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={upsert.isPending}
          error={upsert.error as any}
        />
      )}
    </div>
  );
}

function PromoForm({ promo, onSave, onClose, saving, error }: any) {
  const { data: itemsData } = useQuery({ queryKey: ['items', '', ''], queryFn: () => itemsApi.list({ limit: 200 }) });
  const [form, setForm] = useState({
    name: promo?.name ?? '',
    type: promo?.type ?? 'FIXED_COMBO',
    value: promo?.value ?? '',
    startDate: promo ? promo.startDate.slice(0, 10) : '',
    endDate: promo ? promo.endDate.slice(0, 10) : '',
    isActive: promo?.isActive ?? true,
    items: promo?.items?.map((i: any) => i.itemId) ?? [] as string[],
  });

  function toggleItem(id: string) {
    setForm((f) => ({
      ...f,
      items: f.items.includes(id) ? f.items.filter((x) => x !== id) : [...f.items, id],
    }));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{promo ? 'Edit Promotion' : 'New Promotion'}</h3>
        {error && <div className="text-red-600 text-sm mb-3">{error?.response?.data?.error ?? 'Save failed'}</div>}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={selectCls}>
              {TYPES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Value ({form.type === 'PERCENT_DISCOUNT' ? '%' : '$'})
            </label>
            <input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            Active
          </label>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Eligible Items</label>
            <div className="border border-gray-200 rounded max-h-40 overflow-y-auto">
              {itemsData?.items?.map((item: any) => (
                <label key={item.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.items.includes(item.id)} onChange={() => toggleItem(item.id)} />
                  <span>{item.description}</span>
                  <span className="text-gray-400 text-xs ml-auto">${Number(item.retailPrice).toFixed(2)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button
            onClick={() => onSave({ ...form, items: form.items.map((id) => ({ itemId: id })) })}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const selectCls = 'w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
