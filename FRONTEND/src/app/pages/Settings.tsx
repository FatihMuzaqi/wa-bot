import { FormEvent, useState } from 'react';
import { Bell, Brain, Key, Save, Shield, Users, Webhook } from 'lucide-react';
import { useSaveSetting, useSettings, useSettingsProfile } from '../hooks/useSettings';

const tabs = [
  { id: 'whatsapp', label: 'WhatsApp API', icon: Key },
  { id: 'agents', label: 'Agents & Roles', icon: Users },
  { id: 'ai', label: 'AI Settings', icon: Brain },
  { id: 'webhooks', label: 'Webhook & n8n', icon: Webhook },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export function Settings() {
  const profileQuery = useSettingsProfile();
  const settingsQuery = useSettings();
  const saveSetting = useSaveSetting();
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [whatsappForm, setWhatsappForm] = useState({
    evolutionUrl: '',
    evolutionApiKey: '',
    evolutionInstance: '',
  });
  const [validationError, setValidationError] = useState('');
  const settings = settingsQuery.data || [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setValidationError('');

    if (activeTab !== 'whatsapp') return;

    if (!whatsappForm.evolutionUrl.trim()) {
      setValidationError('Evolution URL is required.');
      return;
    }

    try {
      new URL(whatsappForm.evolutionUrl);
    } catch {
      setValidationError('Evolution URL must be a valid URL.');
      return;
    }

    if (!whatsappForm.evolutionApiKey.trim()) {
      setValidationError('Evolution API Key is required.');
      return;
    }

    if (!whatsappForm.evolutionInstance.trim()) {
      setValidationError('Evolution Instance is required.');
      return;
    }

    saveSetting.mutate({
      key: 'whatsapp.evolution',
      group: 'whatsapp',
      value: whatsappForm,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          {settingsQuery.isLoading ? 'Loading settings...' : 'Manage system configuration'}
          {profileQuery.data ? ` for ${profileQuery.data.email}` : ''}
        </p>
        {settingsQuery.error && <p className="text-sm text-red-600 mt-2">{settingsQuery.error.message}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                    activeTab === tab.id ? 'bg-[#25D366] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
          </div>

          <div className="p-6 space-y-6">
            <form onSubmit={submit} className="grid grid-cols-1 gap-4">
              {activeTab === 'whatsapp' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Evolution URL</label>
                    <input
                      type="text"
                      value={whatsappForm.evolutionUrl}
                      onChange={(event) => setWhatsappForm({ ...whatsappForm, evolutionUrl: event.target.value })}
                      placeholder="https://evolution.example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Evolution API Key</label>
                    <input
                      type="password"
                      value={whatsappForm.evolutionApiKey}
                      onChange={(event) => setWhatsappForm({ ...whatsappForm, evolutionApiKey: event.target.value })}
                      placeholder="Enter Evolution API key"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Evolution Instance</label>
                    <input
                      type="text"
                      value={whatsappForm.evolutionInstance}
                      onChange={(event) => setWhatsappForm({ ...whatsappForm, evolutionInstance: event.target.value })}
                      placeholder="default"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  This settings group does not have editable fields yet.
                </div>
              )}
              <button
                type="submit"
                disabled={saveSetting.isPending || activeTab !== 'whatsapp'}
                className="w-fit flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                Save Setting
              </button>
              {validationError && <p className="text-sm text-red-600">{validationError}</p>}
              {saveSetting.error && <p className="text-sm text-red-600">{saveSetting.error.message}</p>}
            </form>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Saved Settings</h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {settings.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-4 text-sm text-gray-500">No settings found.</td></tr>
                    )}
                    {settings.map((setting: any) => (
                      <tr key={setting.id || setting.setting_key}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{setting.setting_key}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{setting.setting_group}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 font-mono">{JSON.stringify(setting.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
