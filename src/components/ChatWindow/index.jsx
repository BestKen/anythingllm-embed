import ChatWindowHeader from "./Header";
import SessionId from "../SessionId";
import useChatHistory from "@/hooks/chat/useChatHistory";
import ChatContainer from "./ChatContainer";
import Sponsor from "../Sponsor";
import { ChatHistoryLoading } from "./ChatContainer/ChatHistory";
import ResetChat from "../ResetChat";
import { useEffect, useRef, useState } from "react";
import { EVENTS } from "@/utils/constants";
import { dispatchAttributeEvent } from "@/utils/events";

export default function ChatWindow({ closeChat, settings, sessionId }) {
  const { chatHistory, setChatHistory, loading } = useChatHistory(
    settings,
    sessionId
  );
  const [isResizing, setIsResizing] = useState(false);
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!loading) {
      // Dispatch both event types - attribute-based and traditional event listener
      const eventDetail = { settings, sessionId, chatHistory };

      // New attribute-based event dispatch
      dispatchAttributeEvent(settings, "chatWindowLoaded", eventDetail);

      // Legacy event listener approach (for backward compatibility)
      const event = new CustomEvent(EVENTS.CHAT_WINDOW_LOADED, {
        detail: eventDetail,
      });
      window.dispatchEvent(event);
    }
  }, [loading]);

  // Implement resizable functionality
  useEffect(() => {
    const handleResizeMouseMove = (e) => {
      if (!isResizing) return;

      const chatContainer = document.getElementById("anything-llm-chat");
      if (!chatContainer) return;

      // Calculate new width and height based on mouse movement
      const newWidth = Math.max(
        300,
        initialSize.width + (e.clientX - resizeOffset.x)
      );
      const newHeight = Math.max(
        400,
        initialSize.height + (e.clientY - resizeOffset.y)
      );

      // Set the new size
      chatContainer.style.width = `${newWidth}px`;
      chatContainer.style.height = `${newHeight}px`;
      chatContainer.style.maxWidth = `${newWidth}px`;
      chatContainer.style.maxHeight = `${newHeight}px`;

      // Add resizing class for visual feedback
      chatContainer.classList.add("being-resized");
    };

    const handleResizeMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";

      // Remove resizing class
      const chatContainer = document.getElementById("anything-llm-chat");
      if (chatContainer) {
        chatContainer.classList.remove("being-resized");
      }
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMouseMove);
      document.addEventListener("mouseup", handleResizeMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleResizeMouseMove);
      document.removeEventListener("mouseup", handleResizeMouseUp);
    };
  }, [isResizing, initialSize, resizeOffset]);

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const chatContainer = document.getElementById("anything-llm-chat");
    if (!chatContainer) return;

    const rect = chatContainer.getBoundingClientRect();
    setInitialSize({
      width: rect.width,
      height: rect.height,
    });
    setResizeOffset({
      x: e.clientX,
      y: e.clientY,
    });

    setIsResizing(true);
    document.body.style.cursor = "nwse-resize";
  };

  if (loading) {
    return (
      <div className="allm-flex allm-flex-col allm-h-full">
        <ChatWindowHeader
          sessionId={sessionId}
          settings={settings}
          iconUrl={settings.brandImageUrl}
          closeChat={closeChat}
          setChatHistory={setChatHistory}
        />
        <ChatHistoryLoading />
        <div className="allm-pt-4 allm-pb-2 allm-h-fit allm-gap-y-1">
          <SessionId />
          <Sponsor settings={settings} />
        </div>
      </div>
    );
  }

  setEventDelegatorForCodeSnippets();

  return (
    <div className="allm-flex allm-flex-col allm-h-full">
      <ChatWindowHeader
        sessionId={sessionId}
        settings={settings}
        iconUrl={settings.brandImageUrl}
        closeChat={closeChat}
        setChatHistory={setChatHistory}
      />
      <div className="allm-flex-grow allm-overflow-y-auto">
        <ChatContainer
          sessionId={sessionId}
          settings={settings}
          knownHistory={chatHistory}
        />
      </div>
      <div className="allm-mt-4 allm-pb-4 allm-h-fit allm-gap-y-2 allm-z-10 allm-relative">
        <Sponsor settings={settings} />
        <ResetChat
          setChatHistory={setChatHistory}
          settings={settings}
          sessionId={sessionId}
        />

        {/* Triangular resize handle in the bottom-right corner */}
        <div
          className="resize-handle-triangle"
          onMouseDown={handleResizeMouseDown}
          aria-label="Resize chat window"
        ></div>
      </div>
    </div>
  );
}

// Enables us to safely markdown and sanitize all responses without risk of injection
// but still be able to attach a handler to copy code snippets on all elements
// that are code snippets.
function copyCodeSnippet(uuid) {
  const target = document.querySelector(`[data-code="${uuid}"]`);
  if (!target) return false;

  const markdown =
    target.parentElement?.parentElement?.querySelector(
      "pre:first-of-type"
    )?.innerText;
  if (!markdown) return false;

  window.navigator.clipboard.writeText(markdown);

  target.classList.add("allm-text-green-500");
  const originalText = target.innerHTML;
  target.innerText = "Copied!";
  target.setAttribute("disabled", true);

  setTimeout(() => {
    target.classList.remove("allm-text-green-500");
    target.innerHTML = originalText;
    target.removeAttribute("disabled");
  }, 2500);
}

// Listens and hunts for all data-code-snippet clicks.
function setEventDelegatorForCodeSnippets() {
  document?.addEventListener("click", function (e) {
    const target = e.target.closest("[data-code-snippet]");
    const uuidCode = target?.dataset?.code;
    if (!uuidCode) return false;
    copyCodeSnippet(uuidCode);
  });
}
