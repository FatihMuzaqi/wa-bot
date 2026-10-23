import crypto from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import * as XLSX from 'xlsx';
import openaiConfig from '../../config/openai.js';
import ApiError from '../../utils/ApiError.js';
import AIProviderService from '../bot-engine/aiProvider.service.js';
import RagService from './rag.service.js';
import ConfidenceService from './confidence.service.js';
import PromptRepository from './repositories/aiPrompt.repository.js';
import KnowledgeRepository from './repositories/knowledge.repository.js';

const defaultSystemPrompt = `You are a helpful WhatsApp customer support assistant.
Use only the provided knowledge base context when possible.
If the context is insufficient, set shouldFallback to true.
Return only valid JSON with this shape:
{
  "answer": "short helpful answer",
  "confidence": 0.0,
  "shouldFallback": false,
  "fallbackReason": null,
  "sources": []
}`;

const buildInstructions = ({ systemPrompt, context }) => `${systemPrompt || defaultSystemPrompt}

Knowledge base context:
${context}

Rules:
- Answer in the same language as the user when reasonable.
- Keep the answer concise and suitable for WhatsApp.
- confidence must be a number from 0 to 1.
- shouldFallback must be true if the knowledge base does not support the answer.`;

const sourceTypes = new Set(['document', 'faq', 'article', 'url', 'custom']);

const normalizeSourceType = (value) => {
  const sourceType = String(value || '').trim().toLowerCase();
  if (!sourceTypes.has(sourceType)) throw new ApiError(422, 'sourceType must be one of document, faq, article, url, custom');
  return sourceType;
};

const splitIntoChunks = (text, { minSize = 500, maxSize = 1000 } = {}) => {
  const normalized = String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks = [];
  let current = '';

  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };

  paragraphs.forEach((paragraph) => {
    if (paragraph.length > maxSize) {
      pushCurrent();
      for (let index = 0; index < paragraph.length; index += maxSize) {
        chunks.push(paragraph.slice(index, index + maxSize).trim());
      }
      return;
    }

    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length > maxSize && current.length >= minSize) {
      pushCurrent();
      current = paragraph;
      return;
    }
    current = next;
  });

  pushCurrent();
  return chunks;
};

const buildDocumentPayloads = ({ sourceId, title, text, metadata = {} }) => (
  splitIntoChunks(text).map((chunk, index) => ({
    ai_knowledge_source_id: sourceId,
    title: title || `Chunk ${index + 1}`,
    chunk_text: chunk,
    chunk_hash: crypto.createHash('sha256').update(chunk).digest('hex'),
    token_count: Math.ceil(chunk.length / 4),
    metadata: {
      ...metadata,
      chunkIndex: index + 1,
    },
  }))
);

const syncSourceItemCount = async (sourceId, status = 'active') => {
  const itemCount = await KnowledgeRepository.countDocumentsBySource(sourceId);
  return KnowledgeRepository.updateSource(sourceId, {
    item_count: itemCount,
    status,
    last_indexed_at: new Date(),
  });
};

const indexSourceText = async ({ source, title, text, metadata }) => {
  const documents = buildDocumentPayloads({
    sourceId: source.id,
    title,
    text,
    metadata,
  });

  if (documents.length === 0) {
    await KnowledgeRepository.updateSource(source.id, {
      status: 'failed',
      metadata: {
        ...(source.metadata || {}),
        error: 'No indexable text found',
      },
    });
    throw new ApiError(422, 'No indexable text found');
  }

  await KnowledgeRepository.bulkCreateDocuments(documents);
  return syncSourceItemCount(source.id);
};

const extractPdfText = async (file) => {
  const parser = new PDFParse({ data: file.buffer });
  try {
    const result = await parser.getText();
    return result.text || '';
  } finally {
    await parser.destroy();
  }
};

const excelRowToText = (row) => {
  const entries = Object.entries(row)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');

  if (entries.length === 0) return '';

  const product = row.Product || row.product || row.Paket || row.paket || row.Name || row.name;
  const price = row.Price || row.price || row.Harga || row.harga;
  if (product && price) return `Paket ${product} memiliki harga ${price}.`;

  return entries.map(([key, value]) => `${key}: ${value}`).join(', ');
};

const extractExcelText = (file) => {
  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  return workbook.SheetNames.flatMap((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return rows.map(excelRowToText).filter(Boolean);
  }).join('\n\n');
};

const extractUploadText = async (file) => {
  if (!file) return null;
  const name = String(file.originalname || '').toLowerCase();
  if (name.endsWith('.pdf')) return extractPdfText(file);
  if (name.endsWith('.xlsx')) return extractExcelText(file);
  throw new ApiError(422, 'File must be a .pdf or .xlsx document');
};

export const generateAnswer = async ({ question, conversation = [], promptType = 'system' }) => {
  if (!question) throw new ApiError(422, 'question is required');

  const [prompt, contextChunks] = await Promise.all([
    PromptRepository.findActivePrompt(promptType),
    RagService.retrieveContext({ query: question }),
  ]);

  const context = RagService.formatContext(contextChunks);
  const instructions = buildInstructions({
    systemPrompt: prompt?.content,
    context,
  });

  const input = [
    ...conversation.map((message) => ({
      role: message.role || 'user',
      content: message.content,
    })),
    {
      role: 'user',
      content: question,
    },
  ];

  const response = await AIProviderService.createResponse({
    instructions,
    input,
    model: prompt?.model || undefined,
    temperature: prompt?.temperature === undefined ? 0.2 : Number(prompt.temperature),
  });

  const parsed = ConfidenceService.parseAiAnswer(response.outputText);
  console.log('[AIChatbot] AI parse result:', {
    provider: response.provider,
    model: response.model,
    parsed,
  });

  return {
    answer: parsed.answer,
    confidence: parsed.confidence,
    shouldFallback: parsed.shouldFallback,
    fallbackReason: parsed.fallbackReason,
    sources: parsed.sources.length ? parsed.sources : contextChunks.map((chunk) => ({
      id: chunk.id,
      sourceId: chunk.sourceId,
      title: chunk.title,
      sourceName: chunk.sourceName,
    })),
    prompt: prompt ? {
      id: prompt.id,
      name: prompt.name,
      promptType: prompt.prompt_type,
      model: prompt.model,
      temperature: prompt.temperature,
      confidenceThreshold: prompt.confidence_threshold,
    } : null,
    promptType,
    conversation,
    knowledgeContext: contextChunks,
    requestPayload: {
      instructions,
      input,
      provider: response.provider,
      model: response.model,
      temperature: prompt?.temperature === undefined ? 0.2 : Number(prompt.temperature),
    },
    provider: response.provider,
    model: response.model,
    requestId: response.requestId,
    rawOutput: response.outputText,
  };
};

export const listPrompts = () => PromptRepository.findAllPrompts();

export const createPrompt = (user, payload) => PromptRepository.createPrompt({
  name: payload.name,
  prompt_type: payload.prompt_type || payload.promptType || 'system',
  content: payload.content,
  model: payload.model || null,
  temperature: payload.temperature ?? 0.2,
  confidence_threshold: payload.confidence_threshold ?? payload.confidenceThreshold ?? openaiConfig.confidenceThreshold,
  is_active: payload.is_active ?? payload.isActive ?? true,
  created_by: user.id,
});

export const updatePrompt = async (promptId, payload) => {
  const updatePayload = {
    ...payload,
  };
  if (payload.promptType) updatePayload.prompt_type = payload.promptType;
  if (payload.confidenceThreshold) updatePayload.confidence_threshold = payload.confidenceThreshold;
  if (payload.isActive !== undefined) updatePayload.is_active = payload.isActive;

  const prompt = await PromptRepository.updatePrompt(promptId, updatePayload);
  if (!prompt) throw new ApiError(404, 'Prompt not found');
  return prompt;
};

export const deletePrompt = async (promptId) => {
  const deleted = await PromptRepository.deletePrompt(promptId);
  if (!deleted) throw new ApiError(404, 'Prompt not found');
};

export const listKnowledgeSources = () => KnowledgeRepository.findSources();

export const getKnowledgeSource = async (sourceId) => {
  const source = await KnowledgeRepository.findSourceById(sourceId);
  if (!source) throw new ApiError(404, 'Knowledge source not found');
  return source;
};

export const createKnowledgeSource = async (user, payload, file = null) => {
  const rawContent = file ? await extractUploadText(file) : (payload.rawContent || payload.raw_content || null);
  const source = await KnowledgeRepository.createSource({
    name: payload.name,
    source_type: normalizeSourceType(payload.sourceType || payload.source_type),
    status: 'processing',
    source_url: payload.sourceUrl || payload.source_url || null,
    raw_content: rawContent,
    item_count: 0,
    last_indexed_at: null,
    created_by: user.id,
    metadata: {
      ...(payload.metadata || {}),
      originalFileName: file?.originalname || null,
      mimeType: file?.mimetype || null,
    },
  });

  if (!rawContent) {
    return KnowledgeRepository.updateSource(source.id, {
      status: payload.status || 'active',
      last_indexed_at: new Date(),
    });
  }

  return indexSourceText({
    source,
    title: payload.title || payload.name,
    text: rawContent,
    metadata: {
      sourceType: source.source_type,
      sourceName: source.name,
      originalFileName: file?.originalname || null,
    },
  });
};

export const addKnowledgeDocument = async (sourceId, payload, file = null) => {
  const source = await KnowledgeRepository.findSourceById(sourceId);
  if (!source) throw new ApiError(404, 'Knowledge source not found');

  const text = file ? await extractUploadText(file) : (payload.text || payload.rawContent || payload.raw_content);
  if (!text) throw new ApiError(422, 'text or file is required');

  const updatedSource = await source.update({
    raw_content: [source.raw_content, text].filter(Boolean).join('\n\n'),
    status: 'processing',
    metadata: {
      ...(source.metadata || {}),
      lastUploadFileName: file?.originalname || null,
    },
  });

  return indexSourceText({
    source: updatedSource,
    title: payload.title || file?.originalname || source.name,
    text,
    metadata: {
      sourceType: source.source_type,
      sourceName: source.name,
      originalFileName: file?.originalname || null,
    },
  });
};

export const addFaq = async (user, payload) => {
  const source = await KnowledgeRepository.createSource({
    name: payload.sourceName || 'FAQ',
    source_type: 'faq',
    status: 'active',
    item_count: 1,
    last_indexed_at: new Date(),
    created_by: user.id,
    metadata: {
      category: payload.category || null,
    },
  });

  await KnowledgeRepository.createDocument({
    ai_knowledge_source_id: source.id,
    title: payload.question,
    chunk_text: `Question: ${payload.question}\nAnswer: ${payload.answer}`,
    chunk_hash: crypto.createHash('sha256').update(`${payload.question}:${payload.answer}`).digest('hex'),
    metadata: {
      type: 'faq',
      question: payload.question,
      answer: payload.answer,
      category: payload.category || null,
    },
  });

  return syncSourceItemCount(source.id);
};

export const deleteKnowledgeSource = async (sourceId) => {
  const deleted = await KnowledgeRepository.deleteSource(sourceId);
  if (!deleted) throw new ApiError(404, 'Knowledge source not found');
};

export default {
  generateAnswer,
  listPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  listKnowledgeSources,
  getKnowledgeSource,
  createKnowledgeSource,
  addKnowledgeDocument,
  addFaq,
  deleteKnowledgeSource,
};
