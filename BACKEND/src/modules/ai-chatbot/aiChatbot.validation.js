import ApiError from '../../utils/ApiError.js';

const validate = (schema) => (req, _res, next) => {
  try {
    schema(req);
    next();
  } catch (error) {
    next(error);
  }
};

const requiredString = (value, field) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(422, `${field} is required`);
  }
};

const optionalString = (value, field) => {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw new ApiError(422, `${field} must be a string`);
  }
};

const requiredPositiveInteger = (value, field) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(422, `${field} must be a positive integer`);
  }
};

export const validateGenerateAnswer = validate(({ body }) => {
  requiredString(body.question, 'question');
  optionalString(body.promptType, 'promptType');
  if (body.conversation !== undefined && !Array.isArray(body.conversation)) {
    throw new ApiError(422, 'conversation must be an array');
  }
});

export const validateCreatePrompt = validate(({ body }) => {
  requiredString(body.name, 'name');
  requiredString(body.content, 'content');
  optionalString(body.prompt_type, 'prompt_type');
  optionalString(body.model, 'model');
});

export const validateUpdatePrompt = validate(({ params, body }) => {
  requiredPositiveInteger(params.promptId, 'promptId');
  optionalString(body.name, 'name');
  optionalString(body.content, 'content');
  optionalString(body.model, 'model');
});

export const validatePromptId = validate(({ params }) => {
  requiredPositiveInteger(params.promptId, 'promptId');
});

export const validateCreateKnowledgeSource = validate(({ body }) => {
  requiredString(body.name, 'name');
  const sourceType = body.sourceType || body.source_type;
  requiredString(sourceType, 'sourceType');

  if (!['document', 'faq', 'article', 'url', 'custom'].includes(sourceType)) {
    throw new ApiError(422, 'sourceType must be one of document, faq, article, url, custom');
  }

  if (!body.rawContent && !body.raw_content && !body.sourceUrl && !body.source_url) {
    return;
  }

  optionalString(body.rawContent, 'rawContent');
  optionalString(body.raw_content, 'raw_content');
});

export const validateKnowledgeSourceId = validate(({ params }) => {
  requiredPositiveInteger(params.sourceId, 'sourceId');
});

export const validateAddKnowledgeDocument = validate(({ params, body }) => {
  requiredPositiveInteger(params.sourceId, 'sourceId');
  if (!body.text && !body.rawContent && !body.raw_content) return;
  if (body.text !== undefined) requiredString(body.text, 'text');
  if (body.rawContent !== undefined) requiredString(body.rawContent, 'rawContent');
  if (body.raw_content !== undefined) requiredString(body.raw_content, 'raw_content');
  optionalString(body.title, 'title');
});

export const validateAddFaq = validate(({ body }) => {
  requiredString(body.question, 'question');
  requiredString(body.answer, 'answer');
  optionalString(body.sourceName, 'sourceName');
  optionalString(body.category, 'category');
});
