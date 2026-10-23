import { FormEvent, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileSpreadsheet,
  Plus,
  Send,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  useBroadcastDetail,
  useBroadcasts,
  useCancelBroadcast,
  useCreateBroadcast,
  useDeleteBroadcast,
  useImportBroadcastExcel,
  useStartBroadcast,
} from '../hooks/useBroadcast';

const inputClass = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]';

const countByStatus = (recipients: any[] = []) => ({
  total: recipients.length,
  sent: recipients.filter((item) => ['sent', 'delivered', 'read'].includes(item.status)).length,
  delivered: recipients.filter((item) => ['delivered', 'read'].includes(item.status)).length,
  read: recipients.filter((item) => item.status === 'read').length,
  failed: recipients.filter((item) => item.status === 'failed').length,
});

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const renderPreview = (template: string, contact = { name: 'Fatih', phone: '628123456789' }) => template
  .replace(/\{\{\s*name\s*\}\}/g, contact.name || 'Pelanggan')
  .replace(/\{\{\s*phone\s*\}\}/g, contact.phone || '')
  .replace(/\{\{\s*date\s*\}\}/g, new Date().toLocaleDateString('id-ID'));

export function Broadcast() {
  const broadcastsQuery = useBroadcasts({ page: 1, limit: 50 });
  const createBroadcast = useCreateBroadcast();
  const sendNow = useStartBroadcast();
  const cancelBroadcast = useCancelBroadcast();
  const deleteBroadcast = useDeleteBroadcast();
  const importExcel = useImportBroadcastExcel();
  const broadcasts = broadcastsQuery.data?.rows || [];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const detailQuery = useBroadcastDetail(selectedId);
  const [name, setName] = useState('');
  const [audienceType, setAudienceType] = useState('excel_import');
  const [chatStatus, setChatStatus] = useState('pending');
  const [selectedContactIds, setSelectedContactIds] = useState('');
  const [messageText, setMessageText] = useState('Halo {{name}}, ini pesan dari Company Site.');
  const [deliveryMode, setDeliveryMode] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [importPreview, setImportPreview] = useState<any>(null);
  const [formError, setFormError] = useState('');

  const totals = broadcasts.reduce((acc: any, broadcast: any) => {
    const counts = countByStatus(broadcast.recipients || []);
    acc.sent += counts.sent;
    acc.delivered += counts.delivered;
    acc.read += counts.read;
    acc.failed += counts.failed;
    return acc;
  }, { sent: 0, delivered: 0, read: 0, failed: 0 });

  const selectedBroadcast = detailQuery.data;
  const selectedCounts = useMemo(() => countByStatus(selectedBroadcast?.recipients || []), [selectedBroadcast]);

  const resetForm = () => {
    setStep(1);
    setName('');
    setAudienceType('excel_import');
    setChatStatus('pending');
    setSelectedContactIds('');
    setMessageText('Halo {{name}}, ini pesan dari Company Site.');
    setDeliveryMode('now');
    setScheduledDate('');
    setScheduledTime('');
    setImportPreview(null);
    setFormError('');
  };

  const uploadExcel = (file?: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    importExcel.mutate(formData, {
      onSuccess: setImportPreview,
    });
  };

  const recipientCount = () => {
    if (audienceType === 'excel_import') return importPreview?.contacts?.length || 0;
    if (audienceType === 'selected_contacts') return selectedContactIds.split(',').map((item) => item.trim()).filter(Boolean).length;
    return 0;
  };

  const audienceFilter = () => {
    if (audienceType === 'excel_import') {
      return { type: 'excel_import', contacts: importPreview?.contacts || [] };
    }
    if (audienceType === 'selected_contacts') {
      return {
        type: 'selected_contacts',
        contactIds: selectedContactIds.split(',').map((item) => Number(item.trim())).filter(Boolean),
      };
    }
    if (audienceType === 'chat_status') return { type: 'chat_status', status: chatStatus };
    return { type: 'all_contacts' };
  };

  const submitBroadcast = (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Campaign name is required.');
      setStep(1);
      return;
    }
    if (!messageText.trim()) {
      setFormError('Message text is required.');
      setStep(2);
      return;
    }
    if (audienceType === 'excel_import' && !importPreview?.contacts?.length) {
      setFormError('Please import a valid Excel audience first.');
      setStep(1);
      return;
    }
    const scheduledAt = deliveryMode === 'later' ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : null;
    if (deliveryMode === 'later' && (!scheduledDate || !scheduledTime || Number.isNaN(new Date(scheduledAt as string).getTime()))) {
      setFormError('Schedule date and time are required.');
      setStep(3);
      return;
    }

    createBroadcast.mutate({
      name,
      messageType: 'text',
      messagePayload: { text: messageText },
      audienceFilter: audienceFilter(),
      scheduledAt,
    }, {
      onSuccess: (broadcast: any) => {
        if (deliveryMode === 'now') sendNow.mutate(broadcast.id);
        setShowCreateModal(false);
        resetForm();
      },
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Broadcast Messages</h1>
          <p className="text-gray-600">Import recipients, send campaigns, and track delivery.</p>
          {(broadcastsQuery.error || createBroadcast.error || sendNow.error || importExcel.error || formError) && (
            <p className="text-sm text-red-600 mt-2">
              {formError || broadcastsQuery.error?.message || createBroadcast.error?.message || sendNow.error?.message || importExcel.error?.message}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]"
        >
          <Plus className="w-4 h-4" />
          Create Broadcast
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          ['Total Sent', totals.sent, Send, 'text-blue-500'],
          ['Delivered', totals.delivered, CheckCircle, 'text-green-500'],
          ['Read', totals.read, Users, 'text-purple-500'],
          ['Failed', totals.failed, XCircle, 'text-red-500'],
        ].map(([label, value, Icon, color]: any) => (
          <div key={label} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{Number(value).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Audience</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {broadcastsQuery.isLoading && <tr><td colSpan={7} className="px-4 py-5 text-sm text-gray-500">Loading broadcasts...</td></tr>}
              {!broadcastsQuery.isLoading && broadcasts.length === 0 && <tr><td colSpan={7} className="px-4 py-5 text-sm text-gray-500">No broadcasts found.</td></tr>}
              {broadcasts.map((broadcast: any) => {
                const counts = countByStatus(broadcast.recipients || []);
                return (
                  <tr key={broadcast.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-sm text-gray-900">{broadcast.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{broadcast.metadata?.total_recipients || counts.total || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{counts.sent}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{counts.failed}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        broadcast.status === 'completed' ? 'bg-green-100 text-green-700'
                          : broadcast.status === 'failed' || broadcast.status === 'cancelled' ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                      >
                        {broadcast.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(broadcast.scheduled_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedId(broadcast.id)} className="p-2 rounded-lg hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => sendNow.mutate(broadcast.id)} disabled={['sending', 'completed', 'cancelled'].includes(broadcast.status)} className="p-2 rounded-lg text-[#128C7E] hover:bg-green-50 disabled:opacity-40"><Send className="w-4 h-4" /></button>
                      <button onClick={() => cancelBroadcast.mutate(broadcast.id)} disabled={broadcast.status === 'cancelled'} className="p-2 rounded-lg text-yellow-700 hover:bg-yellow-50 disabled:opacity-40"><X className="w-4 h-4" /></button>
                      <button onClick={() => deleteBroadcast.mutate(broadcast.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-fit">
          <h2 className="font-semibold text-gray-900 mb-3">Broadcast Detail</h2>
          {!selectedId && <p className="text-sm text-gray-500">Select a campaign to see recipients and logs.</p>}
          {detailQuery.isLoading && <p className="text-sm text-gray-500">Loading detail...</p>}
          {selectedBroadcast && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedBroadcast.name}</p>
                <p className="text-xs text-gray-500">{selectedBroadcast.status} · {formatDate(selectedBroadcast.scheduled_at)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-lg font-bold">{selectedCounts.total}</p><p className="text-xs text-gray-500">Total</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-lg font-bold">{selectedCounts.sent}</p><p className="text-xs text-gray-500">Sent</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-lg font-bold">{selectedCounts.failed}</p><p className="text-xs text-gray-500">Failed</p></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Message Preview</p>
                <div className="bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-wrap">{renderPreview(selectedBroadcast.message_payload?.text || selectedBroadcast.message_payload?.message || '')}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Recipients</p>
                <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {(selectedBroadcast.recipients || []).slice(0, 50).map((recipient: any) => (
                    <div key={recipient.id} className="px-3 py-2 text-sm flex justify-between gap-3">
                      <span>{recipient.contact?.name || recipient.contact?.phone}</span>
                      <span className="text-gray-500">{recipient.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Logs</p>
                <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {(selectedBroadcast.logs || []).slice(0, 30).map((log: any) => (
                    <div key={log.id} className="px-3 py-2 text-xs">
                      <p className="font-medium text-gray-800">{log.event_type}</p>
                      <p className="text-gray-500">{formatDate(log.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={submitBroadcast} className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create Broadcast</h2>
              <div className="flex items-center gap-2 mt-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className={`h-2 flex-1 rounded-full ${step >= item ? 'bg-[#25D366]' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>

            <div className="p-6">
              {step === 1 && (
                <div className="space-y-5">
                  <label className="block text-sm font-medium text-gray-700">
                    Campaign Name
                    <input value={name} onChange={(event) => setName(event.target.value)} className={`${inputClass} mt-2`} />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Audience Type
                    <select value={audienceType} onChange={(event) => setAudienceType(event.target.value)} className={`${inputClass} mt-2`}>
                      <option value="all_contacts">All Contacts</option>
                      <option value="selected_contacts">Selected Contacts</option>
                      <option value="excel_import">Import Excel</option>
                      <option value="chat_status">Chat Status</option>
                    </select>
                  </label>
                  {audienceType === 'excel_import' && (
                    <div className="border border-dashed border-gray-300 rounded-lg p-5">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                        <FileSpreadsheet className="w-4 h-4" />
                        Upload .xlsx, .xls, or .csv
                      </label>
                      <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => uploadExcel(event.target.files?.[0])} />
                      {importExcel.isPending && <p className="text-sm text-gray-500 mt-3">Importing...</p>}
                      {importPreview && (
                        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                          <div className="bg-gray-50 rounded-lg p-3"><p className="font-bold">{importPreview.totalRows}</p><p className="text-xs text-gray-500">Rows</p></div>
                          <div className="bg-green-50 rounded-lg p-3"><p className="font-bold">{importPreview.validRows}</p><p className="text-xs text-gray-500">Valid</p></div>
                          <div className="bg-red-50 rounded-lg p-3"><p className="font-bold">{importPreview.invalidRows}</p><p className="text-xs text-gray-500">Invalid</p></div>
                          <div className="bg-yellow-50 rounded-lg p-3"><p className="font-bold">{importPreview.duplicates}</p><p className="text-xs text-gray-500">Duplicate</p></div>
                        </div>
                      )}
                    </div>
                  )}
                  {audienceType === 'selected_contacts' && (
                    <label className="block text-sm font-medium text-gray-700">
                      Contact IDs
                      <input value={selectedContactIds} onChange={(event) => setSelectedContactIds(event.target.value)} placeholder="1,2,3" className={`${inputClass} mt-2`} />
                    </label>
                  )}
                  {audienceType === 'chat_status' && (
                    <label className="block text-sm font-medium text-gray-700">
                      Chat Status
                      <select value={chatStatus} onChange={(event) => setChatStatus(event.target.value)} className={`${inputClass} mt-2`}>
                        <option value="bot">Bot</option>
                        <option value="pending">Pending</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <label className="block text-sm font-medium text-gray-700">
                    Message Content
                    <textarea rows={8} value={messageText} onChange={(event) => setMessageText(event.target.value)} className={`${inputClass} mt-2`} />
                  </label>
                  <p className="text-xs text-gray-500">Variables: {'{{name}}'}, {'{{phone}}'}, {'{{date}}'}</p>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap">{renderPreview(messageText)}</div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input type="radio" checked={deliveryMode === 'now'} onChange={() => setDeliveryMode('now')} />
                      <span className="text-sm text-gray-900">Send immediately</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="radio" checked={deliveryMode === 'later'} onChange={() => setDeliveryMode('later')} />
                      <span className="text-sm text-gray-900">Schedule for later</span>
                    </label>
                  </div>
                  {deliveryMode === 'later' && (
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className={inputClass} />
                      <input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} className={inputClass} />
                    </div>
                  )}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                    <p>Recipients: {recipientCount() || (audienceType === 'all_contacts' ? 'All contacts' : 'Resolved by backend')}</p>
                    <p>Delivery: {deliveryMode === 'now' ? 'Immediate' : `${scheduledDate} ${scheduledTime}`}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button type="button" onClick={() => (step === 1 ? setShowCreateModal(false) : setStep(step - 1))} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]">
                  Next
                </button>
              ) : (
                <button type="submit" disabled={createBroadcast.isPending || sendNow.isPending} className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] disabled:opacity-60">
                  {deliveryMode === 'now' ? <Send className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  {deliveryMode === 'now' ? 'Send Broadcast' : 'Schedule Broadcast'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
