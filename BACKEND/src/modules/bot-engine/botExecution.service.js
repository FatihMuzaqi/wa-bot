import ApiError from "../../utils/ApiError.js";
import EvolutionService from "../../integrations/evolution/evolution.service.js";
import SocketService from "../../sockets/socket.service.js";
import { ROLES } from "../../constants/roles.js";
import openaiConfig from "../../config/openai.js";
import RagService from "../ai-chatbot/rag.service.js";
import BotRuleRepository from "./repositories/botRule.repository.js";
import BotExecutionRepository from "./repositories/botExecution.repository.js";
import BotMatcherService from "./botMatcher.service.js";
import AiFallbackService from "./aiFallback.service.js";
import AIProviderService from "./aiProvider.service.js";
import ConfidenceService from "../ai-chatbot/confidence.service.js";
import BotMenusService from "../bot-menus/botMenus.service.js";

const extractEvolutionMessageId = (response) =>
  response?.key?.id ||
  response?.message?.key?.id ||
  response?.data?.key?.id ||
  response?.id ||
  null;

const createOutboundMessage = async ({
  chat,
  senderType,
  text,
  metadata = {},
}) =>
  BotExecutionRepository.createMessage({
    chat_id: chat.id,
    contact_id: chat.contact_id,
    sender_type: senderType,
    direction: "outbound",
    message_type: "text",
    content: text,
    status: "queued",
    metadata,
  });

const sendOutboundText = async ({ chat, message, text, instanceName }) => {
  try {
    const response = await EvolutionService.sendText({
      instanceName,
      number: chat.contact.phone,
      text,
    });

    await BotExecutionRepository.updateMessage(message, {
      status: "sent",
      evolution_message_id: extractEvolutionMessageId(response),
      metadata: {
        ...(message.metadata || {}),
        evolutionResponse: response,
      },
    });

    const savedMessage = await BotExecutionRepository.findMessage(message.id);
    await BotExecutionRepository.updateChat(chat, {
      last_message_at: new Date(),
    });
    SocketService.emitMessageNew(chat.id, savedMessage);
    SocketService.emitChatUpdate(chat.id, { reason: "bot_message_sent" });

    return savedMessage;
  } catch (error) {
    await BotExecutionRepository.updateMessage(message, {
      status: "failed",
      error_message: error.message,
    });
    SocketService.emitMessageUpdate(chat.id, message);
    throw error;
  }
};

const parseResponsePayload = (payload) => {
  if (!payload) return {};
  if (typeof payload === "object") return payload;

  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
};

const executeTextResponse = async ({
  chat,
  rule,
  match,
  inboundMessage,
  instanceName,
}) => {
  console.log("[BotEngine] executeTextResponse called");
  const responsePayload = parseResponsePayload(rule.response_payload);
  const responseText = responsePayload.text || responsePayload.message;
  if (!responseText)
    throw new ApiError(422, `Bot rule ${rule.id} text response is empty`);

  const outboundMessage = await createOutboundMessage({
    chat,
    senderType: "bot",
    text: responseText,
    metadata: {
      source: "bot_engine",
      botRuleId: rule.id,
      match,
    },
  });

  const sentMessage = await sendOutboundText({
    chat,
    message: outboundMessage,
    text: responseText,
    instanceName,
  });

  await BotExecutionRepository.createLog({
    bot_rule_id: rule.id,
    chat_id: chat.id,
    message_id: inboundMessage?.id || null,
    matched_text: match?.matchedText || null,
    response_status: "sent",
    metadata: {
      responseType: rule.response_type,
      outboundMessageId: sentMessage.id,
    },
  });

  return {
    action: "text_response_sent",
    rule,
    message: sentMessage,
  };
};

const normalizeButtons = (buttons) => {
  if (!Array.isArray(buttons)) return [];
  return buttons
    .map((button) => ({
      label: String(button?.label || "").trim(),
      value: button?.value || null,
      action: String(button?.action || "text")
        .trim()
        .toLowerCase(),
      triggerValue: button?.triggerValue || button?.trigger_value || "",
      responseText: button?.responseText || button?.response_text || "",
      formId: button?.formId ?? button?.form_id ?? null,
    }))
    .filter((button) => button.label);
};

const buildButtonsText = ({ text, buttons }) =>
  [
    String(text || "").trim(),
    "",
    ...buttons.map((button, index) => `${index + 1}. ${button.label}`),
    "",
    "Balas dengan angka pilihan.",
  ].join("\n");

const getChatMetadata = (chat) => parseMetadata(chat.metadata);

const savePendingButtons = async ({ chat, rule, buttons, message }) => {
  const metadata = getChatMetadata(chat);
  await BotExecutionRepository.updateChat(chat, {
    metadata: {
      ...metadata,
      pending_button_rule_id: rule.id,
      pending_buttons: buttons,
      pending_button_message_id: message.id,
      pending_button_created_at: new Date().toISOString(),
    },
  });
  console.log("[BotEngine] pending buttons saved:", {
    chatId: chat.id,
    ruleId: rule.id,
    messageId: message.id,
    count: buttons.length,
  });
};

const clearPendingButtons = async (chat) => {
  const metadata = getChatMetadata(chat);
  const {
    pending_button_rule_id: _ruleId,
    pending_buttons: _buttons,
    pending_button_message_id: _messageId,
    pending_button_created_at: _createdAt,
    ...rest
  } = metadata;

  await BotExecutionRepository.updateChat(chat, { metadata: rest });
  console.log("[BotEngine] pending buttons cleared:", { chatId: chat.id });
};

const getPendingMenu = (chat) => {
  const pendingMenu = getChatMetadata(chat).pending_menu;
  if (!pendingMenu || !Array.isArray(pendingMenu.items) || pendingMenu.items.length === 0) {
    return null;
  }
  return pendingMenu;
};

const savePendingMenu = async ({ chat, menu, message }) => {
  const metadata = getChatMetadata(chat);
  const pendingMenu = BotMenusService.toPendingMenuState(menu);
  await BotExecutionRepository.updateChat(chat, {
    metadata: {
      ...metadata,
      pending_menu: {
        ...pendingMenu,
        pendingMessageId: message?.id || null,
      },
    },
  });
  console.log("[BotEngine] pending menu saved:", {
    chatId: chat.id,
    menuId: menu.id,
    messageId: message?.id || null,
    count: pendingMenu.items.length,
  });
};

const clearPendingMenu = async (chat) => {
  const metadata = getChatMetadata(chat);
  const { pending_menu: _pendingMenu, ...rest } = metadata;
  await BotExecutionRepository.updateChat(chat, { metadata: rest });
  console.log("[BotEngine] pending menu cleared:", { chatId: chat.id });
};

const executePlainBotText = async ({
  chat,
  text,
  inboundMessage,
  instanceName,
  metadata = {},
  logMetadata = {},
}) => {
  const outboundMessage = await createOutboundMessage({
    chat,
    senderType: "bot",
    text,
    metadata,
  });

  const sentMessage = await sendOutboundText({
    chat,
    message: outboundMessage,
    text,
    instanceName,
  });

  await BotExecutionRepository.createLog({
    bot_rule_id: metadata.botRuleId || null,
    chat_id: chat.id,
    message_id: inboundMessage?.id || null,
    matched_text: null,
    response_status: "sent",
    metadata: logMetadata,
  });

  return sentMessage;
};

const sendDefaultMenu = async ({
  chat,
  inboundMessage,
  instanceName,
  mode = "welcome",
  reason = "main_menu",
}) => {
  const menu = await BotMenusService.getDefaultMenu();
  if (!menu) return null;

  const text = BotMenusService.formatMenuText(menu, mode);
  const sentMessage = await executePlainBotText({
    chat,
    text,
    inboundMessage,
    instanceName,
    metadata: {
      source: "bot_engine_main_menu",
      menuId: menu.id,
      mode,
      reason,
    },
    logMetadata: {
      responseType: "main_menu",
      menuId: menu.id,
      mode,
      reason,
    },
  });

  await savePendingMenu({ chat, menu, message: sentMessage });

  return {
    action: mode === "unknown" ? "unknown_menu_sent" : "welcome_menu_sent",
    menu,
    message: sentMessage,
  };
};

const executeButtonsResponse = async ({
  chat,
  rule,
  match,
  inboundMessage,
  instanceName,
}) => {
  const payload = parseResponsePayload(rule.response_payload);
  const text = payload.text || payload.message;
  const buttons = normalizeButtons(payload.buttons);

  if (!text)
    throw new ApiError(422, `Bot rule ${rule.id} buttons text is required`);
  if (buttons.length === 0)
    throw new ApiError(422, `Bot rule ${rule.id} buttons are required`);

  console.log("[BotEngine] buttons response started:", {
    ruleId: rule.id,
    buttons: buttons.length,
  });

  const outboundText = buildButtonsText({ text, buttons });
  const outboundMessage = await createOutboundMessage({
    chat,
    senderType: "bot",
    text: outboundText,
    metadata: {
      source: "bot_engine_buttons",
      botRuleId: rule.id,
      buttons,
      match,
    },
  });

  const sentMessage = await sendOutboundText({
    chat,
    message: outboundMessage,
    text: outboundText,
    instanceName,
  });

  await savePendingButtons({ chat, rule, buttons, message: sentMessage });

  console.log("[BotEngine] buttons sent:", {
    ruleId: rule.id,
    messageId: sentMessage.id,
  });

  await BotExecutionRepository.createLog({
    bot_rule_id: rule.id,
    chat_id: chat.id,
    message_id: inboundMessage?.id || null,
    matched_text: match?.matchedText || null,
    response_status: "sent",
    metadata: {
      responseType: "buttons",
      outboundMessageId: sentMessage.id,
      buttons,
    },
  });

  return {
    action: "buttons_response_sent",
    rule,
    buttons,
    message: sentMessage,
  };
};

const normalizeStepOptions = (options) => {
  if (!options) return [];
  if (typeof options === "string") {
    try {
      return normalizeStepOptions(JSON.parse(options));
    } catch {
      return [];
    }
  }
  if (Array.isArray(options)) return options;
  if (Array.isArray(options.choices)) return options.choices;
  if (Array.isArray(options.options)) return options.options;
  return [];
};

const formatChoiceOption = (option) => {
  if (option === null || option === undefined) return "";
  if (typeof option === "string" || typeof option === "number") {
    return String(option);
  }
  return option.label || option.text || option.name || option.value || "";
};

const optionValue = (option) => {
  if (option === null || option === undefined) return null;
  if (typeof option === "string" || typeof option === "number")
    return String(option);
  return String(
    option.value ||
      option.id ||
      option.label ||
      option.text ||
      option.name ||
      "",
  );
};

const parseMetadata = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const buildFormQuestionText = (step) => {
  const question = String(step.question || "").trim();
  const options = normalizeStepOptions(step.options)
    .map(formatChoiceOption)
    .filter(Boolean);

  if (
    !["choice", "radio", "select"].includes(step.input_type) ||
    options.length === 0
  ) {
    return question;
  }

  return [
    question,
    ...options.map((option, index) => `${index + 1}. ${option}`),
  ].join("\n");
};

const resolveFormAnswer = ({ step, text }) => {
  const rawAnswer = String(text || "").trim();
  const options = normalizeStepOptions(step.options);

  if (!["choice", "radio", "select"].includes(step.input_type)) {
    return {
      answer: rawAnswer,
      answerJson: {
        raw: rawAnswer,
        inputType: step.input_type,
      },
    };
  }

  const selectedIndex = Number(rawAnswer);
  const selectedOption =
    Number.isInteger(selectedIndex) && selectedIndex >= 1
      ? options[selectedIndex - 1]
      : options.find((option) => {
          const label = formatChoiceOption(option).toLowerCase();
          const value = String(optionValue(option) || "").toLowerCase();
          return (
            label === rawAnswer.toLowerCase() ||
            value === rawAnswer.toLowerCase()
          );
        });

  const answer = selectedOption
    ? formatChoiceOption(selectedOption)
    : rawAnswer;

  return {
    answer,
    answerJson: {
      raw: rawAnswer,
      inputType: step.input_type,
      selectedIndex: selectedOption
        ? options.indexOf(selectedOption) + 1
        : null,
      selectedLabel: selectedOption ? formatChoiceOption(selectedOption) : null,
      selectedValue: selectedOption ? optionValue(selectedOption) : null,
    },
  };
};

const sendFormQuestion = async ({
  chat,
  form,
  submission,
  step,
  instanceName,
  reason,
  extraMetadata = {},
}) => {
  const questionText = buildFormQuestionText(step);
  const outboundMessage = await createOutboundMessage({
    chat,
    senderType: "bot",
    text: questionText,
    metadata: {
      source: "bot_engine_form",
      formId: form.id,
      formSubmissionId: submission.id,
      currentStepId: step.id,
      reason,
      ...extraMetadata,
    },
  });

  const sentMessage = await sendOutboundText({
    chat,
    message: outboundMessage,
    text: questionText,
    instanceName,
  });

  return sentMessage;
};

const logFailedFormResponse = ({ rule, chat, match, inboundMessage, reason }) =>
  BotExecutionRepository.createLog({
    bot_rule_id: rule?.id || null,
    chat_id: chat.id,
    message_id: inboundMessage?.id || null,
    matched_text: match?.matchedText || null,
    response_status: "failed",
    metadata: {
      responseType: "form",
      reason,
    },
  });

const executeFormResponse = async ({
  chat,
  rule,
  match,
  inboundMessage,
  instanceName,
}) => {
  if (!rule.form_id) {
    await logFailedFormResponse({
      rule,
      chat,
      match,
      inboundMessage,
      reason: "missing_form_id",
    });
    throw new ApiError(422, "Bot rule form_id is required for form response");
  }

  const form = await BotExecutionRepository.findActiveForm(rule.form_id);
  if (!form) {
    await logFailedFormResponse({
      rule,
      chat,
      match,
      inboundMessage,
      reason: "active_form_not_found",
    });
    throw new ApiError(422, "Selected form is not active or does not exist");
  }

  const firstStep = await BotExecutionRepository.findFirstFormStep(form.id);
  if (!firstStep) {
    await logFailedFormResponse({
      rule,
      chat,
      match,
      inboundMessage,
      reason: "form_has_no_steps",
    });
    throw new ApiError(422, "Form has no steps");
  }

  const submission = await BotExecutionRepository.createFormSubmission({
    form_id: form.id,
    chat_id: chat.id,
    contact_id: chat.contact_id,
    status: "in_progress",
    started_at: new Date(),
    metadata: {
      source: "bot_engine",
      botRuleId: rule.id,
      current_step_id: firstStep.id,
      current_step_order: firstStep.step_order,
    },
  });

  console.log("[BotEngine] form response started");
  console.log("[BotEngine] form id:", form.id);
  console.log("[BotEngine] submission id:", submission.id);
  console.log("[BotEngine] first step id:", firstStep.id);

  const sentMessage = await sendFormQuestion({
    chat,
    form,
    submission,
    step: firstStep,
    instanceName,
    reason: "form_started",
    extraMetadata: {
      botRuleId: rule.id,
      match,
    },
  });

  console.log("[BotEngine] first question sent:", {
    messageId: sentMessage.id,
    formId: form.id,
    submissionId: submission.id,
    firstStepId: firstStep.id,
  });

  await BotExecutionRepository.createLog({
    bot_rule_id: rule.id,
    chat_id: chat.id,
    message_id: inboundMessage?.id || null,
    matched_text: match?.matchedText || null,
    response_status: "sent",
    metadata: {
      responseType: "form",
      formId: form.id,
      formSubmissionId: submission.id,
      firstStepId: firstStep.id,
      outboundMessageId: sentMessage.id,
    },
  });

  return {
    action: "form_response_started",
    rule,
    form,
    submission,
    firstStep,
    message: sentMessage,
  };
};

const getPendingButtons = (chat) => {
  const metadata = getChatMetadata(chat);
  const buttons = Array.isArray(metadata.pending_buttons)
    ? metadata.pending_buttons
    : [];
  if (!buttons.length) return null;
  return {
    ruleId: metadata.pending_button_rule_id || null,
    messageId: metadata.pending_button_message_id || null,
    createdAt: metadata.pending_button_created_at || null,
    buttons,
  };
};

const sendInvalidButtonChoice = async ({
  chat,
  inboundMessage,
  instanceName,
}) => {
  const text = "Pilihan tidak valid. Silakan balas dengan angka yang tersedia.";
  const sentMessage = await executePlainBotText({
    chat,
    text,
    inboundMessage,
    instanceName,
    metadata: {
      source: "bot_engine_buttons",
      reason: "invalid_button_choice",
    },
    logMetadata: {
      responseType: "buttons_invalid_choice",
    },
  });

  return {
    action: "invalid_button_choice_sent",
    message: sentMessage,
  };
};

const executeSelectedButtonAction = async ({
  chat,
  selectedButton,
  inboundMessage,
  instanceName,
  buttonDepth = 0,
}) => {
  console.log("[BotEngine] selected button action:", selectedButton);
  await clearPendingButtons(chat);

  if (selectedButton.action === "text") {
    if (!selectedButton.responseText) {
      throw new ApiError(
        422,
        "Button responseText is required for text action",
      );
    }

    const sentMessage = await executePlainBotText({
      chat,
      text: selectedButton.responseText,
      inboundMessage,
      instanceName,
      metadata: {
        source: "bot_engine_buttons",
        buttonAction: "text",
        selectedButton,
      },
      logMetadata: {
        responseType: "button_text",
        selectedButton,
      },
    });

    return {
      action: "button_text_sent",
      selectedButton,
      message: sentMessage,
    };
  }

  if (selectedButton.action === "trigger") {
    if (!selectedButton.triggerValue) {
      throw new ApiError(
        422,
        "Button triggerValue is required for trigger action",
      );
    }
    if (buttonDepth >= 2)
      throw new ApiError(409, "Button trigger depth exceeded");

    return execute({
      chatId: chat.id,
      messageId: inboundMessage?.id || null,
      text: selectedButton.triggerValue,
      instanceName,
      skipPendingButtons: true,
      buttonDepth: buttonDepth + 1,
    });
  }

  if (selectedButton.action === "form") {
    const formId = Number(selectedButton.formId);
    if (!Number.isInteger(formId) || formId <= 0) {
      throw new ApiError(422, "Button formId is required for form action");
    }

    return executeFormResponse({
      chat,
      rule: {
        id: null,
        form_id: formId,
        response_type: "form",
      },
      match: null,
      inboundMessage,
      instanceName,
    });
  }

  if (selectedButton.action === "transfer") {
    return transferToHuman({
      chat,
      rule: null,
      match: null,
      inboundMessage,
      reason: "button_transfer",
    });
  }

  throw new ApiError(422, `Unsupported button action ${selectedButton.action}`);
};

const sendInvalidMenuChoice = async ({ chat, inboundMessage, instanceName }) => {
  const text = "Pilihan tidak valid. Silakan pilih angka yang tersedia.";
  const sentMessage = await executePlainBotText({
    chat,
    text,
    inboundMessage,
    instanceName,
    metadata: {
      source: "bot_engine_main_menu",
      reason: "invalid_menu_choice",
    },
    logMetadata: {
      responseType: "menu_invalid_choice",
    },
  });

  return {
    action: "invalid_menu_choice_sent",
    message: sentMessage,
  };
};

const normalizeMenuItemAction = (item) => ({
  itemId: item.itemId || item.id,
  number: String(item.number || ""),
  title: item.title,
  actionType: item.actionType || item.action_type,
  triggerValue: item.triggerValue || item.trigger_value || null,
  formId: item.formId || item.form_id || null,
  responseText: item.responseText || item.response_text || null,
});

const executeSelectedMenuItem = async ({
  chat,
  selectedItem,
  inboundMessage,
  inputText,
  instanceName,
  menuDepth = 0,
}) => {
  const item = normalizeMenuItemAction(selectedItem);
  console.log("[BotEngine] selected menu item:", item);
  await clearPendingMenu(chat);

  if (item.actionType === "text") {
    if (!item.responseText) throw new ApiError(422, "Menu item responseText is required");
    const sentMessage = await executePlainBotText({
      chat,
      text: item.responseText,
      inboundMessage,
      instanceName,
      metadata: {
        source: "bot_engine_main_menu",
        menuAction: "text",
        selectedItem: item,
      },
      logMetadata: {
        responseType: "menu_text",
        selectedItem: item,
      },
    });
    return { action: "menu_text_sent", selectedItem: item, message: sentMessage };
  }

  if (item.actionType === "trigger") {
    if (!item.triggerValue) throw new ApiError(422, "Menu item triggerValue is required");
    if (menuDepth >= 1) throw new ApiError(409, "Menu trigger depth exceeded");
    return execute({
      chatId: chat.id,
      messageId: inboundMessage?.id || null,
      text: item.triggerValue,
      instanceName,
      skipPendingButtons: true,
      skipPendingMenu: true,
      menuDepth: menuDepth + 1,
    });
  }

  if (item.actionType === "form") {
    const formId = Number(item.formId);
    if (!Number.isInteger(formId) || formId <= 0) throw new ApiError(422, "Menu item formId is required");
    return executeFormResponse({
      chat,
      rule: {
        id: null,
        form_id: formId,
        response_type: "form",
      },
      match: null,
      inboundMessage,
      instanceName,
    });
  }

  if (item.actionType === "transfer") {
    return transferToHuman({
      chat,
      rule: null,
      match: null,
      inboundMessage,
      reason: "menu_transfer",
    });
  }

  if (item.actionType === "ai") {
    const aiResult = await executeAiFallback({
      chat,
      text: item.responseText || inputText,
      inboundMessage,
      instanceName,
      fallbackToMenu: true,
    });
    return aiResult || sendDefaultMenu({
      chat,
      inboundMessage,
      instanceName,
      mode: "unknown",
      reason: "menu_ai_failed",
    });
  }

  throw new ApiError(422, `Unsupported menu action ${item.actionType}`);
};

const executePendingMenuSelection = async ({
  chat,
  pendingMenu,
  inboundMessage,
  inputText,
  instanceName,
  menuDepth = 0,
}) => {
  const rawText = String(inputText || "").trim();
  console.log("[BotEngine] menu selection received:", rawText);
  if (!/^\d+$/.test(rawText)) return null;

  const selectedItem = pendingMenu.items.find((item) => String(item.number) === rawText);
  if (!selectedItem) {
    return sendInvalidMenuChoice({ chat, inboundMessage, instanceName });
  }

  return executeSelectedMenuItem({
    chat,
    selectedItem,
    inboundMessage,
    inputText,
    instanceName,
    menuDepth,
  });
};

const executeDefaultMenuSelectionIfMatched = async ({
  chat,
  inboundMessage,
  inputText,
  instanceName,
  menuDepth = 0,
}) => {
  const rawText = String(inputText || "").trim();
  if (!/^\d+$/.test(rawText)) return null;

  const menu = await BotMenusService.getDefaultMenu();
  if (!menu) return null;

  const pendingMenu = BotMenusService.toPendingMenuState(menu);
  const selectedItem = pendingMenu.items.find((item) => String(item.number) === rawText);
  if (!selectedItem) return null;

  return executeSelectedMenuItem({
    chat,
    selectedItem,
    inboundMessage,
    inputText,
    instanceName,
    menuDepth,
  });
};

const executePendingButtonSelection = async ({
  chat,
  pendingButtons,
  inboundMessage,
  text,
  instanceName,
  buttonDepth,
}) => {
  const rawText = String(text || "").trim();
  console.log("[BotEngine] button selection received:", rawText);

  const selectedIndex = Number(rawText);
  if (!Number.isInteger(selectedIndex)) {
    return null;
  }

  const selectedButton = pendingButtons.buttons[selectedIndex - 1];
  if (!selectedButton) {
    return sendInvalidButtonChoice({ chat, inboundMessage, instanceName });
  }

  return executeSelectedButtonAction({
    chat,
    selectedButton,
    inboundMessage,
    instanceName,
    buttonDepth,
  });
};

const executeActiveFormSubmission = async ({
  chat,
  submission,
  inboundMessage,
  text,
  instanceName,
}) => {
  const metadata = parseMetadata(submission.metadata);
  const currentStepId = metadata.current_step_id || metadata.currentStepId;
  console.log("[BotEngine] active form submission detected:", submission.id);
  console.log("[BotEngine] current step id:", currentStepId || null);

  if (!currentStepId) {
    throw new ApiError(422, "Active form submission has no current step");
  }

  const currentStep = await BotExecutionRepository.findFormStep(currentStepId);
  if (!currentStep) throw new ApiError(404, "Current form step not found");

  const form =
    submission.form ||
    (await BotExecutionRepository.findActiveForm(submission.form_id));
  if (!form) throw new ApiError(422, "Active form is not available");

  const resolvedAnswer = resolveFormAnswer({ step: currentStep, text });
  const answer = await BotExecutionRepository.upsertFormAnswer({
    form_submission_id: submission.id,
    form_step_id: currentStep.id,
    answer: resolvedAnswer.answer,
    answer_json: {
      ...resolvedAnswer.answerJson,
      inboundMessageId: inboundMessage?.id || null,
    },
  });

  console.log("[BotEngine] answer saved:", {
    answerId: answer.id,
    submissionId: submission.id,
    stepId: currentStep.id,
    answer: resolvedAnswer.answer,
  });

  const nextStep = await BotExecutionRepository.findNextFormStep({
    formId: submission.form_id,
    currentOrder: currentStep.step_order,
  });

  console.log("[BotEngine] next step id:", nextStep?.id || null);

  if (nextStep) {
    await BotExecutionRepository.updateFormSubmission(submission, {
      metadata: {
        ...metadata,
        current_step_id: nextStep.id,
        current_step_order: nextStep.step_order,
        last_answered_step_id: currentStep.id,
        last_answered_at: new Date().toISOString(),
      },
    });

    const sentMessage = await sendFormQuestion({
      chat,
      form,
      submission,
      step: nextStep,
      instanceName,
      reason: "form_next_step",
    });

    console.log("[BotEngine] next question sent:", {
      messageId: sentMessage.id,
      submissionId: submission.id,
      nextStepId: nextStep.id,
    });

    await BotExecutionRepository.createLog({
      bot_rule_id: null,
      chat_id: chat.id,
      message_id: inboundMessage?.id || null,
      matched_text: null,
      response_status: "sent",
      metadata: {
        responseType: "form_continue",
        formId: form.id,
        formSubmissionId: submission.id,
        answeredStepId: currentStep.id,
        nextStepId: nextStep.id,
        outboundMessageId: sentMessage.id,
      },
    });

    return {
      action: "form_answer_saved_next_step_sent",
      form,
      submission,
      answer,
      currentStep,
      nextStep,
      message: sentMessage,
    };
  }

  await BotExecutionRepository.updateFormSubmission(submission, {
    status: "completed",
    completed_at: new Date(),
    metadata: {
      ...metadata,
      current_step_id: null,
      current_step_order: null,
      last_answered_step_id: currentStep.id,
      completed_at: new Date().toISOString(),
    },
  });

  const completionText = "Terima kasih, laporan Anda sudah berhasil dikirim.";
  const outboundMessage = await createOutboundMessage({
    chat,
    senderType: "bot",
    text: completionText,
    metadata: {
      source: "bot_engine_form",
      formId: form.id,
      formSubmissionId: submission.id,
      reason: "form_completed",
    },
  });

  const sentMessage = await sendOutboundText({
    chat,
    message: outboundMessage,
    text: completionText,
    instanceName,
  });

  console.log("[BotEngine] form completed:", {
    formId: form.id,
    submissionId: submission.id,
    messageId: sentMessage.id,
  });

  await BotExecutionRepository.createLog({
    bot_rule_id: null,
    chat_id: chat.id,
    message_id: inboundMessage?.id || null,
    matched_text: null,
    response_status: "sent",
    metadata: {
      responseType: "form_completed",
      formId: form.id,
      formSubmissionId: submission.id,
      answeredStepId: currentStep.id,
      outboundMessageId: sentMessage.id,
    },
  });

  return {
    action: "form_completed",
    form,
    submission,
    answer,
    currentStep,
    message: sentMessage,
  };
};

const transferToHuman = async ({
  chat,
  rule = null,
  match = null,
  inboundMessage = null,
  reason = "transfer_to_human",
}) => {
  await BotExecutionRepository.updateChat(chat, {
    status: "pending",
    ai_enabled: false,
    unread_count: chat.unread_count + 1,
  });

  await BotExecutionRepository.createLog({
    bot_rule_id: rule?.id || null,
    chat_id: chat.id,
    message_id: inboundMessage?.id || null,
    matched_text: match?.matchedText || null,
    response_status: "sent",
    metadata: {
      responseType: "transfer",
      reason,
    },
  });

  SocketService.emitChatUpdate(chat.id, { reason, status: "pending" });
  SocketService.emitToRole(ROLES.AGENT, "chat:update", {
    chatId: chat.id,
    reason,
    status: "pending",
  });

  return {
    action: "transferred_to_human",
    rule,
  };
};

const executeAiFallback = async ({
  chat,
  text,
  inboundMessage,
  instanceName,
  fallbackToMenu = false,
}) => {
  if (!chat.ai_enabled) {
    if (fallbackToMenu) return null;
    return transferToHuman({
      chat,
      inboundMessage,
      reason: "ai_disabled_transfer",
    });
  }

  const aiResponse = await AiFallbackService.generateFallback({
    text,
    chat,
    inboundMessage,
  });
  const confidenceThreshold = Number(
    process.env.BOT_AI_CONFIDENCE_THRESHOLD ||
      openaiConfig.confidenceThreshold ||
      0.65,
  );

  if (
    !aiResponse.handled ||
    Number(aiResponse.confidence || 0) < confidenceThreshold
  ) {
    const lowConfidenceAction = String(
      process.env.BOT_AI_LOW_CONFIDENCE_ACTION || "transfer",
    )
      .trim()
      .toLowerCase();

    if (lowConfidenceAction === "message" && aiResponse.text) {
      const sentFallback = await executePlainBotText({
        chat,
        text: aiResponse.text,
        inboundMessage,
        instanceName,
        metadata: {
          source: "bot_engine_ai_fallback",
          confidence: aiResponse.confidence,
          ai: aiResponse.metadata,
          fallback: true,
        },
        logMetadata: {
          responseType: "ai_fallback",
          confidence: aiResponse.confidence,
          fallback: true,
          fallbackReason:
            aiResponse.metadata?.fallbackReason || "low_confidence",
        },
      });

      return {
        action: "ai_fallback_message_sent",
        message: sentFallback,
        ai: aiResponse,
      };
    }

    if (fallbackToMenu) return null;

    return transferToHuman({
      chat,
      inboundMessage,
      reason: !aiResponse.handled
        ? "ai_unhandled_transfer"
        : "ai_low_confidence_transfer",
    });
  }

  const outboundMessage = await createOutboundMessage({
    chat,
    senderType: "ai",
    text: aiResponse.text,
    metadata: {
      source: "bot_engine_ai_fallback",
      confidence: aiResponse.confidence,
      ai: aiResponse.metadata,
    },
  });

  const sentMessage = await sendOutboundText({
    chat,
    message: outboundMessage,
    text: aiResponse.text,
    instanceName,
  });

  return {
    action: "ai_fallback_sent",
    message: sentMessage,
    ai: aiResponse,
  };
};

const executeAiResponse = async ({
  chat,
  rule,
  match,
  inboundMessage,
  text,
  instanceName,
}) => {
  const payload = parseResponsePayload(rule.response_payload);
  const fallbackText = payload.fallbackText || payload.fallback_text || null;

  try {
    const conversation = await BotExecutionRepository.findRecentConversation({
      chatId: chat.id,
      excludeMessageId: inboundMessage?.id || null,
      limit: Number(process.env.AI_CONVERSATION_CONTEXT_LIMIT || 12),
    });
    const contextChunks = await RagService.retrieveContext({
      query: text,
      limit: 5,
    });
    const knowledgeContext = RagService.formatContext(contextChunks);

    const instructions = `${payload.systemPrompt || "You are a helpful WhatsApp customer service assistant."}

${payload.instruction || ""}

Knowledge base context:
${knowledgeContext}

Rules:
- Use the knowledge base context when it is relevant.
- If the context is insufficient, set shouldFallback to true.

Return only valid JSON:
{
  "answer": "short helpful answer",
  "confidence": 0.0,
  "shouldFallback": false,
  "fallbackReason": null,
  "sources": []
}`;

    const input = [
      ...conversation.map((message) => ({
        role: message.role || "user",
        content: message.content,
      })),
      { role: "user", content: text },
    ];

    const response = await AIProviderService.createResponse({
      instructions,
      input,
      model: payload.model,
      temperature:
        payload.temperature === undefined ? 0.3 : Number(payload.temperature),
    });

    const parsed = ConfidenceService.parseAiAnswer(response.outputText);
    console.log("[BotEngine] AI parse result:", {
      provider: response.provider,
      model: response.model,
      parsed,
    });
    const confidenceThreshold = Number(
      payload.confidenceThreshold || openaiConfig.confidenceThreshold || 0.65,
    );

    if (
      parsed.shouldFallback ||
      Number(parsed.confidence || 0) < confidenceThreshold
    ) {
      if (!fallbackText) {
        return transferToHuman({
          chat,
          rule,
          match,
          inboundMessage,
          reason: "ai_rule_low_confidence_transfer",
        });
      }

      const sentFallback = await executePlainBotText({
        chat,
        text: fallbackText,
        inboundMessage,
        instanceName,
        metadata: {
          source: "bot_engine_ai_rule",
          botRuleId: rule.id,
          confidence: parsed.confidence,
          fallbackReason: parsed.fallbackReason || "low_confidence",
        },
        logMetadata: {
          responseType: "ai",
          botRuleId: rule.id,
          confidence: parsed.confidence,
          fallback: true,
        },
      });

      return {
        action: "ai_rule_fallback_sent",
        rule,
        message: sentFallback,
      };
    }

    const outboundMessage = await createOutboundMessage({
      chat,
      senderType: "ai",
      text: parsed.answer,
      metadata: {
        source: "bot_engine_ai_rule",
        botRuleId: rule.id,
        confidence: parsed.confidence,
        requestId: response.requestId,
        provider: response.provider,
        model: response.model,
        knowledgeSources: contextChunks,
        match,
      },
    });

    const sentMessage = await sendOutboundText({
      chat,
      message: outboundMessage,
      text: parsed.answer,
      instanceName,
    });

    await BotExecutionRepository.createLog({
      bot_rule_id: rule.id,
      chat_id: chat.id,
      message_id: inboundMessage?.id || null,
      matched_text: match?.matchedText || null,
      response_status: "sent",
      metadata: {
        responseType: "ai",
        confidence: parsed.confidence,
        requestId: response.requestId,
        provider: response.provider,
        model: response.model,
        knowledgeSources: contextChunks,
        outboundMessageId: sentMessage.id,
      },
    });

    return {
      action: "ai_rule_sent",
      rule,
      message: sentMessage,
      ai: parsed,
    };
  } catch (error) {
    if (fallbackText) {
      const sentFallback = await executePlainBotText({
        chat,
        text: fallbackText,
        inboundMessage,
        instanceName,
        metadata: {
          source: "bot_engine_ai_rule",
          botRuleId: rule.id,
          error: error.message,
        },
        logMetadata: {
          responseType: "ai",
          botRuleId: rule.id,
          fallback: true,
          error: error.message,
        },
      });

      return {
        action: "ai_rule_error_fallback_sent",
        rule,
        message: sentFallback,
      };
    }

    return transferToHuman({
      chat,
      rule,
      match,
      inboundMessage,
      reason: "ai_rule_error_transfer",
    });
  }
};

export const execute = async ({
  chatId,
  messageId = null,
  text,
  instanceName = null,
  skipPendingButtons = false,
  skipPendingMenu = false,
  buttonDepth = 0,
  menuDepth = 0,
}) => {
  const chat = await BotExecutionRepository.findChatContext(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");
  if (!chat.contact?.phone)
    throw new ApiError(422, "Chat contact phone number is missing");

  if (chat.status === "closed") {
    return {
      action: "skipped",
      reason: `chat_status_${chat.status}`,
    };
  }

  const inboundMessage = messageId
    ? await BotExecutionRepository.findMessage(messageId)
    : null;
  const inputText = text || inboundMessage?.content;
  if (!inputText)
    throw new ApiError(422, "Text or messageId with content is required");

  const activeSubmission =
    await BotExecutionRepository.findActiveFormSubmission(chat.id);
  if (activeSubmission) {
    console.log("[BotEngine] hybrid flow: active form submission");
    return executeActiveFormSubmission({
      chat,
      submission: activeSubmission,
      inboundMessage,
      text: inputText,
      instanceName,
    });
  }

  let preMatchedResult = null;
  const pendingMenu = !skipPendingMenu ? getPendingMenu(chat) : null;
  if (pendingMenu) {
    console.log("[BotEngine] hybrid flow: pending menu selection");
    const pendingMenuResult = await executePendingMenuSelection({
      chat,
      pendingMenu,
      inboundMessage,
      inputText,
      instanceName,
      menuDepth,
    });
    if (pendingMenuResult) return pendingMenuResult;
  }

  const pendingButtons = !skipPendingButtons ? getPendingButtons(chat) : null;
  if (pendingButtons) {
    console.log("[BotEngine] hybrid flow: pending button selection");
    const pendingSelectionResult = await executePendingButtonSelection({
      chat,
      pendingButtons,
      inboundMessage,
      text: inputText,
      instanceName,
      buttonDepth,
    });

    if (pendingSelectionResult) return pendingSelectionResult;

    const rulesForPendingText = await BotRuleRepository.findActiveRules();
    preMatchedResult = BotMatcherService.findFirstMatch(
      rulesForPendingText,
      inputText,
    );
    if (!preMatchedResult.rule) {
      return sendInvalidButtonChoice({ chat, inboundMessage, instanceName });
    }
  }

  if (!skipPendingMenu) {
    const defaultMenuSelection = await executeDefaultMenuSelectionIfMatched({
      chat,
      inboundMessage,
      inputText,
      instanceName,
      menuDepth,
    });
    if (defaultMenuSelection) return defaultMenuSelection;
  }

  if (chat.status === "open" && (chat.assigned_agent_id || !chat.ai_enabled)) {
    return {
      action: "skipped",
      reason: "chat_open_for_human_agent",
    };
  }

  console.log("[BotEngine] hybrid flow: bot rule matching");
  const rules = preMatchedResult
    ? null
    : await BotRuleRepository.findActiveRules();
  const result =
    preMatchedResult || BotMatcherService.findFirstMatch(rules, inputText);

  if (!result.rule) {
    console.log("[BotEngine] executeAiFallback called:", {
      chatId: chat.id,
      status: chat.status,
      aiEnabled: chat.ai_enabled,
      text,
    });
    const aiResult = await executeAiFallback({
      chat,
      text: inputText,
      inboundMessage,
      instanceName,
      fallbackToMenu: true,
    });
    if (aiResult) return aiResult;

    const menuResult = await sendDefaultMenu({
      chat,
      inboundMessage,
      instanceName,
      mode: "unknown",
      reason: "ai_fallback_failed",
    });
    if (menuResult) return menuResult;

    return transferToHuman({
      chat,
      inboundMessage,
      reason: "ai_fallback_failed_no_menu",
    });
  }

  await BotExecutionRepository.createLog({
    bot_rule_id: result.rule.id,
    chat_id: chat.id,
    message_id: inboundMessage?.id || null,
    matched_text: result.match.matchedText || null,
    response_status: "matched",
    metadata: {
      matchType: result.match.matchType,
      diagnostics: result.diagnostics,
    },
  });

  const responseType = String(result.rule.response_type || "")
    .trim()
    .toLowerCase();

  console.log("[BotEngine] matched rule:", {
    ruleId: result.rule.id,
    responseType,
    responsePayload: result.rule.response_payload,
  });

  if (responseType === "transfer") {
    return transferToHuman({
      chat,
      rule: result.rule,
      match: result.match,
      inboundMessage,
      reason: "bot_rule_transfer",
    });
  }

  if (responseType === "ai") {
    return executeAiResponse({
      chat,
      rule: result.rule,
      match: result.match,
      text: inputText,
      inboundMessage,
      instanceName,
    });
  }

  if (responseType === "text") {
    return executeTextResponse({
      chat,
      rule: result.rule,
      match: result.match,
      inboundMessage,
      instanceName,
    });
  }

  if (responseType === "buttons") {
    return executeButtonsResponse({
      chat,
      rule: result.rule,
      match: result.match,
      inboundMessage,
      instanceName,
    });
  }

  if (responseType === "form") {
    return executeFormResponse({
      chat,
      rule: result.rule,
      match: result.match,
      inboundMessage,
      instanceName,
    });
  }

  return transferToHuman({
    chat,
    rule: result.rule,
    match: result.match,
    inboundMessage,
    reason: `unsupported_response_type_${responseType}`,
  });
};

export const testMatch = async ({ text }) => {
  const rules = await BotRuleRepository.findActiveRules();
  return BotMatcherService.findFirstMatch(rules, text);
};

export default {
  execute,
  testMatch,
};
