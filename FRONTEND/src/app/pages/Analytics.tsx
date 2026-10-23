import { Download, MessageSquare, Users, Bot, Clock, Activity } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDashboardOverview } from '../hooks/useDashboard';

export function Analytics() {
  const analyticsQuery = useDashboardOverview();
  const data = analyticsQuery.data;
  const summary = data?.summary || {};
  const analytics = data?.analytics || {};
  const botVsHuman = analytics.botVsHuman || {};
  const responseTime = analytics.responseTime || {};
  const messageTrend = data?.messageTrend || [];
  const handlingTrend = data?.handlingTrend || [];
  const campaigns = data?.broadcastPerformance || [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
          <p className="text-gray-600">{analyticsQuery.isLoading ? 'Loading analytics...' : 'Performance insights from backend data'}</p>
          {analyticsQuery.error && <p className="text-sm text-red-600 mt-2">{analyticsQuery.error.message}</p>}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          ['Total Chats', analytics.totalChats ?? summary.totalChats ?? 0, MessageSquare],
          ['Messages Today', analytics.messagesToday ?? summary.messagesToday ?? 0, Activity],
          ['Bot vs Human', `${botVsHuman.bot ?? summary.botMessagesToday ?? 0}/${botVsHuman.human ?? summary.humanMessagesToday ?? 0}`, Bot],
          ['Response Time', responseTime.formatted ?? summary.averageResponseTimeFormatted ?? '0s', Clock],
          ['Active Agents', analytics.activeAgents ?? summary.activeAgents ?? 0, Users],
        ].map(([label, value, Icon]: any) => (
          <div key={label} className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Volume Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={messageTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="messages" stroke="#25D366" strokeWidth={2} name="Messages" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bot vs Human</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={handlingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="bot" fill="#25D366" name="Bot" />
              <Bar dataKey="human" fill="#128C7E" name="Human" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Broadcast Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Read</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.length === 0 && <tr><td colSpan={5} className="px-6 py-4 text-sm text-gray-500">No campaign data found.</td></tr>}
              {campaigns.map((campaign: any) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{campaign.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{campaign.sent}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{campaign.delivered}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{campaign.read}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{campaign.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
