// For handling of synchronous chats that are not utilizing streaming or chat requests.
import { EVENTS } from "../constants";
import { dispatchAttributeEvent } from "../events";

export default function handleChat(
  chatResult,
  setLoadingResponse,
  setChatHistory,
  remHistory,
  _chatHistory,
  settings
) {
  const {
    uuid,
    textResponse,
    type,
    sources = [],
    error,
    close,
    errorMsg = null,
  } = chatResult;

  // Create event detail object
  const eventDetail = {
    originalChatResult: chatResult,
    modifiedChatResult: { ...chatResult }
  };

  // Try attribute-based event dispatch first
  dispatchAttributeEvent(settings, "chatResponseReceived", eventDetail);

  // Legacy event listener approach (for backward compatibility)
  const receivedEvent = new CustomEvent(EVENTS.CHAT_RESPONSE_RECEIVED, {
    detail: eventDetail
  });
  window.dispatchEvent(receivedEvent);

  // Use modified response if provided
  const modifiedResult = eventDetail.modifiedChatResult || chatResult;
  const {
    uuid: modUuid = uuid,
    textResponse: modTextResponse = textResponse,
    sources: modSources = sources,
    error: modError = error,
    close: modClose = close,
    errorMsg: modErrorMsg = errorMsg,
  } = modifiedResult;

  // Preserve the sentAt from the last message in the chat history
  const lastMessage = _chatHistory[_chatHistory.length - 1];
  const sentAt = lastMessage?.sentAt;

  // Create completion event detail for various response types
  let completionEventDetail;

  if (type === "abort") {
    setLoadingResponse(false);
    setChatHistory([
      ...remHistory,
      {
        uuid: modUuid,
        content: modTextResponse,
        role: "assistant",
        sources: modSources,
        closed: true,
        error: modError,
        errorMsg: modErrorMsg,
        animate: false,
        pending: false,
        sentAt,
      },
    ]);
    _chatHistory.push({
      uuid: modUuid,
      content: modTextResponse,
      role: "assistant",
      sources: modSources,
      closed: true,
      error: modError,
      errorMsg: modErrorMsg,
      animate: false,
      pending: false,
      sentAt,
    });

    // Prepare event detail for abort case
    completionEventDetail = {
      type: "abort",
      history: _chatHistory
    };
  } else if (type === "textResponse") {
    setLoadingResponse(false);
    setChatHistory([
      ...remHistory,
      {
        uuid: modUuid,
        content: modTextResponse,
        role: "assistant",
        sources: modSources,
        closed: modClose,
        error: modError,
        errorMsg: modErrorMsg,
        animate: !modClose,
        pending: false,
        sentAt,
      },
    ]);
    _chatHistory.push({
      uuid: modUuid,
      content: modTextResponse,
      role: "assistant",
      sources: modSources,
      closed: modClose,
      error: modError,
      errorMsg: modErrorMsg,
      animate: !modClose,
      pending: false,
      sentAt,
    });

    // Prepare event detail for full response
    completionEventDetail = {
      type: "fullResponse",
      history: _chatHistory
    };
  } else if (type === "textResponseChunk") {
    const chatIdx = _chatHistory.findIndex((chat) => chat.uuid === modUuid);
    if (chatIdx !== -1) {
      const existingHistory = { ..._chatHistory[chatIdx] };
      const updatedHistory = {
        ...existingHistory,
        content: existingHistory.content + modTextResponse,
        sources: modSources,
        error: modError,
        errorMsg: modErrorMsg,
        closed: modClose,
        animate: !modClose,
        pending: false,
        sentAt,
      };
      _chatHistory[chatIdx] = updatedHistory;
    } else {
      _chatHistory.push({
        uuid: modUuid,
        sources: modSources,
        error: modError,
        errorMsg: modErrorMsg,
        content: modTextResponse,
        role: "assistant",
        closed: modClose,
        animate: !modClose,
        pending: false,
        sentAt,
      });
    }
    setChatHistory([..._chatHistory]);

    // Only dispatch completion event for final chunk if closed
    if (modClose) {
      completionEventDetail = {
        type: "streamingComplete",
        history: _chatHistory
      };
    }
  }

  // Dispatch completion event if we have completed a response
  if (completionEventDetail) {
    // Try attribute-based event dispatch first
    dispatchAttributeEvent(settings, "chatResponseCompleted", completionEventDetail);

    // Legacy event listener approach (for backward compatibility)
    window.dispatchEvent(new CustomEvent(EVENTS.CHAT_RESPONSE_COMPLETED, {
      detail: completionEventDetail
    }));
  }
}

export function chatPrompt(workspace) {
  return (
    workspace?.openAiPrompt ??
    "Given the following conversation, relevant context, and a follow up question, reply with an answer to the current question the user is asking. Return only your response to the question given the above information following the users instructions as needed."
  );
}
