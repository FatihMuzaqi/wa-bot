import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Edit2, Plus, Repeat, Trash2 } from 'lucide-react';
import { useCreateSchedule, useSchedules } from '../hooks/useScheduler';

export function Scheduler() {
  const schedulesQuery = useSchedules({ page: 1, limit: 50 });
  const createSchedule = useCreateSchedule();
  const schedules = schedulesQuery.data?.rows || [];
  const upcoming = schedules
    .filter((schedule: any) => schedule.next_run_at)
    .sort((a: any, b: any) => new Date(a.next_run_at).getTime() - new Date(b.next_run_at).getTime())
    .slice(0, 5);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Scheduled Messages</h1>
          <p className="text-gray-600">{schedulesQuery.isLoading ? 'Loading schedules...' : 'Automate recurring messages and reminders'}</p>
          {schedulesQuery.error && <p className="text-sm text-red-600 mt-2">{schedulesQuery.error.message}</p>}
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]">
          <Plus className="w-4 h-4" />
          Create Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Schedule Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['active', 'paused', 'completed', 'failed'].map((status) => (
              <div key={status} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 capitalize">{status}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {schedules.filter((schedule: any) => schedule.status === status).length}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Upcoming Schedule</h3>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {upcoming.length === 0 && <p className="text-sm text-gray-500">No upcoming schedules.</p>}
            {upcoming.map((item: any) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#25D366]">
                <div className="flex items-start gap-2 mb-2">
                  <CalendarIcon className="w-4 h-4 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.next_run_at}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{item.frequency}</span>
                  <span className="text-xs text-gray-500">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">All Scheduled Messages</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Audience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timezone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Run</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schedulesQuery.isLoading && <tr><td colSpan={7} className="px-6 py-4 text-sm text-gray-500">Loading schedules...</td></tr>}
              {!schedulesQuery.isLoading && schedules.length === 0 && !schedulesQuery.error && (
                <tr><td colSpan={7} className="px-6 py-4 text-sm text-gray-500">No schedules found.</td></tr>
              )}
              {schedules.map((schedule: any) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{schedule.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{schedule.message_payload?.text || '-'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{JSON.stringify(schedule.audience_filter || {})}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      <Repeat className="w-3 h-3" />
                      {schedule.frequency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <Clock className="w-4 h-4 text-gray-400 inline mr-1" />
                    {schedule.timezone}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{schedule.next_run_at || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{schedule.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4 text-gray-600" /></button>
                      <button className="p-1.5 hover:bg-gray-100 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create Scheduled Message</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">This action creates a basic schedule using the backend scheduler API.</p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => {
                  createSchedule.mutate({
                    title: `Scheduled Message ${new Date().toISOString()}`,
                    messagePayload: { text: 'Scheduled message' },
                    audienceFilter: {},
                    frequency: 'once',
                    startAt: new Date().toISOString(),
                  }, { onSuccess: () => setShowModal(false) });
                }}
                disabled={createSchedule.isPending}
                className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] disabled:opacity-60"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
