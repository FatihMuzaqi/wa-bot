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

const positiveInteger = (value, field) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(422, `${field} must be a positive integer`);
  }
};

const optionalObject = (value, field) => {
  if (value !== undefined && value !== null && (typeof value !== 'object' || Array.isArray(value))) {
    throw new ApiError(422, `${field} must be an object`);
  }
};

const optionalJson = (value, field) => {
  if (value !== undefined && value !== null && typeof value !== 'object') {
    throw new ApiError(422, `${field} must be valid JSON`);
  }
};

const validateStatus = (status) => {
  if (status !== undefined && !['draft', 'active', 'inactive'].includes(status)) {
    throw new ApiError(422, 'status must be one of draft, active, inactive');
  }
};

const validateInputType = (inputType) => {
  if (inputType !== undefined && !['text', 'email', 'number', 'choice', 'date', 'file'].includes(inputType)) {
    throw new ApiError(422, 'inputType must be one of text, email, number, choice, date, file');
  }
};

export const validateFormId = validate(({ params }) => {
  positiveInteger(params.formId, 'formId');
});

export const validateSubmissionId = validate(({ params }) => {
  positiveInteger(params.submissionId, 'submissionId');
});

export const validateSubmissionList = validate(({ query }) => {
  if (query.page !== undefined) positiveInteger(query.page, 'page');
  if (query.limit !== undefined) positiveInteger(query.limit, 'limit');
  if (query.formId !== undefined) positiveInteger(query.formId, 'formId');
  if (query.status !== undefined && !['in_progress', 'completed', 'abandoned'].includes(query.status)) {
    throw new ApiError(422, 'status must be one of in_progress, completed, abandoned');
  }
  const operationalStatus = query.operationalStatus || query.operational_status;
  if (operationalStatus !== undefined && !['new', 'in_review', 'resolved'].includes(operationalStatus)) {
    throw new ApiError(422, 'operationalStatus must be one of new, in_review, resolved');
  }
});

export const validateUpdateSubmission = validate(({ params, body }) => {
  positiveInteger(params.submissionId, 'submissionId');
  const operationalStatus = body.operationalStatus || body.operational_status;
  if (operationalStatus !== undefined && !['new', 'in_review', 'resolved'].includes(operationalStatus)) {
    throw new ApiError(422, 'operationalStatus must be one of new, in_review, resolved');
  }
  optionalString(body.notes, 'notes');
  if (body.notes?.length > 10000) throw new ApiError(422, 'notes must not exceed 10000 characters');
  if (operationalStatus === undefined && body.notes === undefined) {
    throw new ApiError(422, 'operationalStatus or notes is required');
  }
});

export const validateCreateForm = validate(({ body }) => {
  requiredString(body.name, 'name');
  optionalString(body.description, 'description');
  validateStatus(body.status);
});

export const validateUpdateForm = validate(({ params, body }) => {
  positiveInteger(params.formId, 'formId');
  optionalString(body.name, 'name');
  optionalString(body.description, 'description');
  validateStatus(body.status);
});

export const validateCreateStep = validate(({ params, body }) => {
  positiveInteger(params.formId, 'formId');
  requiredString(body.question, 'question');
  validateInputType(body.inputType || body.input_type);
  optionalJson(body.options, 'options');
  optionalObject(body.validationRules || body.validation_rules, 'validationRules');
});

export const validateUpdateStep = validate(({ params, body }) => {
  positiveInteger(params.formId, 'formId');
  positiveInteger(params.stepId, 'stepId');
  optionalString(body.question, 'question');
  validateInputType(body.inputType || body.input_type);
  optionalJson(body.options, 'options');
  optionalObject(body.validationRules || body.validation_rules, 'validationRules');
});

export const validateDeleteStep = validate(({ params }) => {
  positiveInteger(params.formId, 'formId');
  positiveInteger(params.stepId, 'stepId');
});

export const validateReorderSteps = validate(({ params, body }) => {
  positiveInteger(params.formId, 'formId');
  const steps = body.steps || body.stepIds;
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new ApiError(422, 'steps must be a non-empty array');
  }
});
