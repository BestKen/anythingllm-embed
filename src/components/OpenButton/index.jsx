import {
  Plus,
  ChatCircleDots,
  Headset,
  Binoculars,
  MagnifyingGlass,
  MagicWand,
} from "@phosphor-icons/react";
import { useState } from "react";

const CHAT_ICONS = {
  plus: Plus,
  chatBubble: ChatCircleDots,
  support: Headset,
  search2: Binoculars,
  search: MagnifyingGlass,
  magic: MagicWand,
};

export default function OpenButton({ settings, isOpen, toggleOpen }) {
  const [isHovered, setIsHovered] = useState(false);

  if (isOpen) return null;

  // Extract tooltip settings
  const buttonTooltipText = settings?.buttonTooltipText || "";
  const showButtonTooltip = settings?.showButtonTooltip !== "off";
  const buttonTooltipAlwaysOn = settings?.buttonTooltipAlwaysOn === "on";
  // Only show tooltip if there's text and tooltip is enabled
  const tooltipVisible =
    buttonTooltipText &&
    showButtonTooltip &&
    (buttonTooltipAlwaysOn || isHovered);

  // Check if custom image URL is provided
  if (settings?.customButtonImageUrl) {
    return (
      <div className="allm-relative">
        {tooltipVisible && (
          <div className="allm-absolute allm-bottom-full allm-left-1/2 allm-transform allm--translate-x-1/2 allm-mb-2 allm-px-3 allm-py-1 allm-bg-gray-800 allm-text-white allm-text-sm allm-rounded-md allm-whitespace-nowrap">
            {buttonTooltipText}
            <div className="allm-absolute allm-top-full allm-left-1/2 allm-transform allm--translate-x-1/2 allm--translate-y-1/2 allm-border-4 allm-border-transparent allm-border-t-gray-800"></div>
          </div>
        )}
        <button
          style={{
            backgroundColor: settings.buttonColor,
          }}
          id="anything-llm-embed-chat-button"
          onClick={toggleOpen}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`hover:allm-cursor-pointer allm-border-none allm-flex allm-items-center allm-justify-center allm-p-4 allm-rounded-full allm-text-white allm-text-2xl hover:allm-opacity-95`}
          aria-label="Toggle Menu"
        >
          <img
            src={settings.customButtonImageUrl}
            alt="Chat"
            style={{
              width: settings.customButtonImageWidth || "24px",
              height: settings.customButtonImageHeight || "24px",
            }}
          />
        </button>
      </div>
    );
  }

  // Default icon behavior
  const ChatIcon = CHAT_ICONS.hasOwnProperty(settings?.chatIcon)
    ? CHAT_ICONS[settings.chatIcon]
    : CHAT_ICONS.plus;
  return (
    <div className="allm-relative">
      {tooltipVisible && (
        <div className="allm-absolute allm-bottom-full allm-left-1/2 allm-transform allm--translate-x-1/2 allm-mb-2 allm-px-3 allm-py-1 allm-bg-gray-800 allm-text-white allm-text-sm allm-rounded-md allm-whitespace-nowrap">
          {buttonTooltipText}
          <div className="allm-absolute allm-top-full allm-left-1/2 allm-transform allm--translate-x-1/2 allm--translate-y-1/2 allm-border-4 allm-border-transparent allm-border-t-gray-800"></div>
        </div>
      )}
      <button
        style={{
          backgroundColor: settings.buttonColor,
        }}
        id="anything-llm-embed-chat-button"
        onClick={toggleOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hover:allm-cursor-pointer allm-border-none allm-flex allm-items-center allm-justify-center allm-p-4 allm-rounded-full allm-text-white allm-text-2xl hover:allm-opacity-95`}
        aria-label="Toggle Menu"
      >
        <ChatIcon className="text-white" />
      </button>
    </div>
  );
}
