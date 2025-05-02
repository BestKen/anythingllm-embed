import useGetScriptAttributes from "@/hooks/useScriptAttributes";
import useSessionId from "@/hooks/useSessionId";
import useOpenChat from "@/hooks/useOpen";
import Head from "@/components/Head";
import OpenButton from "@/components/OpenButton";
import ChatWindow from "./components/ChatWindow";
import { useEffect, useRef, useState } from "react";

export default function App() {
  const { isChatOpen, toggleOpenChat } = useOpenChat();
  const embedSettings = useGetScriptAttributes();
  const sessionId = useSessionId();
  const [chatOpacity, setChatOpacity] = useState(1);
  const chatWindowRef = useRef(null);
  const [isDragged, setIsDragged] = useState(false);

  useEffect(() => {
    if (embedSettings.openOnLoad === "on") {
      toggleOpenChat(true);
    }
  }, [embedSettings.loaded]);

  // Handle click outside chat window
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isChatOpen &&
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target)
      ) {
        setChatOpacity(0.5);
      } else if (isChatOpen) {
        setChatOpacity(1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isChatOpen]);

  // Check if window has been dragged
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "style" ||
            mutation.attributeName === "class")
        ) {
          const chatWindow = document.getElementById("anything-llm-chat");
          if (chatWindow && (chatWindow.style.left || chatWindow.style.top)) {
            setIsDragged(true);
          }
        }
      });
    });

    const chatWindow = document.getElementById("anything-llm-chat");
    if (chatWindow) {
      observer.observe(chatWindow, { attributes: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [isChatOpen]);

  if (!embedSettings.loaded) return null;

  const positionClasses = {
    "bottom-left": "allm-bottom-0 allm-left-0 allm-ml-4",
    "bottom-right": "allm-bottom-0 allm-right-0 allm-mr-4",
    "top-left": "allm-top-0 allm-left-0 allm-ml-4 allm-mt-4",
    "top-right": "allm-top-0 allm-right-0 allm-mr-4 allm-mt-4",
  };

  const position = embedSettings.position || "bottom-right";
  const windowWidth = embedSettings.windowWidth ?? "400px";
  const windowHeight = embedSettings.windowHeight ?? "700px";

  // Parse custom button container styles if provided
  const buttonContainerStyles = embedSettings.buttonContainerStyles
    ? JSON.parse(embedSettings.buttonContainerStyles)
    : {};

  return (
    <>
      <Head />
      <div
        id="anything-llm-embed-chat-container"
        className={`allm-fixed allm-z-50 ${isChatOpen ? "allm-block" : "allm-hidden"}`}
      >
        <div
          ref={chatWindowRef}
          style={{
            maxWidth: windowWidth,
            maxHeight: windowHeight,
            height: "100%",
            opacity: chatOpacity,
            transition: "opacity 0.2s ease-in-out",
          }}
          className={`allm-h-full allm-w-full allm-bg-white allm-fixed allm-bottom-0 allm-right-0 allm-mb-4 allm-md:mr-4 allm-rounded-2xl allm-border allm-border-gray-300 allm-shadow-[0_4px_14px_rgba(0,0,0,0.25)] allm-flex allm-flex-col ${!isDragged ? positionClasses[position] : ""}`}
          id="anything-llm-chat"
        >
          {isChatOpen && (
            <ChatWindow
              closeChat={() => toggleOpenChat(false)}
              settings={embedSettings}
              sessionId={sessionId}
            />
          )}
        </div>
      </div>
      {!isChatOpen && (
        <div
          id="anything-llm-embed-chat-button-container"
          className={`allm-fixed allm-bottom-0 ${positionClasses[position]} allm-mb-4 allm-z-50`}
          style={buttonContainerStyles}
        >
          <OpenButton
            settings={embedSettings}
            isOpen={isChatOpen}
            toggleOpen={() => toggleOpenChat(true)}
          />
        </div>
      )}
    </>
  );
}
