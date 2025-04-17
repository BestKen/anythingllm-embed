import React, { useState, useEffect } from "react";
import ChatHistory from "./ChatHistory";
import PromptInput from "./PromptInput";
import handleChat from "@/utils/chat";
import ChatService from "@/models/chatService";
import { EVENTS } from "@/utils/constants";
import { dispatchAttributeEvent } from "@/utils/events";
export const SEND_TEXT_EVENT = "anythingllm-embed-send-prompt";

export default function ChatContainer({
  sessionId,
  settings,
  knownHistory = [],
}) {
  const [message, setMessage] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [chatHistory, setChatHistory] = useState(knownHistory);

  // Resync history if the ref to known history changes
  // eg: cleared.
  useEffect(() => {
    if (knownHistory.length !== chatHistory.length)
      setChatHistory([...knownHistory]);
  }, [knownHistory]);

  const handleMessageChange = (event) => {
    setMessage(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!message || message === "") return false;

    // Create event detail object
    const eventDetail = {
      originalMessage: message,
      modifiedMessage: message,
      cancel: false,
    };

    // Try attribute-based event dispatch first
    dispatchAttributeEvent(settings, "beforeSendMessage", eventDetail);

    // Legacy event listener approach (for backward compatibility)
    const beforeSendEvent = new CustomEvent(EVENTS.BEFORE_SEND_MESSAGE, {
      detail: eventDetail,
    });
    window.dispatchEvent(beforeSendEvent);

    // Check if sending was cancelled by an event handler
    if (eventDetail.cancel) {
      return false;
    }

    // Use potentially modified message
    const finalMessage = eventDetail.modifiedMessage;

    const prevChatHistory = [
      ...chatHistory,
      {
        content: finalMessage,
        role: "user",
        sentAt: Math.floor(Date.now() / 1000),
      },
      {
        content: "",
        role: "assistant",
        pending: true,
        userMessage: finalMessage,
        animate: true,
        sentAt: Math.floor(Date.now() / 1000),
      },
    ];
    setChatHistory(prevChatHistory);
    setMessage("");
    setLoadingResponse(true);
  };

  const sendCommand = (command, history = [], attachments = []) => {
    if (!command || command === "") return false;

    // Create event detail object
    const eventDetail = {
      originalMessage: command,
      modifiedMessage: command,
      cancel: false,
      isCommand: true,
    };

    // Try attribute-based event dispatch first
    dispatchAttributeEvent(settings, "beforeSendMessage", eventDetail);

    // Legacy event listener approach (for backward compatibility)
    const beforeSendEvent = new CustomEvent(EVENTS.BEFORE_SEND_MESSAGE, {
      detail: eventDetail,
    });
    window.dispatchEvent(beforeSendEvent);

    // Check if sending was cancelled by an event handler
    if (eventDetail.cancel) {
      return false;
    }

    // Use potentially modified command
    const finalCommand = eventDetail.modifiedMessage;

    let prevChatHistory;
    if (history.length > 0) {
      // use pre-determined history chain.
      prevChatHistory = [
        ...history,
        {
          content: "",
          role: "assistant",
          pending: true,
          userMessage: finalCommand,
          attachments,
          animate: true,
        },
      ];
    } else {
      prevChatHistory = [
        ...chatHistory,
        {
          content: finalCommand,
          role: "user",
          attachments,
        },
        {
          content: "",
          role: "assistant",
          pending: true,
          userMessage: finalCommand,
          animate: true,
        },
      ];
    }

    setChatHistory(prevChatHistory);
    setLoadingResponse(true);
  };

  useEffect(() => {
    async function fetchReply() {
      const promptMessage =
        chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;
      const remHistory = chatHistory.length > 0 ? chatHistory.slice(0, -1) : [];
      var _chatHistory = [...remHistory];

      if (!promptMessage || !promptMessage?.userMessage) {
        setLoadingResponse(false);
        return false;
      }

      await ChatService.streamChat(
        sessionId,
        settings,
        promptMessage.userMessage,
        (chatResult) =>
          handleChat(
            chatResult,
            setLoadingResponse,
            setChatHistory,
            remHistory,
            _chatHistory,
            settings
          )
      );
      return;
    }

    loadingResponse === true && fetchReply();
  }, [loadingResponse, chatHistory]);

  const handleAutofillEvent = (event) => {
    if (!event.detail.command) return;
    sendCommand(event.detail.command, [], []);
  };

  useEffect(() => {
    window.addEventListener(SEND_TEXT_EVENT, handleAutofillEvent);
    return () => {
      window.removeEventListener(SEND_TEXT_EVENT, handleAutofillEvent);
    };
  }, []);

  return (
    <div className="allm-h-full allm-w-full allm-flex allm-flex-col">
      <div className="allm-flex-1 allm-min-h-0 allm-mb-8">
        <ChatHistory settings={settings} history={chatHistory} />
      </div>
      <div className="allm-flex-shrink-0 allm-mt-auto">
        <PromptInput
          message={message}
          submit={handleSubmit}
          onChange={handleMessageChange}
          inputDisabled={loadingResponse}
          buttonDisabled={loadingResponse}
        />
      </div>
    </div>
  );
}
