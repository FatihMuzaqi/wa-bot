import openaiConfig from '../../config/openai.js';

const extractJsonObject = (value) => {
  const text = String(value || '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
};

export const parseAiAnswer = (outputText) => {
  const parsed = extractJsonObject(outputText);

  if (!parsed) {
    return {
      answer: outputText,
      confidence: 0.5,
      shouldFallback: true,
      fallbackReason: 'model_output_not_json',
      sources: [],
    };
  }

  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence ?? 0)));
  const shouldFallback = Boolean(parsed.shouldFallback)
    || confidence < openaiConfig.confidenceThreshold
    || !parsed.answer;

  return {
    answer: parsed.answer || '',
    confidence,
    shouldFallback,
    fallbackReason: parsed.fallbackReason || (shouldFallback ? 'low_confidence' : null),
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    raw: parsed,
  };
};

export default {
  parseAiAnswer,
};
