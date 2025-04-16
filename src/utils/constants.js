export const CHAT_UI_REOPEN = "___anythingllm-chat-widget-open___";

// Pub/Sub event constants
export const EVENTS = {
  CHAT_WINDOW_LOADED: "anythingllm-chat-window-loaded",
  CHAT_RESPONSE_RECEIVED: "anythingllm-chat-response-received",
  CHAT_RESPONSE_COMPLETED: "anythingllm-chat-response-completed",
  BEFORE_SEND_MESSAGE: "anythingllm-before-send-message"
};

export function parseStylesSrc(scriptSrc = null) {
  try {
    const _url = new URL(scriptSrc);
    _url.pathname = _url.pathname
      .replace("anythingllm-chat-widget.js", "anythingllm-chat-widget.min.css")
      .replace(
        "anythingllm-chat-widget.min.js",
        "anythingllm-chat-widget.min.css"
      );
    return _url.toString();
  } catch {
    return "";
  }
}
