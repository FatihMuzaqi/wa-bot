import { Op } from 'sequelize';
import axios from 'axios';
import { sequelize } from '../../database/models/index.js';
import models from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';

const { Chat, Contact, Form, FormAnswer, FormStep, FormSubmission } = models;

const pagination = ({ rows, count }, page, limit) => ({
  rows,
  pagination: {
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
  },
});

const stepPayload = (payload) => ({
  ...(payload.question !== undefined && { question: payload.question }),
  ...((payload.inputType || payload.input_type) && { input_type: payload.inputType || payload.input_type }),
  ...(payload.options !== undefined && { options: payload.options }),
  ...((payload.validationRules ?? payload.validation_rules) !== undefined && {
    validation_rules: payload.validationRules ?? payload.validation_rules,
  }),
  ...(payload.stepOrder !== undefined && { step_order: Number(payload.stepOrder) }),
  ...(payload.step_order !== undefined && { step_order: Number(payload.step_order) }),
  ...(payload.isRequired !== undefined && { is_required: Boolean(payload.isRequired) }),
  ...(payload.is_required !== undefined && { is_required: Boolean(payload.is_required) }),
});

const submissionIncludes = ({ answers = false, search = '' } = {}) => [
  {
    model: Form,
    as: 'form',
    attributes: ['id', 'name', 'description', 'status'],
  },
  {
    model: Contact,
    as: 'contact',
    attributes: ['id', 'name', 'phone', 'email', 'company'],
    ...(search && {
      required: true,
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      },
    }),
  },
  { model: Chat, as: 'chat', attributes: ['id', 'status', 'assigned_agent_id'] },
  {
    model: FormAnswer,
    as: 'answers',
    attributes: answers ? undefined : ['id'],
    ...(answers && {
      include: [{
        model: FormStep,
        as: 'step',
        attributes: ['id', 'step_order', 'question', 'input_type'],
      }],
    }),
  },
];

const submissionWhere = (query = {}) => {
  const where = {};
  if (query.formId || query.form_id) where.form_id = Number(query.formId || query.form_id);
  if (query.status) where.status = query.status;
  if (query.operationalStatus || query.operational_status) {
    where.operational_status = query.operationalStatus || query.operational_status;
  }

  const from = query.dateFrom || query.date_from;
  const to = query.dateTo || query.date_to;
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = new Date(`${from}T00:00:00`);
    if (to) where.created_at[Op.lte] = new Date(`${to}T23:59:59.999`);
  }
  return where;
};

const findSubmission = async (submissionId) => {
  const submission = await FormSubmission.findByPk(submissionId, {
    include: submissionIncludes({ answers: true }),
    order: [[{ model: FormAnswer, as: 'answers' }, { model: FormStep, as: 'step' }, 'step_order', 'ASC']],
  });
  if (!submission) throw new ApiError(404, 'Form submission not found');
  return submission;
};

const csvValue = (value) => {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const webhookPayload = (submission) => {
  const plain = submission.get({ plain: true });
  return {
    event: 'form.submission.forwarded',
    sentAt: new Date().toISOString(),
    submission: {
      id: plain.id,
      status: plain.status,
      operationalStatus: plain.operational_status,
      notes: plain.notes,
      startedAt: plain.started_at,
      completedAt: plain.completed_at,
      form: plain.form,
      contact: plain.contact,
      chat: plain.chat,
      answers: (plain.answers || []).map((answer) => ({
        id: answer.id,
        question: answer.step?.question,
        inputType: answer.step?.input_type,
        answer: answer.answer,
        answerData: answer.answer_json,
      })),
    },
  };
};

export const list = async (query = {}) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const where = {};

  if (query.status) where.status = query.status;
  if (query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query.search}%` } },
      { description: { [Op.like]: `%${query.search}%` } },
    ];
  }

  const result = await Form.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    distinct: true,
    include: [
      { model: FormStep, as: 'steps', separate: true, order: [['step_order', 'ASC'], ['id', 'ASC']] },
      { model: FormSubmission, as: 'submissions', attributes: ['id', 'status', 'created_at'] },
    ],
  });

  return pagination(result, page, limit);
};

export const detail = async (formId) => {
  const form = await Form.findByPk(formId, {
    include: [
      { model: FormStep, as: 'steps', separate: true, order: [['step_order', 'ASC'], ['id', 'ASC']] },
      { model: FormSubmission, as: 'submissions', attributes: ['id', 'status', 'created_at'] },
    ],
  });
  if (!form) throw new ApiError(404, 'Form not found');
  return form;
};

export const listSubmissions = async (query = {}) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const search = String(query.search || '').trim();
  const result = await FormSubmission.findAndCountAll({
    where: submissionWhere(query),
    include: submissionIncludes({ search }),
    limit,
    offset: (page - 1) * limit,
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    distinct: true,
  });
  return pagination(result, page, limit);
};

export const submissionDetail = (submissionId) => findSubmission(submissionId);

export const updateSubmission = async (submissionId, payload) => {
  const submission = await FormSubmission.findByPk(submissionId);
  if (!submission) throw new ApiError(404, 'Form submission not found');
  await submission.update({
    ...(payload.operationalStatus !== undefined && { operational_status: payload.operationalStatus }),
    ...(payload.operational_status !== undefined && { operational_status: payload.operational_status }),
    ...(payload.notes !== undefined && { notes: payload.notes?.trim() || null }),
  });
  return findSubmission(submission.id);
};

export const exportSubmissions = async (query = {}) => {
  const search = String(query.search || '').trim();
  const submissions = await FormSubmission.findAll({
    where: submissionWhere(query),
    include: submissionIncludes({ answers: true, search }),
    order: [['created_at', 'DESC'], ['id', 'DESC']],
  });
  const questionNames = [...new Set(submissions.flatMap((submission) => (
    submission.answers || []
  ).map((answer) => answer.step?.question).filter(Boolean)))];
  const headers = [
    'Submission ID', 'Form', 'Contact', 'Phone', 'Email', 'Submission Status',
    'Operational Status', 'Started At', 'Completed At', 'Forward Status', 'Notes',
    ...questionNames,
  ];
  const rows = submissions.map((submission) => {
    const answerMap = new Map((submission.answers || []).map((answer) => [answer.step?.question, answer.answer]));
    return [
      submission.id,
      submission.form?.name,
      submission.contact?.name,
      submission.contact?.phone,
      submission.contact?.email,
      submission.status,
      submission.operational_status,
      submission.started_at?.toISOString?.() || submission.started_at,
      submission.completed_at?.toISOString?.() || submission.completed_at,
      submission.forward_status,
      submission.notes,
      ...questionNames.map((question) => answerMap.get(question)),
    ];
  });
  return {
    filename: `form-submissions-${new Date().toISOString().slice(0, 10)}.csv`,
    content: [headers, ...rows].map((row) => row.map(csvValue).join(',')).join('\r\n'),
  };
};

export const forwardSubmission = async (submissionId) => {
  const webhookUrl = String(process.env.FORM_SUBMISSION_WEBHOOK_URL || '').trim();
  if (!webhookUrl) {
    throw new ApiError(422, 'FORM_SUBMISSION_WEBHOOK_URL is not configured');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(webhookUrl);
  } catch {
    throw new ApiError(500, 'FORM_SUBMISSION_WEBHOOK_URL is invalid');
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new ApiError(500, 'Form submission webhook must use HTTP or HTTPS');
  }

  const submission = await findSubmission(submissionId);
  await submission.update({ forward_status: 'pending', forward_error: null });

  try {
    const token = String(process.env.FORM_SUBMISSION_WEBHOOK_TOKEN || '').trim();
    const response = await axios.post(webhookUrl, webhookPayload(submission), {
      timeout: Number(process.env.FORM_SUBMISSION_WEBHOOK_TIMEOUT_MS || 15000),
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    await submission.update({
      forward_status: 'sent',
      forwarded_at: new Date(),
      forward_error: null,
    });
    return { submission: await findSubmission(submission.id), destinationStatus: response.status };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Webhook forwarding failed';
    await submission.update({ forward_status: 'failed', forward_error: String(message).slice(0, 2000) });
    throw new ApiError(502, 'Failed to forward form submission', {
      destinationStatus: error.response?.status || null,
      reason: message,
    });
  }
};

export const create = (user, payload) => Form.create({
  name: payload.name,
  description: payload.description || null,
  status: payload.status || 'draft',
  created_by: user.id,
});

export const update = async (formId, payload) => {
  const form = await detail(formId);
  await form.update({
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.description !== undefined && { description: payload.description || null }),
    ...(payload.status !== undefined && { status: payload.status }),
  });
  return detail(form.id);
};

export const remove = async (formId) => {
  const form = await detail(formId);
  await sequelize.transaction(async (transaction) => {
    await FormStep.destroy({ where: { form_id: form.id }, transaction });
    await form.destroy({ transaction });
  });
  return { id: form.id };
};

export const createStep = async (formId, payload) => {
  await detail(formId);
  const maxOrder = await FormStep.max('step_order', { where: { form_id: formId } });
  const step = await FormStep.create({
    form_id: formId,
    step_order: payload.stepOrder ?? payload.step_order ?? Number(maxOrder || 0) + 1,
    question: payload.question,
    input_type: payload.inputType || payload.input_type || 'text',
    options: payload.options || null,
    validation_rules: payload.validationRules || payload.validation_rules || null,
    is_required: payload.isRequired ?? payload.is_required ?? false,
  });
  return step;
};

export const updateStep = async (formId, stepId, payload) => {
  await detail(formId);
  const step = await FormStep.findOne({ where: { id: stepId, form_id: formId } });
  if (!step) throw new ApiError(404, 'Form step not found');
  await step.update(stepPayload(payload));
  return step.reload();
};

export const deleteStep = async (formId, stepId) => {
  await detail(formId);
  const step = await FormStep.findOne({ where: { id: stepId, form_id: formId } });
  if (!step) throw new ApiError(404, 'Form step not found');
  await step.destroy();

  const steps = await FormStep.findAll({
    where: { form_id: formId },
    order: [['step_order', 'ASC'], ['id', 'ASC']],
  });
  await sequelize.transaction(async (transaction) => {
    await Promise.all(steps.map((item, index) => item.update({ step_order: index + 1 }, { transaction })));
  });

  return { id: Number(stepId) };
};

export const reorderSteps = async (formId, payload) => {
  await detail(formId);
  const requested = payload.steps || payload.stepIds;
  const ids = requested.map((item) => Number(typeof item === 'object' ? item.id : item));
  const uniqueIds = [...new Set(ids)];

  const steps = await FormStep.findAll({ where: { form_id: formId, id: { [Op.in]: uniqueIds } } });
  if (steps.length !== uniqueIds.length) throw new ApiError(422, 'One or more steps do not belong to this form');

  const byId = new Map(steps.map((step) => [Number(step.id), step]));
  await sequelize.transaction(async (transaction) => {
    await Promise.all(steps.map((step, index) => step.update({ step_order: 100000 + index }, { transaction })));
    await Promise.all(uniqueIds.map((id, index) => byId.get(id).update({ step_order: index + 1 }, { transaction })));
  });

  return detail(formId);
};

export default {
  list,
  detail,
  listSubmissions,
  submissionDetail,
  updateSubmission,
  exportSubmissions,
  forwardSubmission,
  create,
  update,
  remove,
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
};
