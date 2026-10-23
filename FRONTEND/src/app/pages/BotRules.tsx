import { FormEvent, useMemo, useState } from 'react';
import {
  Bot,
  Copy,
  Edit2,
  Eye,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  useBotQueueStatus,
  useBotRules,
  useCreateBotRule,
  useDeleteBotRule,
  useUpdateBotRule,
} from '../hooks/useBotRules';
import { useForms } from '../hooks/useForms';

type RuleForm = {
  name: string;
  triggerType: string;
  triggerValue: string;
  intentName: string;
  intentExamples: string;
  responseType: string;
  responseText: string;
  formId: string;
  aiSystemPrompt: string;
  aiInstruction: string;
  aiFallbackText: string;
  aiTemperature: number;
  buttonsText: string;
  buttons: Array<{
    label: string;
    value: string;
    action: string;
    triggerValue: string;
    responseText: string;
    formId: string;
  }>;
  priority: number;
  isActive: boolean;
  aiFallbackEnabled: boolean;
};

const emptyRule: RuleForm = {
  name: '',
  triggerType: 'keyword',
  triggerValue: '',
  intentName: '',
  intentExamples: '',
  responseType: 'text',
  responseText: '',
  formId: '',
  aiSystemPrompt: '',
  aiInstruction: '',
  aiFallbackText: '',
  aiTemperature: 0.3,
  buttonsText: '',
  buttons: [
    { label: '', value: '', action: 'text', triggerValue: '', responseText: '', formId: '' },
  ],
  priority: 100,
  isActive: true,
  aiFallbackEnabled: false,
};

export const parseResponsePayload = (payload: unknown): Record<string, any> => {
  if (!payload) return {};
  if (typeof payload === 'object') return payload as Record<string, any>;
  if (typeof payload !== 'string') return {};

  try {
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const getResponsePreview = (rule: any) => {
  if (rule.response_type === 'form') return `Starts form: ${rule.form?.name || 'Selected form'}`;
  const payload = parseResponsePayload(rule.response_payload);
  if (rule.response_type === 'buttons') return payload.text || `${Array.isArray(payload.buttons) ? payload.buttons.length : 0} buttons`;
  return payload.text || payload.message || '';
};

const parseIntentTrigger = (triggerValue: unknown) => {
  if (!triggerValue) return { intent: '', examples: [] as string[] };
  if (typeof triggerValue === 'object') {
    const payload = triggerValue as any;
    return { intent: payload.intent || '', examples: Array.isArray(payload.examples) ? payload.examples : [] };
  }
  try {
    const payload = JSON.parse(String(triggerValue));
    return { intent: payload.intent || '', examples: Array.isArray(payload.examples) ? payload.examples : [] };
  } catch {
    return { intent: String(triggerValue || ''), examples: [] as string[] };
  }
};

const normalizeType = (value: string) => (value === 'interactive' ? 'buttons' : value);
const displayType = (value: string) => (['buttons', 'interactive'].includes(value) ? 'interactive' : value);
const responseTypeLabel = (value: string) => {
  const type = displayType(value || 'text');
  return type.charAt(0).toUpperCase() + type.slice(1);
};
const emptyButton = () => ({ label: '', value: '', action: 'text', triggerValue: '', responseText: '', formId: '' });
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong');

export function BotRules() {
  const rulesQuery = useBotRules({ page: 1, limit: 100 });
  const formsQuery = useForms({ page: 1, limit: 100 });
  const queueStatus = useBotQueueStatus();
  const createRule = useCreateBotRule();
  const updateRule = useUpdateBotRule();
  const deleteRule = useDeleteBotRule();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [form, setForm] = useState<RuleForm>(emptyRule);
  const [formError, setFormError] = useState('');

  const rules = rulesQuery.data?.rows || [];
  const activeForms = (formsQuery.data?.rows || []).filter((item: any) => item.status === 'active');
  const saving = createRule.isPending || updateRule.isPending;

  const filteredRules = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rules.filter((rule: any) => {
      const matchesSearch = !term
        || String(rule.name || '').toLowerCase().includes(term)
        || String(rule.trigger_value || '').toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' ? rule.is_active : !rule.is_active);
      const responseType = displayType(rule.response_type || '');
      const matchesType = typeFilter === 'all' || responseType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [rules, search, statusFilter, typeFilter]);

  const openCreateModal = () => {
    setEditingRule(null);
    setForm(emptyRule);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (rule: any) => {
    const responsePayload = parseResponsePayload(rule.response_payload);
    const intentPayload = parseIntentTrigger(rule.trigger_value);
    setEditingRule(rule);
    setForm({
      name: rule.name || '',
      triggerType: rule.trigger_type || 'keyword',
      triggerValue: rule.trigger_value || '',
      intentName: intentPayload.intent,
      intentExamples: intentPayload.examples.join('\n'),
      responseType: normalizeType(rule.response_type || 'text'),
      responseText: responsePayload.text || responsePayload.message || '',
      formId: rule.form_id ? String(rule.form_id) : '',
      aiSystemPrompt: responsePayload.systemPrompt || '',
      aiInstruction: responsePayload.instruction || '',
      aiFallbackText: responsePayload.fallbackText || '',
      aiTemperature: Number(responsePayload.temperature ?? 0.3),
      buttonsText: responsePayload.text || responsePayload.message || '',
      buttons: Array.isArray(responsePayload.buttons) && responsePayload.buttons.length
        ? responsePayload.buttons.map((button: any) => ({
          label: button.label || '',
          value: button.value || '',
          action: button.action || 'text',
          triggerValue: button.triggerValue || button.trigger_value || '',
          responseText: button.responseText || button.response_text || '',
          formId: button.formId || button.form_id ? String(button.formId || button.form_id) : '',
        }))
        : [emptyButton()],
      priority: Number(rule.priority ?? 100),
      isActive: Boolean(rule.is_active),
      aiFallbackEnabled: Boolean(rule.ai_fallback_enabled),
    });
    setFormError('');
    setShowModal(true);
  };

  const openDuplicateModal = (rule: any) => {
    const responsePayload = parseResponsePayload(rule.response_payload);
    const intentPayload = parseIntentTrigger(rule.trigger_value);
    setEditingRule(null);
    setForm({
      name: `${rule.name || 'Bot Rule'} Copy`,
      triggerType: rule.trigger_type || 'keyword',
      triggerValue: rule.trigger_value || '',
      intentName: intentPayload.intent,
      intentExamples: intentPayload.examples.join('\n'),
      responseType: normalizeType(rule.response_type || 'text'),
      responseText: responsePayload.text || responsePayload.message || '',
      formId: rule.form_id ? String(rule.form_id) : '',
      aiSystemPrompt: responsePayload.systemPrompt || '',
      aiInstruction: responsePayload.instruction || '',
      aiFallbackText: responsePayload.fallbackText || '',
      aiTemperature: Number(responsePayload.temperature ?? 0.3),
      buttonsText: responsePayload.text || responsePayload.message || '',
      buttons: Array.isArray(responsePayload.buttons) && responsePayload.buttons.length
        ? responsePayload.buttons.map((button: any) => ({
          label: button.label || '',
          value: button.value || '',
          action: button.action || 'text',
          triggerValue: button.triggerValue || button.trigger_value || '',
          responseText: button.responseText || button.response_text || '',
          formId: button.formId || button.form_id ? String(button.formId || button.form_id) : '',
        }))
        : [emptyButton()],
      priority: Number(rule.priority ?? 100),
      isActive: Boolean(rule.is_active),
      aiFallbackEnabled: Boolean(rule.ai_fallback_enabled),
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRule(null);
    setForm(emptyRule);
    setFormError('');
  };

  const buildPayload = () => {
    if (form.responseType === 'form' && !form.formId) {
      throw new Error('Please select an active form for this bot rule.');
    }
    if (form.triggerType === 'intent' && !form.intentName.trim()) {
      throw new Error('Intent name is required.');
    }
    if (form.responseType === 'text' && !form.responseText.trim()) {
      throw new Error('Response message is required for text bot rules.');
    }
    if (form.responseType === 'buttons') {
      if (!form.buttonsText.trim()) throw new Error('Button message text is required.');
      const validButtons = form.buttons.filter((button) => button.label.trim());
      if (validButtons.length === 0) throw new Error('Add at least one button.');
      validButtons.forEach((button) => {
        if (button.action === 'text' && !button.responseText.trim()) throw new Error(`Response text is required for button "${button.label}".`);
        if (button.action === 'trigger' && !button.triggerValue.trim()) throw new Error(`Trigger value is required for button "${button.label}".`);
        if (button.action === 'form' && !button.formId) throw new Error(`Form is required for button "${button.label}".`);
      });
    }

    const basePayload = {
      name: form.name.trim(),
      triggerType: form.triggerType,
      triggerValue: form.triggerType === 'intent'
        ? JSON.stringify({
          intent: form.intentName.trim(),
          examples: form.intentExamples
            .split('\n')
            .map((example) => example.trim())
            .filter(Boolean),
        })
        : form.triggerValue.trim(),
      responseType: form.responseType,
      priority: Number(form.priority || 100),
      isActive: form.isActive,
      aiFallbackEnabled: form.aiFallbackEnabled,
    };

    if (form.responseType === 'form') {
      return {
        ...basePayload,
        responsePayload: null,
        formId: Number(form.formId),
      };
    }

    if (form.responseType === 'text') {
      return {
        ...basePayload,
        responsePayload: { text: form.responseText },
        formId: null,
      };
    }

    if (form.responseType === 'buttons') {
      return {
        ...basePayload,
        responsePayload: {
          text: form.buttonsText,
          buttons: form.buttons
            .filter((button) => button.label.trim())
            .map((button) => ({
              label: button.label.trim(),
              value: button.value.trim() || button.label.trim().toLowerCase().replace(/\s+/g, '_'),
              action: button.action,
              ...(button.action === 'text' && { responseText: button.responseText }),
              ...(button.action === 'trigger' && { triggerValue: button.triggerValue }),
              ...(button.action === 'form' && { formId: Number(button.formId) }),
            })),
        },
        formId: null,
      };
    }

    if (form.responseType === 'ai') {
      return {
        ...basePayload,
        responsePayload: {
          systemPrompt: form.aiSystemPrompt,
          instruction: form.aiInstruction,
          fallbackText: form.aiFallbackText,
          temperature: Number(form.aiTemperature || 0.3),
        },
        formId: null,
      };
    }

    return {
      ...basePayload,
      responsePayload: null,
      formId: null,
    };
  };

  const submitRule = (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    let payload;
    try {
      payload = buildPayload();
    } catch (error) {
      setFormError(errorMessage(error));
      return;
    }

    if (editingRule) {
      updateRule.mutate({ ruleId: editingRule.id, payload }, { onSuccess: closeModal });
      return;
    }

    createRule.mutate(payload, { onSuccess: closeModal });
  };

  const toggleStatus = (rule: any) => {
    updateRule.mutate({
      ruleId: rule.id,
      payload: { isActive: !rule.is_active },
    });
  };

  const updateButton = (index: number, payload: Record<string, string>) => {
    setForm({
      ...form,
      buttons: form.buttons.map((button, buttonIndex) => (
        buttonIndex === index ? { ...button, ...payload } : button
      )),
    });
  };

  const addButton = () => setForm({ ...form, buttons: [...form.buttons, emptyButton()] });
  const removeButton = (index: number) => setForm({
    ...form,
    buttons: form.buttons.filter((_button, buttonIndex) => buttonIndex !== index),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bot Rules</h1>
          <p className="text-gray-600">
            {rulesQuery.isLoading ? 'Loading bot rules...' : 'Manage automated responses from live backend data'}
            {queueStatus.data ? ` · Queue: ${(queueStatus.data as any).queued ?? 0} queued` : ''}
          </p>
          {rulesQuery.error && <p className="text-sm text-red-600 mt-2">{errorMessage(rulesQuery.error)}</p>}
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-200 grid grid-cols-1 lg:grid-cols-[1fr_180px_200px] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rule name or trigger..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
          >
            <option value="all">All Types</option>
            <option value="text">Text</option>
            <option value="interactive">Interactive</option>
            <option value="form">Form</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trigger Keywords</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rulesQuery.isLoading && (
                <tr><td colSpan={6} className="px-6 py-8 text-sm text-gray-500">Loading bot rules...</td></tr>
              )}
              {!rulesQuery.isLoading && filteredRules.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-sm text-gray-500">No bot rules match the current filters.</td></tr>
              )}
              {filteredRules.map((rule: any) => {
                const responsePreview = getResponsePreview(rule);
                const matchCount = rule.match_count || rule.matchCount || 0;

                return (
                  <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                          <Bot className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{rule.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{responsePreview || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-mono">
                          {rule.trigger_value || '-'}
                        </span>
                        <span className="text-xs text-gray-500">{rule.trigger_type || 'keyword'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium capitalize">
                        {responseTypeLabel(rule.response_type || 'text')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{matchCount}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => toggleStatus(rule)}
                        disabled={updateRule.isPending}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium disabled:opacity-60 ${
                          rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rule.is_active ? 'active' : 'inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openEditModal(rule)} className="p-1.5 hover:bg-gray-100 rounded" title="Edit">
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button type="button" onClick={() => openDuplicateModal(rule)} className="p-1.5 hover:bg-gray-100 rounded" title="Duplicate">
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                        <button type="button" onClick={() => deleteRule.mutate(rule.id)} className="p-1.5 hover:bg-gray-100 rounded" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(createRule.error || updateRule.error || deleteRule.error) && (
        <p className="text-sm text-red-600">
          {errorMessage(createRule.error || updateRule.error || deleteRule.error)}
        </p>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={submitRule} className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingRule ? 'Edit Bot Rule' : 'Create Bot Rule'}</h2>
                <p className="text-sm text-gray-500 mt-1">Configure trigger matching and automated response output.</p>
              </div>
              <button type="button" onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <label className="block lg:col-span-2">
                <span className="block text-sm font-medium text-gray-700 mb-2">Rule Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</span>
                <select
                  value={form.triggerType}
                  onChange={(event) => setForm({ ...form, triggerType: event.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                >
                  <option value="keyword">Keyword</option>
                  <option value="regex">Regex</option>
                  <option value="intent">Intent</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-2">Response Type</span>
                <select
                  value={form.responseType}
                  onChange={(event) => setForm({
                    ...form,
                    responseType: event.target.value,
                    responseText: event.target.value === 'text' ? form.responseText : '',
                    formId: event.target.value === 'form' ? form.formId : '',
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                >
                  <option value="text">Text</option>
                  <option value="buttons">Interactive</option>
                  <option value="form">Form</option>
                  <option value="transfer">Transfer</option>
                  <option value="ai">AI</option>
                </select>
              </label>

              {form.triggerType === 'intent' ? (
                <div className="lg:col-span-2 grid grid-cols-1 gap-4">
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-2">Intent Name</span>
                    <input
                      value={form.intentName}
                      onChange={(event) => setForm({ ...form, intentName: event.target.value })}
                      required
                      placeholder="pricing_question"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-2">Examples</span>
                    <textarea
                      rows={5}
                      value={form.intentExamples}
                      onChange={(event) => setForm({ ...form, intentExamples: event.target.value })}
                      placeholder={'berapa harga layanan?\nminta pricelist\nbiaya chatbot berapa?'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </label>
                </div>
              ) : (
                <label className="block lg:col-span-2">
                  <span className="block text-sm font-medium text-gray-700 mb-2">Trigger Keywords / Regex</span>
                  <input
                    value={form.triggerValue}
                    onChange={(event) => setForm({ ...form, triggerValue: event.target.value })}
                    required
                    placeholder={form.triggerType === 'regex' ? '^halo|hai$' : 'halo, bantuan, harga'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                </label>
              )}

              {form.responseType === 'text' && (
                <label className="block lg:col-span-2">
                  <span className="block text-sm font-medium text-gray-700 mb-2">Response Message</span>
                  <textarea
                    rows={5}
                    value={form.responseText}
                    onChange={(event) => setForm({ ...form, responseText: event.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                </label>
              )}

              {form.responseType === 'form' && (
                <label className="block lg:col-span-2">
                  <span className="block text-sm font-medium text-gray-700 mb-2">Select Form</span>
                  <select
                    value={form.formId}
                    onChange={(event) => setForm({ ...form, formId: event.target.value })}
                    required
                    disabled={formsQuery.isLoading || activeForms.length === 0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366] disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">{formsQuery.isLoading ? 'Loading forms...' : 'Choose active form'}</option>
                    {activeForms.map((item: any) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  {!formsQuery.isLoading && activeForms.length === 0 && (
                    <p className="text-sm text-amber-600 mt-2">No active forms available. Create a form first.</p>
                  )}
                </label>
              )}

              {form.responseType === 'buttons' && (
                <div className="lg:col-span-2 space-y-4">
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-2">Message Text</span>
                    <textarea
                      rows={3}
                      value={form.buttonsText}
                      onChange={(event) => setForm({ ...form, buttonsText: event.target.value })}
                      required
                      placeholder="Silakan pilih menu:"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Buttons</h3>
                      <button type="button" onClick={addButton} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        Add Button
                      </button>
                    </div>

                    {form.buttons.map((button, index) => (
                      <div key={`${index}-${button.action}`} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          <label className="block">
                            <span className="block text-xs font-medium text-gray-600 mb-1">Button Label</span>
                            <input
                              value={button.label}
                              onChange={(event) => updateButton(index, { label: event.target.value })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                            />
                          </label>
                          <label className="block">
                            <span className="block text-xs font-medium text-gray-600 mb-1">Value</span>
                            <input
                              value={button.value}
                              onChange={(event) => updateButton(index, { value: event.target.value })}
                              placeholder="auto if empty"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                            />
                          </label>
                          <label className="block">
                            <span className="block text-xs font-medium text-gray-600 mb-1">Action</span>
                            <select
                              value={button.action}
                              onChange={(event) => updateButton(index, {
                                action: event.target.value,
                                triggerValue: '',
                                responseText: '',
                                formId: '',
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                            >
                              <option value="text">Text</option>
                              <option value="trigger">Trigger</option>
                              <option value="form">Form</option>
                              <option value="transfer">Transfer</option>
                            </select>
                          </label>
                        </div>

                        {button.action === 'text' && (
                          <label className="block">
                            <span className="block text-xs font-medium text-gray-600 mb-1">Response Text</span>
                            <textarea
                              rows={2}
                              value={button.responseText}
                              onChange={(event) => updateButton(index, { responseText: event.target.value })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                            />
                          </label>
                        )}

                        {button.action === 'trigger' && (
                          <label className="block">
                            <span className="block text-xs font-medium text-gray-600 mb-1">Trigger Value</span>
                            <input
                              value={button.triggerValue}
                              onChange={(event) => updateButton(index, { triggerValue: event.target.value })}
                              required
                              placeholder="laporan"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                            />
                          </label>
                        )}

                        {button.action === 'form' && (
                          <label className="block">
                            <span className="block text-xs font-medium text-gray-600 mb-1">Form</span>
                            <select
                              value={button.formId}
                              onChange={(event) => updateButton(index, { formId: event.target.value })}
                              required
                              disabled={formsQuery.isLoading || activeForms.length === 0}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] disabled:bg-gray-50 disabled:text-gray-400"
                            >
                              <option value="">{formsQuery.isLoading ? 'Loading forms...' : 'Choose active form'}</option>
                              {activeForms.map((item: any) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                              ))}
                            </select>
                          </label>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeButton(index)}
                            disabled={form.buttons.length === 1}
                            className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.responseType === 'ai' && (
                <div className="lg:col-span-2 grid grid-cols-1 gap-4">
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-2">System Prompt</span>
                    <textarea
                      rows={4}
                      value={form.aiSystemPrompt}
                      onChange={(event) => setForm({ ...form, aiSystemPrompt: event.target.value })}
                      placeholder="You are Company Site customer service."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-2">Instruction</span>
                    <textarea
                      rows={4}
                      value={form.aiInstruction}
                      onChange={(event) => setForm({ ...form, aiInstruction: event.target.value })}
                      placeholder="Answer pricing questions clearly and politely."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </label>
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-4">
                    <label className="block">
                      <span className="block text-sm font-medium text-gray-700 mb-2">Fallback Text</span>
                      <input
                        value={form.aiFallbackText}
                        onChange={(event) => setForm({ ...form, aiFallbackText: event.target.value })}
                        placeholder="Maaf, saya belum punya informasi harga detail."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium text-gray-700 mb-2">Temperature</span>
                      <input
                        type="number"
                        min={0}
                        max={2}
                        step={0.1}
                        value={form.aiTemperature}
                        onChange={(event) => setForm({ ...form, aiTemperature: Number(event.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                      />
                    </label>
                  </div>
                </div>
              )}

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-2">Priority</span>
                <input
                  type="number"
                  min={1}
                  value={form.priority}
                  onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </label>

              <div className="flex flex-col justify-end gap-3">
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.aiFallbackEnabled}
                    onChange={(event) => setForm({ ...form, aiFallbackEnabled: event.target.checked })}
                    className="w-4 h-4 text-[#25D366] rounded"
                  />
                  AI fallback
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                    className="w-4 h-4 text-[#25D366] rounded"
                  />
                  Active
                </label>
              </div>

              <div className="lg:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">
                    If incoming message matches <span className="font-mono text-gray-700">{form.triggerValue || 'trigger'}</span>
                  </p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {form.responseType === 'form'
                      ? `Starts form: ${activeForms.find((item: any) => String(item.id) === String(form.formId))?.name || 'Select a form'}`
                      : form.responseType === 'buttons'
                        ? [
                          form.buttonsText || 'Button message preview will appear here.',
                          '',
                          ...form.buttons
                            .filter((button) => button.label.trim())
                            .map((button, index) => `${index + 1}. ${button.label}`),
                          '',
                          'Balas dengan angka pilihan.',
                        ].join('\n')
                      : form.responseType === 'text'
                        ? form.responseText || 'Response message preview will appear here.'
                        : `${form.responseType} response will be handled by the bot engine.`}
                  </p>
                </div>
              </div>
              {formError && <p className="lg:col-span-2 text-sm text-red-600">{formError}</p>}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] disabled:opacity-60">
                {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
