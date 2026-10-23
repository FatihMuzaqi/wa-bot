import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Download,
  Edit2,
  Eye,
  FileText,
  Hash,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  useCreateForm,
  useCreateFormStep,
  useDeleteForm,
  useDeleteFormStep,
  useFormDetail,
  useFormSubmissionDetail,
  useFormSubmissions,
  useForms,
  useForwardFormSubmission,
  useReorderFormSteps,
  useUpdateForm,
  useUpdateFormSubmission,
  useUpdateFormStep,
} from '../hooks/useForms';
import { formsService } from '../services/forms.service';

type FormState = {
  name: string;
  description: string;
  status: string;
};

type StepState = {
  question: string;
  inputType: string;
  optionsText: string;
  validationText: string;
};

const emptyForm: FormState = { name: '', description: '', status: 'draft' };
const emptyStep: StepState = { question: '', inputType: 'text', optionsText: '', validationText: '{}' };
const inputClass = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]';

const inputIcons: Record<string, any> = {
  text: MessageSquare,
  email: Mail,
  number: Hash,
  choice: ChevronDown,
  date: Calendar,
  file: Upload,
};

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong');

const parseJson = (value: string, fallback: any) => {
  try {
    return value.trim() ? JSON.parse(value) : fallback;
  } catch {
    throw new Error('Options and validation rules must be valid JSON');
  }
};

const toJsonText = (value: unknown, fallback: string) => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
};

export function Forms() {
  const formsQuery = useForms({ page: 1, limit: 50 });
  const createForm = useCreateForm();
  const updateForm = useUpdateForm();
  const deleteForm = useDeleteForm();
  const createStep = useCreateFormStep();
  const updateStep = useUpdateFormStep();
  const deleteStep = useDeleteFormStep();
  const reorderSteps = useReorderFormSteps();

  const [search, setSearch] = useState('');
  const [selectedFormId, setSelectedFormId] = useState<number | string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [stepState, setStepState] = useState<StepState>(emptyStep);
  const [previewMode, setPreviewMode] = useState(false);
  const [localError, setLocalError] = useState('');

  const forms = formsQuery.data?.rows || [];
  const selectedFormQuery = useFormDetail(selectedFormId);
  const selectedForm = selectedFormQuery.data || forms.find((form: any) => String(form.id) === String(selectedFormId));
  const steps = useMemo(() => [...(selectedForm?.steps || [])].sort((a: any, b: any) => a.step_order - b.step_order), [selectedForm]);

  useEffect(() => {
    if (!selectedFormId && forms.length > 0) {
      setSelectedFormId(forms[0].id);
    }
  }, [forms, selectedFormId]);

  const filteredForms = forms.filter((form: any) => {
    const term = search.trim().toLowerCase();
    return !term
      || String(form.name || '').toLowerCase().includes(term)
      || String(form.description || '').toLowerCase().includes(term);
  });

  const openCreateForm = () => {
    setEditingForm(null);
    setFormState(emptyForm);
    setLocalError('');
    setShowFormModal(true);
  };

  const openEditForm = (form: any) => {
    setEditingForm(form);
    setFormState({
      name: form.name || '',
      description: form.description || '',
      status: form.status || 'draft',
    });
    setLocalError('');
    setShowFormModal(true);
  };

  const submitForm = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim(),
      status: formState.status,
    };

    if (editingForm) {
      updateForm.mutate({ formId: editingForm.id, payload }, { onSuccess: () => setShowFormModal(false) });
      return;
    }

    createForm.mutate(payload, {
      onSuccess: (created: any) => {
        setSelectedFormId(created.id);
        setShowFormModal(false);
      },
    });
  };

  const openCreateStep = () => {
    setEditingStep(null);
    setStepState(emptyStep);
    setLocalError('');
    setShowStepModal(true);
  };

  const openEditStep = (step: any) => {
    setEditingStep(step);
    setStepState({
      question: step.question || '',
      inputType: step.input_type || 'text',
      optionsText: toJsonText(step.options, '[]'),
      validationText: toJsonText(step.validation_rules, '{}'),
    });
    setLocalError('');
    setShowStepModal(true);
  };

  const submitStep = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFormId) return;

    try {
      const payload = {
        question: stepState.question.trim(),
        inputType: stepState.inputType,
        options: parseJson(stepState.optionsText, []),
        validationRules: parseJson(stepState.validationText, {}),
      };

      if (editingStep) {
        updateStep.mutate({ formId: selectedFormId, stepId: editingStep.id, payload }, { onSuccess: () => setShowStepModal(false) });
        return;
      }

      createStep.mutate({ formId: selectedFormId, payload }, { onSuccess: () => setShowStepModal(false) });
    } catch (error) {
      setLocalError(errorMessage(error));
    }
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    if (!selectedFormId) return;
    const next = [...steps];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderSteps.mutate({ formId: selectedFormId, steps: next.map((step: any) => step.id) });
  };

  const mutationError = createForm.error || updateForm.error || deleteForm.error
    || createStep.error || updateStep.error || deleteStep.error || reorderSteps.error;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Builder</h1>
          <p className="text-gray-600">{formsQuery.isLoading ? 'Loading forms...' : 'Create conversational forms from backend data'}</p>
          {formsQuery.error && <p className="text-sm text-red-600 mt-2">{errorMessage(formsQuery.error)}</p>}
          {mutationError && <p className="text-sm text-red-600 mt-2">{errorMessage(mutationError)}</p>}
        </div>
        <button onClick={openCreateForm} className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]">
          <Plus className="w-4 h-4" />
          Create Form
        </button>
      </div>

      <SubmissionOperations forms={forms} />

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search forms..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-[680px] overflow-y-auto">
            {formsQuery.isLoading && <p className="text-sm text-gray-500">Loading forms...</p>}
            {!formsQuery.isLoading && filteredForms.length === 0 && <p className="text-sm text-gray-500">No forms found.</p>}
            {filteredForms.map((form: any) => (
              <button
                key={form.id}
                onClick={() => setSelectedFormId(form.id)}
                className={`w-full text-left border rounded-lg p-4 hover:border-[#25D366] ${
                  String(selectedFormId) === String(form.id) ? 'border-[#25D366] bg-green-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{form.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{form.description || 'No description'}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{form.status}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Steps</p>
                    <p className="text-sm font-medium text-gray-900">{form.steps?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submissions</p>
                    <p className="text-sm font-medium text-gray-900">{form.submissions?.length || 0}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[620px]">
          {!selectedForm && !formsQuery.isLoading && (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Select or create a form to start building.</p>
            </div>
          )}

          {selectedForm && (
            <>
              <div className="p-6 border-b border-gray-200 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedForm.name}</h2>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{selectedForm.status}</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedForm.description || 'No description'}</p>
                  {selectedFormQuery.isFetching && <p className="text-xs text-gray-400 mt-2">Refreshing form detail...</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setPreviewMode(!previewMode)} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Eye className="w-4 h-4" />
                    {previewMode ? 'Builder' : 'Preview'}
                  </button>
                  <button onClick={() => openEditForm(selectedForm)} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button onClick={() => deleteForm.mutate(selectedForm.id, { onSuccess: () => setSelectedFormId(null) })} className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  {!previewMode && (
                    <button onClick={openCreateStep} className="inline-flex items-center gap-2 px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]">
                      <Plus className="w-4 h-4" />
                      Add Step
                    </button>
                  )}
                </div>
              </div>

              {previewMode ? (
                <div className="p-6 space-y-4">
                  {steps.length === 0 && <p className="text-sm text-gray-500">No steps to preview.</p>}
                  {steps.map((step: any, index: number) => (
                    <div key={step.id} className="max-w-2xl">
                      <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                        <p className="text-xs text-green-700 font-medium mb-1">Bot · Step {index + 1}</p>
                        <p className="text-sm text-gray-900">{step.question}</p>
                      </div>
                      <div className="mt-2 ml-8 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">User input</p>
                        <p className="text-sm text-gray-700">
                          {step.input_type === 'choice' ? `Choose from ${Array.isArray(step.options) ? step.options.join(', ') : 'configured options'}` : `${step.input_type} answer`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 space-y-3">
                  {steps.length === 0 && <p className="text-sm text-gray-500">No steps yet. Add the first question to build the flow.</p>}
                  {steps.map((step: any, index: number) => {
                    const Icon = inputIcons[step.input_type] || MessageSquare;
                    return (
                      <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 mb-1">Step {index + 1} · {step.input_type}</p>
                              <h3 className="font-medium text-gray-900">{step.question}</h3>
                              {step.input_type === 'choice' && <p className="text-xs text-gray-500 mt-2">Options: {Array.isArray(step.options) ? step.options.join(', ') : '-'}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => moveStep(index, -1)} disabled={index === 0 || reorderSteps.isPending} className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-40">
                              <ChevronUp className="w-4 h-4 text-gray-600" />
                            </button>
                            <button onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1 || reorderSteps.isPending} className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-40">
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            </button>
                            <button onClick={() => openEditStep(step)} className="p-1.5 hover:bg-gray-100 rounded">
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button onClick={() => selectedFormId && deleteStep.mutate({ formId: selectedFormId, stepId: step.id })} className="p-1.5 hover:bg-gray-100 rounded">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={submitForm} className="bg-white rounded-xl max-w-xl w-full shadow-xl">
            <ModalHeader title={editingForm ? 'Edit Form' : 'Create Form'} onClose={() => setShowFormModal(false)} />
            <div className="p-6 space-y-4">
              <Field label="Name">
                <input value={formState.name} onChange={(event) => setFormState({ ...formState, name: event.target.value })} required className={inputClass} />
              </Field>
              <Field label="Description">
                <textarea value={formState.description} onChange={(event) => setFormState({ ...formState, description: event.target.value })} rows={4} className={inputClass} />
              </Field>
              <Field label="Status">
                <select value={formState.status} onChange={(event) => setFormState({ ...formState, status: event.target.value })} className={inputClass}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <ModalFooter onCancel={() => setShowFormModal(false)} saving={createForm.isPending || updateForm.isPending} label={editingForm ? 'Update Form' : 'Create Form'} />
          </form>
        </div>
      )}

      {showStepModal && selectedForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={submitStep} className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <ModalHeader title={editingStep ? 'Edit Step' : 'Add Step'} onClose={() => setShowStepModal(false)} />
            <div className="p-6 space-y-4">
              {localError && <p className="text-sm text-red-600">{localError}</p>}
              <Field label="Question">
                <textarea value={stepState.question} onChange={(event) => setStepState({ ...stepState, question: event.target.value })} required rows={3} className={inputClass} />
              </Field>
              <Field label="Input Type">
                <select value={stepState.inputType} onChange={(event) => setStepState({ ...stepState, inputType: event.target.value })} className={inputClass}>
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="choice">Choice</option>
                  <option value="date">Date</option>
                  <option value="file">File</option>
                </select>
              </Field>
              <Field label="Options JSON">
                <textarea value={stepState.optionsText} onChange={(event) => setStepState({ ...stepState, optionsText: event.target.value })} rows={4} className={`${inputClass} font-mono text-sm`} />
              </Field>
              <Field label="Validation Rules JSON">
                <textarea value={stepState.validationText} onChange={(event) => setStepState({ ...stepState, validationText: event.target.value })} rows={4} className={`${inputClass} font-mono text-sm`} />
              </Field>
            </div>
            <ModalFooter onCancel={() => setShowStepModal(false)} saving={createStep.isPending || updateStep.isPending} label={editingStep ? 'Update Step' : 'Add Step'} />
          </form>
        </div>
      )}
    </div>
  );
}

function SubmissionOperations({ forms }: { forms: any[] }) {
  const [formId, setFormId] = useState('');
  const [status, setStatus] = useState('');
  const [operationalStatus, setOperationalStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [notes, setNotes] = useState('');
  const [detailStatus, setDetailStatus] = useState('new');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const params = {
    page,
    limit: 20,
    ...(formId && { formId }),
    ...(status && { status }),
    ...(operationalStatus && { operationalStatus }),
    ...(search.trim() && { search: search.trim() }),
  };
  const submissionsQuery = useFormSubmissions(params);
  const detailQuery = useFormSubmissionDetail(selectedId);
  const updateSubmission = useUpdateFormSubmission();
  const forwardSubmission = useForwardFormSubmission();
  const submissions = submissionsQuery.data?.rows || [];
  const pagination = submissionsQuery.data?.pagination;
  const detail = detailQuery.data;

  useEffect(() => {
    if (!detail) return;
    setNotes(detail.notes || '');
    setDetailStatus(detail.operational_status || 'new');
  }, [detail]);

  const resetPage = () => setPage(1);
  const downloadCsv = async () => {
    setExportError('');
    setExporting(true);
    try {
      const response = await formsService.exportSubmissions({
        ...(formId && { formId }),
        ...(status && { status }),
        ...(operationalStatus && { operationalStatus }),
        ...(search.trim() && { search: search.trim() }),
      });
      const disposition = String(response.headers['content-disposition'] || '');
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'form-submissions.csv';
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(errorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  const saveDetail = () => {
    if (!selectedId) return;
    updateSubmission.mutate({
      submissionId: selectedId,
      payload: { operationalStatus: detailStatus, notes },
    });
  };

  const operationError = submissionsQuery.error || detailQuery.error || updateSubmission.error || forwardSubmission.error;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#128C7E]" />
            <h2 className="text-lg font-bold text-gray-900">Submission Operations</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">Review answers, track follow-up, export, and forward completed data.</p>
        </div>
        <button onClick={downloadCsv} disabled={exporting} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="p-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="Contact, phone, or email" className={`${inputClass} pl-9 text-sm`} />
        </div>
        <select value={formId} onChange={(event) => { setFormId(event.target.value); resetPage(); }} className={`${inputClass} text-sm`}>
          <option value="">All forms</option>
          {forms.map((form) => <option key={form.id} value={form.id}>{form.name}</option>)}
        </select>
        <select value={status} onChange={(event) => { setStatus(event.target.value); resetPage(); }} className={`${inputClass} text-sm`}>
          <option value="">All submission states</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="abandoned">Abandoned</option>
        </select>
        <select value={operationalStatus} onChange={(event) => { setOperationalStatus(event.target.value); resetPage(); }} className={`${inputClass} text-sm`}>
          <option value="">All follow-up states</option>
          <option value="new">New</option>
          <option value="in_review">In review</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {(operationError || exportError) && <p className="px-5 pt-4 text-sm text-red-600">{exportError || errorMessage(operationError)}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Form</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3">Progress</th>
              <th className="px-5 py-3">Follow-up</th>
              <th className="px-5 py-3">Forward</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissionsQuery.isLoading && <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-500">Loading submissions...</td></tr>}
            {!submissionsQuery.isLoading && submissions.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-500">No submissions match these filters.</td></tr>}
            {submissions.map((submission: any) => (
              <tr key={submission.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{submission.contact?.name || 'Unknown contact'}</p>
                  <p className="text-xs text-gray-500">{submission.contact?.phone || submission.contact?.email || '-'}</p>
                </td>
                <td className="px-5 py-4 text-gray-700">{submission.form?.name || `Form #${submission.form_id}`}</td>
                <td className="px-5 py-4 text-gray-600">{formatDate(submission.completed_at || submission.started_at)}</td>
                <td className="px-5 py-4"><StatusPill value={submission.status} /></td>
                <td className="px-5 py-4"><StatusPill value={submission.operational_status || 'new'} /></td>
                <td className="px-5 py-4"><StatusPill value={submission.forward_status || 'not_sent'} /></td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setSelectedId(submission.id)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-white">View</button>
                    <button onClick={() => forwardSubmission.mutate(submission.id)} disabled={forwardSubmission.isPending} title="Forward to configured webhook" className="p-2 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
          <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} results</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Previous</button>
            <button onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))} disabled={page >= pagination.totalPages} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {selectedId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <ModalHeader title={`Submission #${selectedId}`} onClose={() => setSelectedId(null)} />
            {detailQuery.isLoading && <p className="p-6 text-sm text-gray-500">Loading submission...</p>}
            {detail && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <Info label="Form" value={detail.form?.name} />
                  <Info label="Contact" value={`${detail.contact?.name || '-'} · ${detail.contact?.phone || '-'}`} />
                  <Info label="Submission status" value={detail.status} />
                  <Info label="Completed" value={formatDate(detail.completed_at)} />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Answers</h3>
                  <div className="space-y-3">
                    {(detail.answers || []).length === 0 && <p className="text-sm text-gray-500">No answers have been recorded.</p>}
                    {(detail.answers || []).map((answer: any) => (
                      <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Step {answer.step?.step_order} · {answer.step?.input_type}</p>
                        <p className="text-sm font-medium text-gray-800">{answer.step?.question || 'Question unavailable'}</p>
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{answer.answer || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Follow-up Status">
                    <select value={detailStatus} onChange={(event) => setDetailStatus(event.target.value)} className={inputClass}>
                      <option value="new">New</option>
                      <option value="in_review">In review</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </Field>
                  <Info label="Forward status" value={detail.forward_status || 'Not sent'} />
                </div>
                <Field label="Internal Notes">
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} maxLength={10000} placeholder="Add handling notes, decisions, or follow-up details..." className={inputClass} />
                </Field>
                {detail.forward_error && <p className="text-sm text-red-600">Last forward error: {detail.forward_error}</p>}
              </div>
            )}
            <div className="p-6 border-t border-gray-200 flex flex-wrap justify-end gap-3">
              <button onClick={() => selectedId && forwardSubmission.mutate(selectedId)} disabled={forwardSubmission.isPending} className="inline-flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-60">
                <Send className="w-4 h-4" />
                {forwardSubmission.isPending ? 'Forwarding...' : 'Forward'}
              </button>
              <button onClick={saveDetail} disabled={updateSubmission.isPending} className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] disabled:opacity-60">
                {updateSubmission.isPending ? 'Saving...' : 'Save Follow-up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID');
}

function StatusPill({ value }: { value: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    resolved: 'bg-green-100 text-green-700',
    sent: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    in_review: 'bg-amber-100 text-amber-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    abandoned: 'bg-gray-100 text-gray-700',
    new: 'bg-purple-100 text-purple-700',
    not_sent: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-700'}`}>{value.replace(/_/g, ' ')}</span>;
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '-'}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-2">{label}</span>
      {children}
    </label>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
        <X className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  );
}

function ModalFooter({ onCancel, saving, label }: { onCancel: () => void; saving: boolean; label: string }) {
  return (
    <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
      <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" disabled={saving} className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] disabled:opacity-60">
        {saving ? 'Saving...' : label}
      </button>
    </div>
  );
}
