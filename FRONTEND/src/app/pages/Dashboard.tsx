import { Activity, Bot, Clock, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDashboardOverview } from '../hooks/useDashboard';

const statCards = [
  { key: 'activeChats', label: 'Active Chats', icon: MessageSquare, color: 'bg-blue-500', suffix: '' },
  { key: 'messagesToday', label: 'Messages Today', icon: Activity, color: 'bg-[#25D366]', suffix: '' },
  { key: 'botHandledPercent', label: 'Bot Handled', icon: Bot, color: 'bg-purple-500', suffix: '%' },
  { key: 'scheduledItems', label: 'Scheduled', icon: Clock, color: 'bg-orange-500', suffix: '' },
];

export function Dashboard() {
  const dashboardQuery = useDashboardOverview();
  const dashboard = dashboardQuery.data;
  const summary = dashboard?.summary || {};
  const systemHealth = dashboard?.systemHealth || {};
  const messageTrend = dashboard?.messageTrend || [];
  const handlingTrend = dashboard?.handlingTrend || [];
  const recentActivity = dashboard?.recentActivity || [];
  const botQueue = systemHealth.botQueue || {};

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">
          {dashboardQuery.isLoading ? 'Loading live backend metrics...' : 'Live overview from your backend data.'}
        </p>
        {dashboardQuery.error && <p className="text-sm text-red-600 mt-2">{dashboardQuery.error.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const value = summary[stat.key] ?? 0;
          return (
            <div key={stat.key} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <TrendingUp className="w-3 h-3" />
                  Live
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{value}{stat.suffix}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages This Week</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={messageTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Line type="monotone" dataKey="messages" stroke="#25D366" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bot vs Human Handling</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={handlingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Bar dataKey="bot" fill="#25D366" />
              <Bar dataKey="human" fill="#128C7E" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.length === 0 && <p className="text-sm text-gray-500">No activity recorded yet.</p>}
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {String(activity.entityType || 'System').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.createdAt || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            {[
              ['WhatsApp API', systemHealth.whatsappApi || 'unknown'],
              ['Bot Engine', systemHealth.botEngine || 'unknown'],
              ['AI Service', systemHealth.aiService || 'unknown'],
              ['Database', systemHealth.database || 'unknown'],
            ].map(([label, status]) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-xs font-medium text-gray-700">{status}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-full"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Bot Queue</span>
              <span className="text-sm font-medium text-gray-900">{botQueue.queued ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Contacts</span>
              <span className="text-sm font-medium text-gray-900">{summary.activeContacts ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
