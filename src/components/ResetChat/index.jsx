import ChatService from "@/models/chatService";
import { useScriptAttributes } from "@/hooks/useScriptAttributes";

export default function ResetChat({ setChatHistory, settings, sessionId }) {
  const { scriptAttributes } = useScriptAttributes();
  const resetChatText = scriptAttributes.resetChatText || "Reset Chat";
  
  const handleChatReset = async () => {
    await ChatService.resetEmbedChatSession(settings, sessionId);
    setChatHistory([]);
  };

  return (
    <div className="allm-w-full allm-flex allm-justify-center">
      <button
        style={{ color: "#7A7D7E" }}
        className="hover:allm-cursor-pointer allm-border-none allm-text-sm allm-bg-transparent hover:allm-opacity-80 hover:allm-underline"
        onClick={() => handleChatReset()}
      >
        {resetChatText}
      </button>
    </div>
  );
}
