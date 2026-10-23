const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const words = (value) => normalizeText(value)
  .split(' ')
  .filter((word) => word.length >= 2);

const parseIntentTrigger = (triggerValue) => {
  if (!triggerValue) return { intent: '', examples: [] };
  if (typeof triggerValue === 'object') {
    return {
      intent: triggerValue.intent || '',
      examples: Array.isArray(triggerValue.examples) ? triggerValue.examples : [],
    };
  }

  try {
    const parsed = JSON.parse(triggerValue);
    return {
      intent: parsed.intent || '',
      examples: Array.isArray(parsed.examples) ? parsed.examples : [],
    };
  } catch {
    return {
      intent: String(triggerValue || '').trim(),
      examples: [],
    };
  }
};

const overlapScore = (input, example) => {
  const inputWords = new Set(words(input));
  const exampleWords = new Set(words(example));
  if (inputWords.size === 0 || exampleWords.size === 0) return 0;

  const intersection = [...exampleWords].filter((word) => inputWords.has(word)).length;
  return intersection / Math.max(exampleWords.size, 1);
};

export const classifyIntent = ({ text, rules, threshold = Number(process.env.BOT_INTENT_THRESHOLD || 0.45) }) => {
  const candidates = rules.map((rule) => {
    const parsed = parseIntentTrigger(rule.trigger_value);
    const scores = parsed.examples.map((example) => overlapScore(text, example));
    const score = scores.length ? Math.max(...scores) : 0;
    return {
      rule,
      intent: parsed.intent,
      examples: parsed.examples,
      score,
    };
  });

  const selected = candidates
    .filter((candidate) => candidate.intent)
    .sort((a, b) => b.score - a.score)[0] || null;

  const result = {
    matched: Boolean(selected && selected.score >= threshold),
    intent: selected?.intent || null,
    confidence: selected?.score || 0,
    matchedText: selected?.intent || null,
    rule: selected?.rule || null,
    candidates: candidates.map((candidate) => ({
      ruleId: candidate.rule.id,
      intent: candidate.intent,
      score: Number(candidate.score.toFixed(4)),
      examples: candidate.examples.length,
    })),
  };

  console.log('[IntentClassifier] input text:', text);
  console.log('[IntentClassifier] candidate intents:', result.candidates);
  console.log('[IntentClassifier] selected intent:', result.intent);
  console.log('[IntentClassifier] confidence:', result.confidence);

  return result;
};

export default {
  classifyIntent,
};
