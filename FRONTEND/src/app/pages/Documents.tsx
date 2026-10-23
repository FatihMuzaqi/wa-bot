import { Database, FileText, Image, Plus, Search } from 'lucide-react';
import { useKnowledgeSources } from '../hooks/useAIChatbot';

export function Documents() {
  const knowledgeQuery = useKnowledgeSources();
  const sources = knowledgeQuery.data || [];
  const documentSources = sources.filter((source: any) => ['document', 'article', 'url', 'custom'].includes(source.source_type));

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Document & Knowledge Sources</h1>
          <p className="text-gray-600">{knowledgeQuery.isLoading ? 'Loading documents...' : 'Documents are loaded from the AI knowledge base API'}</p>
          {knowledgeQuery.error && <p className="text-sm text-red-600 mt-2">{knowledgeQuery.error.message}</p>}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]">
          <Plus className="w-4 h-4" />
          Add Source
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Knowledge Sources</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{sources.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Documents</span>
            <FileText className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{documentSources.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Image Templates</span>
            <Image className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Document Sources</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input placeholder="Search sources..." className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]" />
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {!knowledgeQuery.isLoading && documentSources.length === 0 && <p className="text-sm text-gray-500">No document sources found.</p>}
          {documentSources.map((source: any) => (
            <div key={source.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#25D366]">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{source.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{source.source_type}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{source.description || '-'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
