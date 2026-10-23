import { CheckCircle, ExternalLink, Play, RefreshCw, XCircle } from 'lucide-react';
import { useBotQueueStatus } from '../hooks/useBotRules';
import { useDashboardOverview } from '../hooks/useDashboard';
import { useEvolutionStatus } from '../hooks/useEvolution';

export function Automation() {
  const dashboardQuery = useDashboardOverview();
  const evolutionStatusQuery = useEvolutionStatus();
  const botQueueQuery = useBotQueueStatus();
  const health = dashboardQuery.data?.systemHealth || {};
  const botQueue = (botQueueQuery.data as any) || {};
  const broadcastQueue = health.broadcastQueue || {};

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Automation (n8n Integration)</h1>
          <p className="text-gray-600">{dashboardQuery.isLoading ? 'Loading automation status...' : 'Workflow and queue status from backend services'}</p>
          {dashboardQuery.error && <p className="text-sm text-red-600 mt-2">{dashboardQuery.error.message}</p>}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]">
          <ExternalLink className="w-4 h-4" />
          Open in n8n
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">WhatsApp API</span>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{evolutionStatusQuery.error ? 'Down' : 'Online'}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Bot Queue</span>
            <Play className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{botQueue.queued ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Broadcast Queue</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{broadcastQueue.queued ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Failed Jobs</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{(botQueue.failed ?? 0) + (broadcastQueue.failed ?? 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Realtime Backend Queues</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-auto">{JSON.stringify(botQueue, null, 2)}</pre>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-auto">{JSON.stringify(broadcastQueue, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
