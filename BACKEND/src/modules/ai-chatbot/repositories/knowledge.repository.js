import { Op } from 'sequelize';
import models from '../../../database/models/index.js';

const { AiKnowledgeSource, AiDocument } = models;

export const findSources = () => AiKnowledgeSource.findAll({
  order: [['updated_at', 'DESC']],
});

export const findSourceById = (sourceId) => AiKnowledgeSource.findByPk(sourceId, {
  include: [{ model: AiDocument, as: 'documents' }],
});

export const createSource = (payload) => AiKnowledgeSource.create(payload);

export const updateSource = async (sourceId, payload) => {
  const source = await AiKnowledgeSource.findByPk(sourceId);
  if (!source) return null;
  return source.update(payload);
};

export const createDocument = (payload) => AiDocument.create(payload);

export const bulkCreateDocuments = (payloads) => AiDocument.bulkCreate(payloads, {
  ignoreDuplicates: true,
});

export const countDocumentsBySource = (sourceId) => AiDocument.count({
  where: { ai_knowledge_source_id: sourceId },
});

export const deleteSource = async (sourceId) => {
  const source = await AiKnowledgeSource.findByPk(sourceId);
  if (!source) return false;
  await source.destroy();
  return true;
};

export const findRelevantDocuments = async ({ query, limit = 5 }) => {
  const words = String(query || '')
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length >= 3)
    .slice(0, 8);

  if (words.length === 0) {
    return AiDocument.findAll({
      include: [{ model: AiKnowledgeSource, as: 'knowledgeSource', where: { status: 'active' } }],
      order: [['updated_at', 'DESC']],
      limit,
    });
  }

  return AiDocument.findAll({
    where: {
      [Op.or]: words.map((word) => ({
        chunk_text: { [Op.like]: `%${word}%` },
      })),
    },
    include: [{ model: AiKnowledgeSource, as: 'knowledgeSource', where: { status: 'active' } }],
    order: [['updated_at', 'DESC']],
    limit: Math.max(limit * 4, limit),
  });
};

export default {
  findSources,
  findSourceById,
  createSource,
  updateSource,
  createDocument,
  bulkCreateDocuments,
  countDocumentsBySource,
  deleteSource,
  findRelevantDocuments,
};
