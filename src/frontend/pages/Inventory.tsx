import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, itemsApi } from '../lib/api';

const TX_TYPES = ['RECEIPT', 'ADJUSTMENT', 'SPOT_COUNT_VARIANCE'];
const REASON_CODES = ['DAMAGE', 'SPOILAGE', 'THEFT', 'AUDIT_CORRECTION', ''];

export default function Inventory() {
  const qc = useQueryClient();
  const [lowStock, setLowStock] = useState(false);
  const [showTxForm, setShowTxForm] = useState(false);
  const [tab, setTab] = useState<'stock' | 'transactions'>('stock');

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', lowStock],
    queryFn: () => inventoryApi.list({ lowStock }),
  });

  const { data: transactions } = useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: () => inventoryApi.transactions({ limit: 100 }),
    enabled: tab === 'transactions',
  });

  const createTx = useMutation({
    mutationFn: inventoryApi.createTransaction,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); qc.invalidateQueries({ queryKey: ['inventory-transactions'] }); setShowTxForm(false); },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
        <button onClick={() => setShowTxForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
          + Transaction
        </button>
      </div>

      <div className="flex gap-4 mb-4 items-center">
        <div className="flex border border-gray-200 rounded overflow-hidden text-sm">
          {(['stock', 'transactions'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {t === 'stock' ? 'Stock Levels' : 'Transactions'}
            </button>
          ))}
        </div>
        {tab === 'stock' && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} />
            Low stock only
          </label>
        )}
      </div>

      {tab === 'stock' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Item', 'Department', 'On Hand', 'Reorder Point', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
              {inventory?.map((inv: any) => {
                const onHand = Number(inv.onHandQty);
                const reorder = Number(inv.reorderPoint);
                const isLow = onHand <= reorder;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{inv.item?.description}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.item?.department?.name}</td>
                    <td className={`px-4 py-3 font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{onHand.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500">{reorder.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {isLow ? 'Low' : 'OK'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !inventory?.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No inventory records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date', 'Item', 'Type', 'Qty', 'Ref #', 'Reason', 'User'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions?.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{tx.item?.description}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{tx.transactionType}</span></td>
                  <td className={`px-4 py-3 font-mono ${Number(tx.quantity) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Number(tx.quantity) > 0 ? '+' : ''}{Number(tx.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{tx.referenceNo ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{tx.reasonCode ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{tx.userId}</td>
                </tr>
              ))}
              {!transactions?.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showTxForm && (
        <TxForm
          onSave={(body) => createTx.mutate(body)}
          onClose={() => setShowTxForm(false)}
          saving={createTx.isPending}
          error={createTx.error as any}
        />
      )}
    </div>
  );
}

function TxForm({ onSave, onClose, saving, error }: any) {
  const { data: items } = useQuery({ queryKey: ['items', '', ''], queryFn: () => itemsApi.list({ limit: 200 }) });
  const [form, setForm] = useState({ itemId: '', transactionType: 'RECEIPT', quantity: '', referenceNo: '', reasonCode: '', unitCost: '' });
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Log Transaction</h3>
        {error && <div className="text-red-600 text-sm mb-3">{error?.response?.data?.error ?? 'Failed'}</div>}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
            <select value={form.itemId} onChange={(e) => set('itemId', e.target.value)} className={selectCls}>
              <option value="">— select —</option>
              {items?.items?.map((i: any) => <option key={i.id} value={i.id}>{i.description}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select value={form.transactionType} onChange={(e) => set('transactionType', e.target.value)} className={selectCls}>
              {TX_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity (negative to deduct)</label>
            <input type="number" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reference # (invoice/PO)</label>
            <input type="text" value={form.referenceNo} onChange={(e) => set('referenceNo', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason Code</label>
            <select value={form.reasonCode} onChange={(e) => set('reasonCode', e.target.value)} className={selectCls}>
              {REASON_CODES.map((r) => <option key={r} value={r}>{r || '— none —'}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const selectCls = 'w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
