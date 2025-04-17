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
  const [isNearBoundary, setIsNearBoundary] = useState(false);

  // Padding from viewport edges (in pixels)
  const BOUNDARY_PADDING = 16;
  // Threshold to trigger boundary effect (in pixels)
  const BOUNDARY_THRESHOLD = 40;

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

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Get chat container dimensions
      const rect = chatContainer.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      // Calculate new position
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Check if near boundary for visual effect
      const isNearLeft = newX < BOUNDARY_THRESHOLD;
      const isNearRight =
        newX + containerWidth > viewportWidth - BOUNDARY_THRESHOLD;
      const isNearTop = newY < BOUNDARY_THRESHOLD;
      const isNearBottom =
        newY + containerHeight > viewportHeight - BOUNDARY_THRESHOLD;

      setIsNearBoundary(isNearLeft || isNearRight || isNearTop || isNearBottom);

      // Apply magnetic effect when near boundaries
      if (isNearLeft) {
        newX = Math.max(newX, BOUNDARY_PADDING);
      } else if (isNearRight) {
        newX = Math.min(
          newX,
          viewportWidth - containerWidth - BOUNDARY_PADDING
        );
      }

      if (isNearTop) {
        newY = Math.max(newY, BOUNDARY_PADDING);
      } else if (isNearBottom) {
        newY = Math.min(
          newY,
          viewportHeight - containerHeight - BOUNDARY_PADDING
        );
      }

      // Constrain to viewport boundaries with padding
      newX = Math.max(
        BOUNDARY_PADDING,
        Math.min(newX, viewportWidth - containerWidth - BOUNDARY_PADDING)
      );
      newY = Math.max(
        BOUNDARY_PADDING,
        Math.min(newY, viewportHeight - containerHeight - BOUNDARY_PADDING)
      );

      // Set the new position
      chatContainer.style.right = "auto";
      chatContainer.style.bottom = "auto";
      chatContainer.style.left = `${newX}px`;
      chatContainer.style.top = `${newY}px`;

      // Add dragging class for visual feedback
      chatContainer.classList.add("being-dragged");

      // Add or remove boundary class based on proximity to edges
      if (isNearBoundary) {
        chatContainer.classList.add("near-boundary");
      } else {
        chatContainer.classList.remove("near-boundary");
      }

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
      setIsNearBoundary(false);
      document.body.style.cursor = "default";

      // Check if the window is near a viewport edge and snap to it if needed
      const chatContainer = document.getElementById("anything-llm-chat");
      if (chatContainer) {
        const snapThreshold = BOUNDARY_THRESHOLD; // pixels
        const rect = chatContainer.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Apply nice transition for docking
        chatContainer.style.transition =
          "left 0.2s ease-out, top 0.2s ease-out";

        // Snap to left edge with padding
        if (rect.left < snapThreshold) {
          chatContainer.style.left = `${BOUNDARY_PADDING}px`;
        }

        // Snap to right edge with padding
        if (viewportWidth - rect.right < snapThreshold) {
          chatContainer.style.left = `${viewportWidth - rect.width - BOUNDARY_PADDING}px`;
        }

        // Snap to top edge with padding
        if (rect.top < snapThreshold) {
          chatContainer.style.top = `${BOUNDARY_PADDING}px`;
        }

        // Snap to bottom edge with padding
        if (viewportHeight - rect.bottom < snapThreshold) {
          chatContainer.style.top = `${viewportHeight - rect.height - BOUNDARY_PADDING}px`;
        }

        chatContainer.classList.remove("being-dragged");
        chatContainer.classList.remove("near-boundary");

        // Remove the transition after it completes
        setTimeout(() => {
          chatContainer.style.transition = "";
        }, 250);
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
  }, [isDragging, dragOffset, isNearBoundary]);

  // Handle window resize to ensure chat window remains within viewport
  useEffect(() => {
    const handleResize = () => {
      const chatContainer = document.getElementById("anything-llm-chat");
      if (!chatContainer) return;

      // Only apply constraints if the window has been moved from default position
      if (chatContainer.style.left || chatContainer.style.top) {
        const rect = chatContainer.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Ensure window stays fully in viewport after resize with padding
        if (rect.right > viewportWidth - BOUNDARY_PADDING) {
          chatContainer.style.left = `${Math.max(BOUNDARY_PADDING, viewportWidth - rect.width - BOUNDARY_PADDING)}px`;
        }

        if (rect.bottom > viewportHeight - BOUNDARY_PADDING) {
          chatContainer.style.top = `${Math.max(BOUNDARY_PADDING, viewportHeight - rect.height - BOUNDARY_PADDING)}px`;
        }

        // Also check the top and left edges
        if (rect.left < BOUNDARY_PADDING) {
          chatContainer.style.left = `${BOUNDARY_PADDING}px`;
        }

        if (rect.top < BOUNDARY_PADDING) {
          chatContainer.style.top = `${BOUNDARY_PADDING}px`;
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

    // Remove any existing transitions
    chatContainer.style.transition = "";

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
      } ${isNearBoundary ? "allm-bg-blue-50" : ""}`}
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
