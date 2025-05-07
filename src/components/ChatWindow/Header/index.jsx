import AnythingLLMIcon from "@/assets/anything-llm-icon.svg";
import ChatService from "@/models/chatService";
import { useScriptAttributes } from "@/hooks/useScriptAttributes";
import {
  ArrowCounterClockwise,
  CaretUp,
  Check,
  Copy,
  DotsThreeOutlineVertical,
  Envelope,
  Info,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import renderMarkdown from "@/utils/chat/markdown";
import createDOMPurify from "dompurify";

const DOMPurify = createDOMPurify(window);
// Configure DOMPurify to allow target="_blank" and rel attributes on links
DOMPurify.setConfig({
  ADD_ATTR: ["target", "rel"],
  ADD_TAGS: ["a"],
  ALLOW_UNKNOWN_PROTOCOLS: true,
});

// Helper function to process escape sequences in strings
const processEscapeSequences = (text) => {
  if (!text) return "";

  // Replace literal \n with actual newlines
  return text.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r");
};

export default function ChatWindowHeader({
  sessionId,
  settings = {},
  iconUrl = null,
  closeChat,
  setChatHistory,
}) {
  const [showingOptions, setShowOptions] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
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

  const toggleContactInfo = () => {
    if (showContactInfo) {
      // If already showing, animate closing
      const contactCard = document.querySelector(
        '[data-contact-info-card="true"]'
      );
      if (contactCard) {
        contactCard.style.height = "0px";
        // Wait for animation to complete before hiding
        setTimeout(() => {
          setShowContactInfo(false);
        }, 300); // Match animation duration
      } else {
        setShowContactInfo(false);
      }
    } else {
      // If not showing, simply show it
      setShowContactInfo(true);
    }

    // Close options menu if it's open
    if (showingOptions) setShowOptions(false);
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
      <div className="allm-absolute allm-left-0 allm-flex allm-gap-x-1 allm-items-center allm-px-[22px]">
        {settings.loaded && settings.contactInfo && (
          <button
            type="button"
            onClick={toggleContactInfo}
            className={`allm-bg-transparent hover:allm-cursor-pointer allm-border-none hover:allm-bg-gray-100 allm-rounded-sm ${
              showContactInfo ? "allm-text-blue-500" : "allm-text-slate-800/60"
            }`}
            aria-label="Contact Info"
          >
            <Info size={24} weight="fill" />
          </button>
        )}
      </div>
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
      {showContactInfo && (
        <ContactInfoCard
          contactInfo={settings.contactInfo}
          onClose={() => setShowContactInfo(false)}
        />
      )}
    </div>
  );
}

function ContactInfoCard({ contactInfo, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const cardRef = useRef(null);
  const contentRef = useRef(null);
  const [maxContentHeight, setMaxContentHeight] = useState(
    "calc(100vh - 200px)"
  ); // Default fallback
  const FOOTER_HEIGHT = 40; // Height for the footer with close handle

  const handleClose = () => {
    setIsClosing(true);

    // Animate to height 0
    if (cardRef.current) {
      cardRef.current.style.height = "0px";
    }

    // Wait for animation to complete before actually removing the component
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  // Prevent mousedown events from propagating to parent (header)
  // but still allow text selection
  const handleMouseDown = (e) => {
    // Only stop propagation if not trying to select text
    if (window.getSelection().toString() === "") {
      e.stopPropagation();
    }
  };

  // Calculate max height based on chat window height and set initial animation
  useEffect(() => {
    if (cardRef.current && contentRef.current) {
      // Get the chat window container
      const chatContainer = document.getElementById("anything-llm-chat");
      if (!chatContainer) return;

      // Get the header height
      const header = document.getElementById("anything-llm-header");
      const headerHeight = header ? header.offsetHeight : 76; // Default header height if not found

      // Calculate available height (chat window height minus header, footer, and some padding)
      const chatWindowHeight = chatContainer.offsetHeight;
      const calculatedMaxHeight =
        chatWindowHeight - headerHeight - FOOTER_HEIGHT - 20; // 20px for padding

      setMaxContentHeight(`${calculatedMaxHeight}px`);

      // Set initial height to 0
      cardRef.current.style.height = "0px";

      // Force a reflow to ensure the initial height is applied
      void cardRef.current.offsetHeight;

      // Animate to content height (limited by max height) plus footer height
      requestAnimationFrame(() => {
        cardRef.current.style.height = `${calculatedMaxHeight + FOOTER_HEIGHT}px`;
      });
    }

    // Update max height on window resize
    const handleResize = () => {
      const chatContainer = document.getElementById("anything-llm-chat");
      if (!chatContainer) return;

      const header = document.getElementById("anything-llm-header");
      const headerHeight = header ? header.offsetHeight : 76;

      const chatWindowHeight = chatContainer.offsetHeight;
      const calculatedMaxHeight =
        chatWindowHeight - headerHeight - FOOTER_HEIGHT - 20;

      setMaxContentHeight(`${calculatedMaxHeight}px`);

      // Also update the card height if it's open
      if (cardRef.current && cardRef.current.style.height !== "0px") {
        cardRef.current.style.height = `${calculatedMaxHeight + FOOTER_HEIGHT}px`;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={cardRef}
      className="allm-absolute allm-z-20 allm-top-full allm-left-0 allm-right-0 allm-bg-white allm-shadow-lg allm-rounded-b-lg allm-overflow-hidden allm-transition-[height] allm-duration-300 allm-ease-in-out allm-flex allm-flex-col"
      style={{ height: 0 }}
      data-contact-info-card="true"
      onMouseDown={handleMouseDown}
    >
      {/* Scrollable content area */}
      <div
        ref={contentRef}
        className="allm-relative allm-p-4 allm-overflow-y-auto allm-flex-grow"
        style={{ height: maxContentHeight }}
      >
        <div
          className="allm-prose allm-max-w-none allm-pt-2 allm-pb-2 allm-px-2 allm-select-text allm-mx-auto"
          style={{
            userSelect: "text",
            WebkitUserSelect: "text",
            MozUserSelect: "text",
            msUserSelect: "text",
            cursor: "text",
          }}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              renderMarkdown(processEscapeSequences(contactInfo || ""))
            ),
          }}
        />
      </div>

      {/* Fixed footer with close handle */}
      <div className="allm-flex allm-flex-col allm-items-center allm-w-full allm-py-2 allm-border-t allm-border-gray-100">
        <button
          type="button"
          onClick={handleClose}
          className="allm-flex allm-flex-col allm-items-center allm-bg-transparent allm-border-none allm-cursor-pointer allm-w-full"
          aria-label="Close contact info"
        >
          <CaretUp
            size={10}
            weight="bold"
            className="allm-text-gray-400 allm-mb-1"
          />
        </button>
      </div>
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
      className="allm-bg-white allm-absolute allm-z-50 allm-flex allm-flex-col allm-gap-y-1 allm-rounded-xl allm-shadow-lg allm-top-[64px] allm-right-[46px]"
    >
      <button
        type="button"
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
      type="button"
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
