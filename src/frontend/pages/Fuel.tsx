import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fuelApi } from '../lib/api';

export default function Fuel() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'tanks' | 'deliveries' | 'readings'>('tanks');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [showTankForm, setShowTankForm] = useState(false);

  const { data: tanks } = useQuery({ queryKey: ['fuel-tanks'], queryFn: fuelApi.tanks });
  const { data: deliveries } = useQuery({ queryKey: ['fuel-deliveries'], queryFn: () => fuelApi.deliveries(), enabled: tab === 'deliveries' });
  const { data: readings } = useQuery({ queryKey: ['fuel-readings'], queryFn: () => fuelApi.readings(), enabled: tab === 'readings' });

  const createTank = useMutation({ mutationFn: fuelApi.createTank, onSuccess: () => { qc.invalidateQueries({ queryKey: ['fuel-tanks'] }); setShowTankForm(false); } });
  const logDelivery = useMutation({ mutationFn: fuelApi.logDelivery, onSuccess: () => { qc.invalidateQueries({ queryKey: ['fuel-tanks', 'fuel-deliveries'] }); setShowDeliveryForm(false); } });
  const logReading = useMutation({ mutationFn: fuelApi.logReading, onSuccess: () => { qc.invalidateQueries({ queryKey: ['fuel-tanks', 'fuel-readings'] }); setShowReadingForm(false); } });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Fuel / Wet Stock</h2>
        <div className="flex gap-2">
          {tab === 'tanks' && <button onClick={() => setShowTankForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">+ Tank</button>}
          {tab === 'deliveries' && <button onClick={() => setShowDeliveryForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">+ Delivery</button>}
          {tab === 'readings' && <button onClick={() => setShowReadingForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">+ Reading</button>}
        </div>
      </div>

      <div className="flex border border-gray-200 rounded overflow-hidden text-sm mb-5 w-fit">
        {(['tanks', 'deliveries', 'readings'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'tanks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tanks?.map((t: any) => {
            const pct = t.capacity > 0 ? (Number(t.currentVolume) / Number(t.capacity)) * 100 : 0;
            return (
              <div key={t.id} className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900">Tank {t.tankNumber}</p>
                    <p className="text-sm text-gray-500">{t.productGrade}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pct < 20 ? 'bg-red-100 text-red-700' : pct < 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full ${pct < 20 ? 'bg-red-500' : pct < 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="text-sm text-gray-600">{Number(t.currentVolume).toFixed(0)} / {Number(t.capacity).toFixed(0)} gal</p>
                {t.pumps?.length > 0 && <p className="text-xs text-gray-400 mt-1">{t.pumps.length} pump(s)</p>}
              </div>
            );
          })}
          {!tanks?.length && <p className="text-gray-400 text-sm col-span-3">No tanks configured. Add one to get started.</p>}
        </div>
      )}

      {tab === 'deliveries' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date', 'Tank', 'Supplier', 'BOL #', 'Gallons', 'Cost/gal'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deliveries?.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{new Date(d.deliveryDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium">Tank {d.tank?.tankNumber} — {d.tank?.productGrade}</td>
                  <td className="px-4 py-3 text-gray-600">{d.supplier}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.bolNumber ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold">{Number(d.gallons).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{d.costPerGallon ? `$${Number(d.costPerGallon).toFixed(3)}` : '—'}</td>
                </tr>
              ))}
              {!deliveries?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No deliveries logged yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'readings' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date/Time', 'Tank', 'Gauge Reading (gal)', 'Temp (°F)'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {readings?.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{new Date(r.readingDate).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">Tank {r.tank?.tankNumber} — {r.tank?.productGrade}</td>
                  <td className="px-4 py-3 font-semibold">{Number(r.gaugeReading).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">{r.temperature != null ? Number(r.temperature).toFixed(1) : '—'}</td>
                </tr>
              ))}
              {!readings?.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No readings logged yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showTankForm && <TankForm tanks={tanks} onSave={(d) => createTank.mutate(d)} onClose={() => setShowTankForm(false)} saving={createTank.isPending} />}
      {showDeliveryForm && <DeliveryForm tanks={tanks} onSave={(d) => logDelivery.mutate(d)} onClose={() => setShowDeliveryForm(false)} saving={logDelivery.isPending} />}
      {showReadingForm && <ReadingForm tanks={tanks} onSave={(d) => logReading.mutate(d)} onClose={() => setShowReadingForm(false)} saving={logReading.isPending} />}
    </div>
  );
}

function TankForm({ onSave, onClose, saving }: any) {
  const [form, setForm] = useState({ tankNumber: '', productGrade: '', capacity: '' });
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }
  return (
    <Modal title="Add Tank" onClose={onClose}>
      <Field label="Tank Number" type="number" value={form.tankNumber} onChange={(v) => set('tankNumber', v)} />
      <Field label="Product Grade" value={form.productGrade} onChange={(v) => set('productGrade', v)} placeholder="e.g. Regular 87" />
      <Field label="Capacity (gal)" type="number" value={form.capacity} onChange={(v) => set('capacity', v)} />
      <ModalFooter onClose={onClose} onSave={() => onSave(form)} saving={saving} />
    </Modal>
  );
}

function DeliveryForm({ tanks, onSave, onClose, saving }: any) {
  const [form, setForm] = useState({ tankId: '', deliveryDate: '', supplier: '', bolNumber: '', gallons: '', costPerGallon: '' });
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }
  return (
    <Modal title="Log Delivery" onClose={onClose}>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tank</label>
        <select value={form.tankId} onChange={(e) => set('tankId', e.target.value)} className={selectCls}>
          <option value="">— select —</option>
          {tanks?.map((t: any) => <option key={t.id} value={t.id}>Tank {t.tankNumber} — {t.productGrade}</option>)}
        </select>
      </div>
      <Field label="Delivery Date" type="date" value={form.deliveryDate} onChange={(v) => set('deliveryDate', v)} />
      <Field label="Supplier" value={form.supplier} onChange={(v) => set('supplier', v)} />
      <Field label="BOL #" value={form.bolNumber} onChange={(v) => set('bolNumber', v)} />
      <Field label="Gallons" type="number" value={form.gallons} onChange={(v) => set('gallons', v)} />
      <Field label="Cost/gal ($)" type="number" value={form.costPerGallon} onChange={(v) => set('costPerGallon', v)} />
      <ModalFooter onClose={onClose} onSave={() => onSave(form)} saving={saving} />
    </Modal>
  );
}

function ReadingForm({ tanks, onSave, onClose, saving }: any) {
  const [form, setForm] = useState({ tankId: '', gaugeReading: '', temperature: '' });
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }
  return (
    <Modal title="Log Tank Reading" onClose={onClose}>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tank</label>
        <select value={form.tankId} onChange={(e) => set('tankId', e.target.value)} className={selectCls}>
          <option value="">— select —</option>
          {tanks?.map((t: any) => <option key={t.id} value={t.id}>Tank {t.tankNumber} — {t.productGrade}</option>)}
        </select>
      </div>
      <Field label="Gauge Reading (gal)" type="number" value={form.gaugeReading} onChange={(v) => set('gaugeReading', v)} />
      <Field label="Temperature (°F)" type="number" value={form.temperature} onChange={(v) => set('temperature', v)} />
      <ModalFooter onClose={onClose} onSave={() => onSave(form)} saving={saving} />
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving }: any) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
      <button onClick={onSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const selectCls = 'w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
