import AnythingLLMIcon from "@/assets/anything-llm-icon.svg";
import ChatService from "@/models/chatService";
import { useScriptAttributes } from "@/hooks/useScriptAttributes";
import {
  ArrowCounterClockwise,
  Check,
  Copy,
  DotsThreeOutlineVertical,
  Envelope,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

export default function ChatWindowHeader({
  sessionId,
  settings = {},
  iconUrl = null,
  closeChat,
  setChatHistory,
}) {
  const [showingOptions, setShowOptions] = useState(false);
  const menuRef = useRef();
  const buttonRef = useRef();
  const headerRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleChatReset = async () => {
    await ChatService.resetEmbedChatSession(settings, sessionId);
    setChatHistory([]);
    setShowOptions(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Implement draggable functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const chatContainer = document.getElementById("anything-llm-chat");
      if (!chatContainer) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Set the new position
      chatContainer.style.right = "auto";
      chatContainer.style.bottom = "auto";
      chatContainer.style.left = `${newX}px`;
      chatContainer.style.top = `${newY}px`;

      // Add dragging class for visual feedback
      chatContainer.classList.add("being-dragged");

      // Remove the position classes
      chatContainer.classList.remove(
        "allm-bottom-0",
        "allm-left-0",
        "allm-ml-4",
        "allm-bottom-0",
        "allm-right-0",
        "allm-mr-4",
        "allm-top-0",
        "allm-left-0",
        "allm-ml-4",
        "allm-mt-4",
        "allm-top-0",
        "allm-right-0",
        "allm-mr-4",
        "allm-mt-4"
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "default";

      // Remove dragging class
      const chatContainer = document.getElementById("anything-llm-chat");
      if (chatContainer) {
        chatContainer.classList.remove("being-dragged");
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e) => {
    // Only initiate drag if the click is not on a button
    if (
      e.target.tagName.toLowerCase() === "button" ||
      e.target.closest("button") ||
      menuRef.current?.contains(e.target)
    ) {
      return;
    }

    const chatContainer = document.getElementById("anything-llm-chat");
    if (!chatContainer) return;

    // Calculate the offset of the mouse pointer relative to the container
    const rect = chatContainer.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    setIsDragging(true);
    document.body.style.cursor = "move";
  };

  return (
    <div
      ref={headerRef}
      style={{
        borderBottom: "1px solid #E9E9E9",
        cursor: isDragging ? "move" : "grab",
      }}
      className={`allm-flex allm-items-center allm-relative allm-rounded-t-2xl ${
        isDragging ? "allm-bg-gray-100" : ""
      }`}
      id="anything-llm-header"
      onMouseDown={handleMouseDown}
    >
      <div className="allm-flex allm-justify-center allm-items-center allm-w-full allm-h-[76px]">
        <img
          style={{ maxWidth: 48, maxHeight: 48 }}
          src={iconUrl ?? AnythingLLMIcon}
          alt={iconUrl ? "Brand" : "AnythingLLM Logo"}
        />
      </div>
      <div className="allm-absolute allm-right-0 allm-flex allm-gap-x-1 allm-items-center allm-px-[22px]">
        {settings.loaded && (
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setShowOptions(!showingOptions)}
            className="allm-bg-transparent hover:allm-cursor-pointer allm-border-none hover:allm-bg-gray-100 allm-rounded-sm allm-text-slate-800/60"
            aria-label="Options"
          >
            <DotsThreeOutlineVertical size={20} weight="fill" />
          </button>
        )}
        <button
          type="button"
          onClick={closeChat}
          className="allm-bg-transparent hover:allm-cursor-pointer allm-border-none hover:allm-bg-gray-100 allm-rounded-sm allm-text-slate-800/60"
          aria-label="Close"
        >
          <X size={20} weight="bold" />
        </button>
      </div>
      <OptionsMenu
        settings={settings}
        showing={showingOptions}
        resetChat={handleChatReset}
        sessionId={sessionId}
        menuRef={menuRef}
      />
    </div>
  );
}

function OptionsMenu({ settings, showing, resetChat, sessionId, menuRef }) {
  const { scriptAttributes } = useScriptAttributes();
  const resetChatText = scriptAttributes.resetChatText || "Reset Chat";

  if (!showing) return null;
  return (
    <div
      ref={menuRef}
      className="allm-bg-white allm-absolute allm-z-10 allm-flex allm-flex-col allm-gap-y-1 allm-rounded-xl allm-shadow-lg allm-top-[64px] allm-right-[46px]"
    >
      <button
        onClick={resetChat}
        className="hover:allm-cursor-pointer allm-bg-white allm-gap-x-[12px] hover:allm-bg-gray-100 allm-rounded-lg allm-border-none allm-flex allm-items-center allm-text-base allm-text-[#7A7D7E] allm-font-bold allm-px-4"
      >
        <ArrowCounterClockwise size={24} />
        <p className="allm-text-[14px]">{resetChatText}</p>
      </button>
      <ContactSupport email={settings.supportEmail} />
      <SessionID sessionId={sessionId} />
    </div>
  );
}

function SessionID({ sessionId }) {
  if (!sessionId) return null;

  const [sessionIdCopied, setSessionIdCopied] = useState(false);

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setSessionIdCopied(true);
    setTimeout(() => setSessionIdCopied(false), 1000);
  };

  if (sessionIdCopied) {
    return (
      <div className="hover:allm-cursor-pointer allm-bg-white allm-gap-x-[12px] hover:allm-bg-gray-100 allm-rounded-lg allm-border-none allm-flex allm-items-center allm-text-base allm-text-[#7A7D7E] allm-font-bold allm-px-4">
        <Check size={24} />
        <p className="allm-text-[14px] allm-font-sans">Copied!</p>
      </div>
    );
  }

  return (
    <button
      onClick={copySessionId}
      className="hover:allm-cursor-pointer allm-bg-white allm-gap-x-[12px] hover:allm-bg-gray-100 allm-rounded-lg allm-border-none allm-flex allm-items-center allm-text-base allm-text-[#7A7D7E] allm-font-bold allm-px-4"
    >
      <Copy size={24} />
      <p className="allm-text-[14px]">Session ID</p>
    </button>
  );
}

function ContactSupport({ email = null }) {
  if (!email) return null;

  const subject = `Inquiry from ${window.location.origin}`;
  return (
    <a
      href={`mailto:${email}?Subject=${encodeURIComponent(subject)}`}
      className="allm-no-underline hover:allm-underline hover:allm-cursor-pointer allm-bg-white allm-gap-x-[12px] hover:allm-bg-gray-100 allm-rounded-lg allm-border-none allm-flex allm-items-center allm-text-base allm-text-[#7A7D7E] allm-font-bold allm-px-4"
    >
      <Envelope size={24} />
      <p className="allm-text-[14px] allm-font-sans">Email Support</p>
    </a>
  );
}
