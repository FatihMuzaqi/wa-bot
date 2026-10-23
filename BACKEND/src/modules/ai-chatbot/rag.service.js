import openaiConfig from '../../config/openai.js';
import KnowledgeRepository from './repositories/knowledge.repository.js';

export const retrieveContext = async ({ query, limit = openaiConfig.maxContextChunks }) => {
  const documents = await KnowledgeRepository.findRelevantDocuments({ query, limit });
  const words = String(query || '')
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length >= 3)
    .slice(0, 12);

  const rankedDocuments = documents
    .map((document) => {
      const text = String(document.chunk_text || '').toLowerCase();
      const score = words.reduce((total, word) => (
        text.includes(word) ? total + 1 : total
      ), 0);
      return { document, score };
    })
    .sort((a, b) => (
      b.score - a.score
      || new Date(b.document.updated_at || 0).getTime() - new Date(a.document.updated_at || 0).getTime()
    ))
    .slice(0, limit)
    .map(({ document }) => document);

  return rankedDocuments.map((document, index) => ({
    index: index + 1,
    id: document.id,
    sourceId: document.ai_knowledge_source_id,
    sourceName: document.knowledgeSource?.name,
    sourceType: document.knowledgeSource?.source_type,
    title: document.title,
    text: document.chunk_text,
    metadata: document.metadata,
  }));
};

export const formatContext = (chunks) => {
  if (!chunks.length) return 'No knowledge base context was found.';

  return chunks.map((chunk) => (
    `[${chunk.index}] Source: ${chunk.sourceName || 'Unknown'} (${chunk.sourceType || 'unknown'})\n${chunk.text}`
  )).join('\n\n');
};

export default {
  retrieveContext,
  formatContext,
};
