import { useQuery } from '@tanstack/react-query';
import { posApi } from '../lib/api';

export default function POS() {
  const { data: batches } = useQuery({ queryKey: ['pos-batches'], queryFn: posApi.batches });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">POS Import</h2>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8 flex gap-4 items-start">
        <span className="text-amber-500 text-2xl mt-0.5">⚠</span>
        <div>
          <p className="font-semibold text-amber-800">POS integration not yet configured</p>
          <p className="text-sm text-amber-700 mt-1">
            POS company access is being set up. Once credentials are available (Monday), the adapter
            will be wired in here. File-based or API imports will appear in this section.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Import Batches</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Date', 'File', 'Status', 'Rows', 'Errors'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {batches?.map((b: any) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{new Date(b.processedAt).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.fileName ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    b.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    b.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{b.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{b.totalRows}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{b.errorLog ? 'Yes' : '—'}</td>
              </tr>
            ))}
            {!batches?.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No import batches yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
