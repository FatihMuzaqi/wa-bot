import AiInteractionRepository from '../ai-chatbot/repositories/aiInteraction.repository.js';
import ConfidenceService from '../ai-chatbot/confidence.service.js';
import RagService from '../ai-chatbot/rag.service.js';
import BotExecutionRepository from './repositories/botExecution.repository.js';
import AIProviderService from './aiProvider.service.js';

const saveInteraction = (payload) => AiInteractionRepository.createInteraction(payload).catch(() => null);

const buildFallbackInstructions = (context) => `You are a helpful WhatsApp customer support assistant.
Answer in the same language as the user when reasonable.
Keep answers concise and suitable for WhatsApp.
Use the knowledge base context when it is relevant.
If the context is insufficient, set shouldFallback to true.

Knowledge base context:
${context}

Return valid JSON only:
{
  "answer": "short helpful answer",
  "confidence": 0.0,
  "shouldFallback": false,
  "fallbackReason": null,
  "sources": []
}`;

export const generateFallback = async ({ text, chat, inboundMessage = null }) => {
  const conversation = chat?.id
    ? await BotExecutionRepository.findRecentConversation({
      chatId: chat.id,
      excludeMessageId: inboundMessage?.id || null,
      limit: Number(process.env.AI_CONVERSATION_CONTEXT_LIMIT || 12),
    })
    : [];

  const provider = AIProviderService.getSelectedProvider();
  const hasProviderKey = (
    (provider === 'openai' && process.env.OPENAI_API_KEY) ||
    (provider === 'gemini' && process.env.GEMINI_API_KEY)
  );
  const contextChunks = await RagService.retrieveContext({ query: text, limit: 5 });
  const knowledgeContext = RagService.formatContext(contextChunks);
  const instructions = buildFallbackInstructions(knowledgeContext);

  if (provider !== 'placeholder' && hasProviderKey) {
    try {
      const input = [
        ...conversation.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        { role: 'user', content: text },
      ];

      const response = await AIProviderService.createResponse({
        instructions,
        input,
        temperature: Number(process.env.AI_FALLBACK_TEMPERATURE || 0.2),
      });
      const parsed = ConfidenceService.parseAiAnswer(response.outputText);
      console.log('[AiFallback] AI parse result:', {
        provider: response.provider,
        model: response.model,
        parsed,
      });

      const interaction = await saveInteraction({
        chat_id: chat?.id || null,
        message_id: inboundMessage?.id || null,
        ai_prompt_id: null,
        provider: response.provider,
        model: response.model,
        prompt_type: process.env.AI_BOT_PROMPT_TYPE || 'system',
        question: text,
        answer: parsed.answer,
        confidence: parsed.confidence,
        should_fallback: parsed.shouldFallback,
        fallback_reason: parsed.fallbackReason,
        conversation_context: conversation,
        knowledge_context: contextChunks,
        sources: parsed.sources,
        request_payload: {
          instructions,
          input,
          provider: response.provider,
          model: response.model,
        },
        response_payload: {
          requestId: response.requestId,
          rawOutput: response.rawOutput,
          knowledgeContext,
          parsed: {
            answer: parsed.answer,
            confidence: parsed.confidence,
            shouldFallback: parsed.shouldFallback,
            fallbackReason: parsed.fallbackReason,
          },
        },
        metadata: {
          status: 'success',
          source: 'bot_engine_ai_fallback',
        },
      });

      return {
        handled: !parsed.shouldFallback,
        confidence: parsed.confidence,
        text: parsed.answer,
        metadata: {
          provider: response.provider,
          requestId: response.requestId,
          sources: parsed.sources,
          knowledgeSources: contextChunks,
          fallbackReason: parsed.fallbackReason,
          chatId: chat?.id,
          aiInteractionId: interaction?.id || null,
          model: response.model,
        },
      };
    } catch (error) {
      const interaction = await saveInteraction({
        chat_id: chat?.id || null,
        message_id: inboundMessage?.id || null,
        provider,
        model: AIProviderService.getSelectedModel({ provider }),
        prompt_type: process.env.AI_BOT_PROMPT_TYPE || 'system',
        question: text,
        answer: null,
        confidence: 0,
        should_fallback: true,
        fallback_reason: `${provider}_error`,
        conversation_context: conversation,
        request_payload: {
          question: text,
          conversation,
          knowledgeContext,
        },
        response_payload: {
          error: error.message,
        },
        metadata: {
          status: 'failed',
          source: 'bot_engine_ai_fallback',
        },
      });

      return {
        handled: false,
        confidence: 0,
        text: process.env.AI_FALLBACK_ERROR_MESSAGE || 'A human agent will help you shortly.',
        metadata: {
          provider,
          error: error.message,
          fallbackReason: `${provider}_error`,
          chatId: chat?.id,
          aiInteractionId: interaction?.id || null,
        },
      };
    }
  }

  const placeholderConfidence = Number(process.env.AI_FALLBACK_CONFIDENCE || 0.5);
  const placeholderText = process.env.AI_FALLBACK_MESSAGE
    || "I'm checking that for you. A human agent will help if I cannot answer confidently.";
  const interaction = await saveInteraction({
    chat_id: chat?.id || null,
    message_id: inboundMessage?.id || null,
    provider: process.env.AI_PROVIDER || 'placeholder',
    model: null,
    prompt_type: process.env.AI_BOT_PROMPT_TYPE || 'system',
    question: text,
    answer: placeholderText,
    confidence: placeholderConfidence,
    should_fallback: true,
    fallback_reason: `${provider}_api_key_missing`,
    conversation_context: conversation,
    knowledge_context: contextChunks,
    request_payload: {
      question: text,
      conversation,
      knowledgeContext,
    },
    response_payload: {
      message: placeholderText,
    },
    metadata: {
      status: 'placeholder',
      source: 'bot_engine_ai_fallback',
    },
  });

  return {
    handled: false,
    confidence: placeholderConfidence,
    text: placeholderText,
    metadata: {
      provider: process.env.AI_PROVIDER || 'placeholder',
      input: text,
      chatId: chat?.id,
      aiInteractionId: interaction?.id || null,
      fallbackReason: `${provider}_api_key_missing`,
    },
  };
};

export default {
  generateFallback,
};
