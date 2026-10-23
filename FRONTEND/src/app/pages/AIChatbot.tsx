import { FormEvent, useMemo, useState } from 'react';
import {
  BookOpen,
  Brain,
  Database,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  useAddFaq,
  useCreateKnowledgeSource,
  useDeleteKnowledgeSource,
  useGenerateAnswer,
  useKnowledgeSources,
  usePrompts,
} from '../hooks/useAIChatbot';

type ModalType = 'faq' | 'text' | 'pdf' | 'excel' | null;

const sourceTypeLabel: Record<string, string> = {
  faq: 'FAQ',
  document: 'Document',
  article: 'Article',
  url: 'URL',
  custom: 'Custom',
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const makeUploadPayload = ({ name, sourceType, file }: { name: string; sourceType: string; file: File }) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('sourceType', sourceType);
  formData.append('file', file);
  return formData;
};

function KnowledgeModal({
  type,
  onClose,
}: {
  type: Exclude<ModalType, null>;
  onClose: () => void;
}) {
  const addFaq = useAddFaq();
  const createSource = useCreateKnowledgeSource();
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const isPending = addFaq.isPending || createSource.isPending;
  const mutationError = addFaq.error?.message || createSource.error?.message;

  const title = {
    faq: 'Add FAQ',
    text: 'Add Text Document',
    pdf: 'Upload PDF',
    excel: 'Upload Excel',
  }[type];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (type === 'faq') {
      if (!question.trim() || !answer.trim()) {
        setFormError('Question and answer are required.');
        return;
      }
      addFaq.mutate({
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim() || undefined,
        sourceName: name.trim() || 'FAQ',
      }, { onSuccess: onClose });
      return;
    }

    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }

    if (type === 'text') {
      if (!rawContent.trim()) {
        setFormError('Text content is required.');
        return;
      }
      createSource.mutate({
        name: name.trim(),
        sourceType: 'document',
        rawContent: rawContent.trim(),
      }, { onSuccess: onClose });
      return;
    }

    if (!file) {
      setFormError('File is required.');
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (type === 'pdf' && !lowerName.endsWith('.pdf')) {
      setFormError('PDF upload must use a .pdf file.');
      return;
    }
    if (type === 'excel' && !lowerName.endsWith('.xlsx')) {
      setFormError('Excel upload must use a .xlsx file.');
      return;
    }

    createSource.mutate(makeUploadPayload({
      name: name.trim(),
      sourceType: type === 'excel' ? 'custom' : 'document',
      file,
    }), { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={type === 'faq' ? 'FAQ' : 'Company Knowledge'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            />
          </div>

          {type === 'faq' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
                <textarea
                  rows={5}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </div>
            </>
          )}

          {type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Raw Content</label>
              <textarea
                rows={10}
                value={rawContent}
                onChange={(event) => setRawContent(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
            </div>
          )}

          {(type === 'pdf' || type === 'excel') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === 'pdf' ? 'PDF File' : 'Excel File'}
              </label>
              <input
                type="file"
                accept={type === 'pdf' ? '.pdf,application/pdf' : '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

          {(formError || mutationError) && (
            <p className="text-sm text-red-600">{formError || mutationError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] disabled:opacity-60"
            >
              {type === 'pdf' || type === 'excel' ? <Upload className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AIChatbot() {
  const knowledgeQuery = useKnowledgeSources();
  const promptsQuery = usePrompts();
  const generateAnswer = useGenerateAnswer();
  const deleteSource = useDeleteKnowledgeSource();
  const sources = knowledgeQuery.data || [];
  const prompts = promptsQuery.data || [];
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [search, setSearch] = useState('');
  const [showTestChat, setShowTestChat] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [conversation, setConversation] = useState<any[]>([]);

  const filteredSources = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sources;
    return sources.filter((source: any) => (
      String(source.name || '').toLowerCase().includes(keyword)
      || String(source.source_type || '').toLowerCase().includes(keyword)
      || String(source.status || '').toLowerCase().includes(keyword)
    ));
  }, [search, sources]);

  const lastConfidence = [...conversation].reverse().find((item) => item.confidence !== undefined)?.confidence;

  const askAi = () => {
    if (!testMessage.trim()) return;
    const question = testMessage;
    setConversation((items) => [...items, { role: 'user', content: question }]);
    setTestMessage('');
    generateAnswer.mutate({ question }, {
      onSuccess: (data) => {
        setConversation((items) => [...items, {
          role: 'assistant',
          content: data.answer || data.content || '',
          confidence: data.confidence,
        }]);
      },
    });
  };

  return (
    <div className="p-6">
      {activeModal && <KnowledgeModal type={activeModal} onClose={() => setActiveModal(null)} />}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Chatbot</h1>
          <p className="text-gray-600">
            {knowledgeQuery.isLoading ? 'Loading knowledge base...' : 'Manage AI knowledge base and prompts'}
          </p>
          {knowledgeQuery.error && <p className="text-sm text-red-600 mt-2">{knowledgeQuery.error.message}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveModal('faq')} className="flex items-center gap-2 px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]">
            <BookOpen className="w-4 h-4" />
            FAQ
          </button>
          <button onClick={() => setActiveModal('text')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FileText className="w-4 h-4" />
            Text
          </button>
          <button onClick={() => setActiveModal('pdf')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            PDF
          </button>
          <button onClick={() => setActiveModal('excel')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Knowledge Sources</span>
            <Database className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{sources.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Chunks</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {sources.reduce((total: number, source: any) => total + Number(source.item_count || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Last Confidence</span>
            <MessageSquare className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {lastConfidence !== undefined ? `${Math.round(lastConfidence * 100)}%` : '-'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="font-semibold text-gray-900">Knowledge Sources</h3>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    type="text"
                    placeholder="Search sources..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Indexed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {knowledgeQuery.isLoading && (
                    <tr><td colSpan={6} className="px-4 py-5 text-sm text-gray-500">Loading knowledge sources...</td></tr>
                  )}
                  {!knowledgeQuery.isLoading && filteredSources.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-5 text-sm text-gray-500">No knowledge sources found.</td></tr>
                  )}
                  {filteredSources.map((source: any) => (
                    <tr key={source.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{source.name}</p>
                        {source.metadata?.originalFileName && (
                          <p className="text-xs text-gray-500">{source.metadata.originalFileName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sourceTypeLabel[source.source_type] || source.source_type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          source.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : source.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                        >
                          {source.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{source.item_count || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(source.last_indexed_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteSource.mutate(source.id)}
                          disabled={deleteSource.isPending}
                          className="inline-flex items-center justify-center p-2 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60"
                          aria-label="Delete source"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {deleteSource.error && <p className="px-6 pb-4 text-sm text-red-600">{deleteSource.error.message}</p>}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">AI Prompts</h3>
            </div>
            <div className="p-6 space-y-3">
              {promptsQuery.isLoading && <p className="text-sm text-gray-500">Loading prompts...</p>}
              {prompts.length === 0 && !promptsQuery.isLoading && <p className="text-sm text-gray-500">No prompts configured.</p>}
              {prompts.map((prompt: any) => (
                <div key={prompt.id} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{prompt.name}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{prompt.prompt_text || prompt.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-fit">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Test AI Chatbot</h3>
            <button onClick={() => setShowTestChat(!showTestChat)} className="text-sm text-[#25D366] hover:text-[#128C7E]">
              {showTestChat ? 'Hide' : 'Show'}
            </button>
          </div>
          {showTestChat ? (
            <>
              <div className="p-4 bg-gray-50 h-96 overflow-y-auto space-y-3">
                {conversation.length === 0 && <p className="text-sm text-gray-500">Ask a question to test the backend AI response.</p>}
                {conversation.map((msg, index) => (
                  <div key={`${msg.role}-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-[#25D366] text-white' : 'bg-white border border-gray-200'}`}>
                      <p className="text-sm">{msg.content}</p>
                      {msg.confidence !== undefined && <p className="text-xs text-gray-500 mt-1">Confidence: {Math.round(msg.confidence * 100)}%</p>}
                    </div>
                  </div>
                ))}
                {generateAnswer.isPending && <p className="text-sm text-gray-500">Generating answer...</p>}
                {generateAnswer.error && <p className="text-sm text-red-600">{generateAnswer.error.message}</p>}
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    value={testMessage}
                    onChange={(event) => setTestMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') askAi();
                    }}
                    placeholder="Test a question..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                  <button onClick={askAi} disabled={generateAnswer.isPending} className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] disabled:opacity-60">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center py-8">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Click Show to test AI responses</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
