// For handling of synchronous chats that are not utilizing streaming or chat requests.
import { EVENTS } from "../constants";

export default function handleChat(
  chatResult,
  setLoadingResponse,
  setChatHistory,
  remHistory,
  _chatHistory
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

  // Allow modification of the chat result via event
  const receivedEvent = new CustomEvent(EVENTS.CHAT_RESPONSE_RECEIVED, {
    detail: {
      originalChatResult: chatResult,
      modifiedChatResult: { ...chatResult }
    }
  });
  window.dispatchEvent(receivedEvent);

  // Use modified response if provided
  const modifiedResult = receivedEvent.detail.modifiedChatResult || chatResult;
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

    // Dispatch completion event for abort case
    window.dispatchEvent(new CustomEvent(EVENTS.CHAT_RESPONSE_COMPLETED, {
      detail: {
        type: "abort",
        history: _chatHistory
      }
    }));
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

    // Dispatch completion event for full response
    window.dispatchEvent(new CustomEvent(EVENTS.CHAT_RESPONSE_COMPLETED, {
      detail: {
        type: "fullResponse",
        history: _chatHistory
      }
    }));
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

    // Dispatch completion event for final chunk if closed
    if (modClose) {
      window.dispatchEvent(new CustomEvent(EVENTS.CHAT_RESPONSE_COMPLETED, {
        detail: {
          type: "streamingComplete",
          history: _chatHistory
        }
      }));
    }
  }
}

export function chatPrompt(workspace) {
  return (
    workspace?.openAiPrompt ??
    "Given the following conversation, relevant context, and a follow up question, reply with an answer to the current question the user is asking. Return only your response to the question given the above information following the users instructions as needed."
  );
}
