import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle, RefreshCcw, Download } from 'lucide-react';
import { adminService } from '../../services';

const SyncIntegrityPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIntegrityStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getSyncIntegrityStats();
      setStats(res.data);
    } catch (err) {
      setError('Failed to fetch sync integrity stats.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrityStats();
  }, []);

  const downloadReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      report: stats
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magizhchi-sync-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-24 bg-gray-100 dark:bg-gray-750 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl border border-red-200 flex items-center gap-3">
        <AlertTriangle size={20} />
        <p>{error}</p>
        <button onClick={fetchIntegrityStats} className="ml-auto text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold">
          <Database size={18} className="text-blue-500" />
          System Sync Integrity
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchIntegrityStats}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            title="Refresh Stats"
          >
            <RefreshCcw size={16} />
          </button>
          <button 
            onClick={downloadReport}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            <Download size={14} /> Report
          </button>
        </div>
      </div>
      
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400 rounded-lg">
            <tr>
              <th className="px-4 py-3">Collection</th>
              <th className="px-4 py-3 text-right">Documents</th>
              <th className="px-4 py-3 text-right">Indexes</th>
              <th className="px-4 py-3 text-right">Storage Size</th>
              <th className="px-4 py-3 text-center">Health Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats || {}).map(([collName, data]) => (
              <tr key={collName} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white capitalize">{collName}</td>
                <td className="px-4 py-3 text-right">{data.count}</td>
                <td className="px-4 py-3 text-right">{data.indexes}</td>
                <td className="px-4 py-3 text-right">{data.storageSizeKB} KB</td>
                <td className="px-4 py-3 flex justify-center">
                  {data.hasOrphanedIndexes ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" title="Collection is empty but indexes remain. Run repair-db.js.">
                      <AlertTriangle size={12} /> Orphaned Indexes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle size={12} /> Healthy
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SyncIntegrityPanel;
