import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reconApi } from '../lib/api';

export default function Reconciliation() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'daily' | 'spot'>('daily');
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [reconciling, setReconciling] = useState<any>(null);

  const { data: closes, isLoading } = useQuery({ queryKey: ['recon-daily'], queryFn: reconApi.daily });
  const { data: spotCounts } = useQuery({ queryKey: ['spot-counts'], queryFn: reconApi.spotCounts, enabled: tab === 'spot' });

  const createClose = useMutation({ mutationFn: reconApi.createClose, onSuccess: () => { qc.invalidateQueries({ queryKey: ['recon-daily'] }); setShowCloseForm(false); } });
  const updateClose = useMutation({ mutationFn: ({ id, data }: any) => reconApi.updateClose(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['recon-daily'] }); setReconciling(null); } });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reconciliation</h2>
        {tab === 'daily' && (
          <button onClick={() => setShowCloseForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
            + New Daily Close
          </button>
        )}
      </div>

      <div className="flex border border-gray-200 rounded overflow-hidden text-sm mb-5 w-fit">
        {(['daily', 'spot'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {t === 'daily' ? 'Daily Closes' : 'Spot Counts'}
          </button>
        ))}
      </div>

      {tab === 'daily' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date', 'Sales', 'Tax', 'Cash', 'Credit', 'Debit', 'EBT', 'Variance', 'Status', ''].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
              {closes?.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium">{new Date(c.closeDate).toLocaleDateString()}</td>
                  <td className="px-3 py-3 font-semibold">${Number(c.totalSales).toFixed(2)}</td>
                  <td className="px-3 py-3 text-gray-500">${Number(c.totalTax).toFixed(2)}</td>
                  <td className="px-3 py-3">${Number(c.cashSales).toFixed(2)}</td>
                  <td className="px-3 py-3">${Number(c.creditSales).toFixed(2)}</td>
                  <td className="px-3 py-3">${Number(c.debitSales).toFixed(2)}</td>
                  <td className="px-3 py-3">${Number(c.ebtSales).toFixed(2)}</td>
                  <td className={`px-3 py-3 font-semibold ${c.cashVariance != null ? (Number(c.cashVariance) < 0 ? 'text-red-600' : 'text-green-600') : 'text-gray-400'}`}>
                    {c.cashVariance != null ? `$${Number(c.cashVariance).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.status === 'RECONCILED' ? 'bg-green-100 text-green-700' :
                      c.status === 'FINALIZED' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    {c.status === 'OPEN' && (
                      <button onClick={() => setReconciling(c)} className="text-blue-600 hover:underline text-xs">Reconcile</button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && !closes?.length && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No daily closes yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'spot' && (
        <div className="space-y-4">
          {spotCounts?.map((s: any) => (
            <div key={s.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{new Date(s.countedAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{s.lines?.length ?? 0} item(s) counted</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.status}</span>
              </div>
              <table className="min-w-full text-xs">
                <thead><tr className="text-gray-500">
                  {['Item', 'System Qty', 'Counted', 'Variance'].map((h) => <th key={h} className="text-left py-1 pr-4">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {s.lines?.map((l: any) => (
                    <tr key={l.id}>
                      <td className="py-1 pr-4 font-medium text-gray-700">{l.item?.description}</td>
                      <td className="py-1 pr-4 text-gray-500">{Number(l.systemQty).toFixed(2)}</td>
                      <td className="py-1 pr-4">{Number(l.countedQty).toFixed(2)}</td>
                      <td className={`py-1 font-semibold ${Number(l.variance) < 0 ? 'text-red-600' : Number(l.variance) > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {Number(l.variance) >= 0 ? '+' : ''}{Number(l.variance).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {!spotCounts?.length && <p className="text-gray-400 text-sm">No spot counts yet.</p>}
        </div>
      )}

      {showCloseForm && <CloseForm onSave={(d) => createClose.mutate(d)} onClose={() => setShowCloseForm(false)} saving={createClose.isPending} />}
      {reconciling && (
        <ReconcileForm
          close={reconciling}
          onSave={(data) => updateClose.mutate({ id: reconciling.id, data })}
          onClose={() => setReconciling(null)}
          saving={updateClose.isPending}
        />
      )}
    </div>
  );
}

function CloseForm({ onSave, onClose, saving }: any) {
  const [form, setForm] = useState({
    closeDate: new Date().toISOString().slice(0, 10),
    totalSales: '', totalTax: '',
    cashSales: '', creditSales: '', debitSales: '', ebtSales: '', otherTenders: '0',
  });
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">New Daily Close</h3>
        <div className="space-y-3">
          <Field label="Close Date" type="date" value={form.closeDate} onChange={(v) => set('closeDate', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Sales ($)" type="number" value={form.totalSales} onChange={(v) => set('totalSales', v)} />
            <Field label="Total Tax ($)" type="number" value={form.totalTax} onChange={(v) => set('totalTax', v)} />
            <Field label="Cash Sales ($)" type="number" value={form.cashSales} onChange={(v) => set('cashSales', v)} />
            <Field label="Credit Sales ($)" type="number" value={form.creditSales} onChange={(v) => set('creditSales', v)} />
            <Field label="Debit Sales ($)" type="number" value={form.debitSales} onChange={(v) => set('debitSales', v)} />
            <Field label="EBT Sales ($)" type="number" value={form.ebtSales} onChange={(v) => set('ebtSales', v)} />
            <Field label="Other Tenders ($)" type="number" value={form.otherTenders} onChange={(v) => set('otherTenders', v)} />
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

function ReconcileForm({ close, onSave, onClose, saving }: any) {
  const [form, setForm] = useState({
    countedCash: close.countedCash ?? '',
    bankDeposit: close.bankDeposit ?? '',
    varianceReason: close.varianceReason ?? '',
    status: 'RECONCILED',
  });
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }
  const variance = form.countedCash !== '' ? Number(form.countedCash) - Number(close.cashSales) : null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Reconcile {new Date(close.closeDate).toLocaleDateString()}</h3>
        <p className="text-sm text-gray-500 mb-4">POS Cash: <strong>${Number(close.cashSales).toFixed(2)}</strong></p>
        <div className="space-y-3">
          <Field label="Counted Cash ($)" type="number" value={form.countedCash} onChange={(v) => set('countedCash', v)} />
          {variance !== null && (
            <p className={`text-sm font-semibold ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              Variance: {variance >= 0 ? '+' : ''}${variance.toFixed(2)}
            </p>
          )}
          <Field label="Bank Deposit ($)" type="number" value={form.bankDeposit} onChange={(v) => set('bankDeposit', v)} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Variance Reason</label>
            <input value={form.varianceReason} onChange={(e) => set('varianceReason', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button
            onClick={() => onSave({ ...form, cashVariance: variance })}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Mark Reconciled'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
