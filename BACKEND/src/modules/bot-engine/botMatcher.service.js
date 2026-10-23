import IntentClassifierService from './intentClassifier.service.js';

const normalize = (value) => String(value || '').trim().toLowerCase();

const splitKeywords = (triggerValue) => String(triggerValue || '')
  .split(',')
  .map((keyword) => keyword.trim())
  .filter(Boolean);

const matchKeyword = (rule, input) => {
  const normalizedInput = normalize(input);

  for (const keyword of splitKeywords(rule.trigger_value)) {
    const normalizedKeyword = normalize(keyword);
    if (!normalizedKeyword) continue;

    if (normalizedInput.includes(normalizedKeyword)) {
      return {
        matched: true,
        matchedText: keyword,
        matchType: 'keyword',
      };
    }
  }

  return { matched: false };
};

const matchRegex = (rule, input) => {
  try {
    const regex = new RegExp(rule.trigger_value, 'i');
    const match = String(input || '').match(regex);

    if (!match) return { matched: false };

    return {
      matched: true,
      matchedText: match[0],
      matchType: 'regex',
      groups: match.groups || null,
      captures: match.slice(1),
    };
  } catch (error) {
    return {
      matched: false,
      error: `Invalid regex for rule ${rule.id}: ${error.message}`,
    };
  }
};

export const matchRule = (rule, input) => {
  if (rule.trigger_type === 'keyword') return matchKeyword(rule, input);
  if (rule.trigger_type === 'regex') return matchRegex(rule, input);
  if (rule.trigger_type === 'intent') {
    return { matched: false, skipped: true, reason: 'Intent rules are classified in findFirstMatch' };
  }

  return { matched: false, skipped: true, reason: `Unsupported trigger type: ${rule.trigger_type}` };
};

export const findFirstMatch = (rules, input) => {
  const diagnostics = [];

  for (const rule of rules) {
    if (rule.trigger_type === 'intent') continue;
    const result = matchRule(rule, input);
    diagnostics.push({
      ruleId: rule.id,
      matched: result.matched,
      matchType: result.matchType || rule.trigger_type,
      error: result.error,
      skipped: result.skipped,
      reason: result.reason,
    });

    if (result.matched) {
      return {
        rule,
        match: result,
        diagnostics,
      };
    }
  }

  const intentRules = rules.filter((rule) => rule.trigger_type === 'intent');
  if (intentRules.length > 0) {
    const classified = IntentClassifierService.classifyIntent({ text: input, rules: intentRules });
    diagnostics.push(...classified.candidates.map((candidate) => ({
      ruleId: candidate.ruleId,
      matched: classified.matched && candidate.intent === classified.intent,
      matchType: 'intent',
      intent: candidate.intent,
      score: candidate.score,
    })));

    if (classified.matched && classified.rule) {
      return {
        rule: classified.rule,
        match: {
          matched: true,
          matchedText: classified.matchedText,
          matchType: 'intent',
          intent: classified.intent,
          confidence: classified.confidence,
        },
        diagnostics,
      };
    }
  }

  return {
    rule: null,
    match: null,
    diagnostics,
  };
};

export default {
  matchRule,
  findFirstMatch,
};
