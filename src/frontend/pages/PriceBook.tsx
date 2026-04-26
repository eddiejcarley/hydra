import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi, departmentsApi, vendorsApi } from '../lib/api';

export default function PriceBook() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['items', search, deptFilter],
    queryFn: () => itemsApi.list({ search, departmentId: deptFilter, limit: 100 }),
  });
  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.list });
  const { data: vendors } = useQuery({ queryKey: ['vendors'], queryFn: vendorsApi.list });

  const upsert = useMutation({
    mutationFn: (body: any) =>
      editing ? itemsApi.update(editing.id, body) : itemsApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['items'] }); setShowForm(false); setEditing(null); },
  });

  const deactivate = useMutation({
    mutationFn: itemsApi.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });

  function openNew() { setEditing(null); setShowForm(true); }
  function openEdit(item: any) { setEditing(item); setShowForm(true); }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Price Book</h2>
        <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
          + Add Item
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Departments</option>
          {depts?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Barcode', 'Description', 'Department', 'Cost', 'Retail', 'On Hand', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {data?.items?.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.barcode}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{item.description}</td>
                <td className="px-4 py-3 text-gray-500">{item.department?.name}</td>
                <td className="px-4 py-3 text-gray-700">${Number(item.cost).toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">${Number(item.retailPrice).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600">{item.inventory ? Number(item.inventory.onHandQty).toFixed(0) : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    {item.status === 'ACTIVE' && (
                      <button onClick={() => deactivate.mutate(item.id)} className="text-red-500 hover:underline text-xs">Deactivate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.items?.length && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ItemForm
          item={editing}
          depts={depts ?? []}
          vendors={vendors ?? []}
          onSave={(body) => upsert.mutate(body)}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={upsert.isPending}
          error={upsert.error as any}
        />
      )}
    </div>
  );
}

function ItemForm({ item, depts, vendors, onSave, onClose, saving, error }: any) {
  const [form, setForm] = useState({
    barcode: item?.barcode ?? '',
    description: item?.description ?? '',
    departmentId: item?.departmentId ?? '',
    vendorId: item?.vendorId ?? '',
    cost: item?.cost ?? '',
    retailPrice: item?.retailPrice ?? '',
    taxable: item?.taxable ?? true,
    foodStampEligible: item?.foodStampEligible ?? false,
    unitOfMeasure: item?.unitOfMeasure ?? 'EA',
  });

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{item ? 'Edit Item' : 'New Item'}</h3>
        {error && <div className="text-red-600 text-sm mb-3">{error?.response?.data?.error ?? 'Save failed'}</div>}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Barcode" value={form.barcode} onChange={(v) => set('barcode', v)} disabled={!!item} />
          <Field label="Description" value={form.description} onChange={(v) => set('description', v)} span />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <select value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)} className={selectCls}>
              <option value="">— select —</option>
              {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vendor</label>
            <select value={form.vendorId} onChange={(e) => set('vendorId', e.target.value)} className={selectCls}>
              <option value="">— none —</option>
              {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <Field label="Cost ($)" type="number" value={form.cost} onChange={(v) => set('cost', v)} />
          <Field label="Retail ($)" type="number" value={form.retailPrice} onChange={(v) => set('retailPrice', v)} />
          <Field label="Unit" value={form.unitOfMeasure} onChange={(v) => set('unitOfMeasure', v)} />
          <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.taxable} onChange={(e) => set('taxable', e.target.checked)} />
              Taxable
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.foodStampEligible} onChange={(e) => set('foodStampEligible', e.target.checked)} />
              EBT Eligible
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button
            onClick={() => onSave(form)}
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

function Field({ label, value, onChange, type = 'text', disabled = false, span = false }: any) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${inputCls} ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
      />
    </div>
  );
}
