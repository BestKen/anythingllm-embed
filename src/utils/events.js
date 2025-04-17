// filepath: /home/ken/gitlab/anythingllm-embed/src/utils/events.js

/**
 * Dispatches an event using the custom event handler specified in the script attributes
 * @param {Object} settings - The settings object containing eventHandlers
 * @param {string} eventType - The type of event (chatWindowLoaded, chatResponseReceived, etc.)
 * @param {Object} detail - The event detail object to pass to the handler
 * @returns {boolean} - Whether the event was successfully dispatched
 */
export function dispatchAttributeEvent(settings, eventType, detail) {
    try {
        if (!settings?.eventHandlers || !settings.eventHandlers[eventType]) {
            return false;
        }

        const handlerName = settings.eventHandlers[eventType];

        // Check if the function exists in the global scope
        if (typeof window[handlerName] !== 'function') {
            console.warn(`[AnythingLLM Embed] Event handler function '${handlerName}' not found for event '${eventType}'.`);
            return false;
        }

        // Create a custom event object similar to what would be dispatched with addEventListener
        const eventObject = {
            type: `anythingllm-${eventType.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
            detail: detail
        };

        // Call the handler function with the event object
        window[handlerName](eventObject);
        return true;
    } catch (error) {
        console.error(`[AnythingLLM Embed] Error dispatching ${eventType} event:`, error);
        return false;
    }
}

/**
 * Helper function to convert from event attribute format to event type
 * @param {string} attributeName - The attribute name (e.g., 'on-chat-window-loaded' or legacy 'data-event-chat-window-loaded')
 * @returns {string} - The event type (e.g., 'chatWindowLoaded')
 */
export function attributeToEventType(attributeName) {
    // Support both new on-xxx and legacy data-event-xxx patterns
    const isNewPattern = attributeName.startsWith('on-');
    const isLegacyPattern = attributeName.startsWith('data-event-');

    if (!isNewPattern && !isLegacyPattern) return null;

    // Remove prefix based on pattern
    const eventName = isNewPattern
        ? attributeName.replace('on-', '')
        : attributeName.replace('data-event-', '');

    // Convert kebab-case to camelCase
    return eventName
        .split('-')
        .map((part, index) =>
            index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
        )
        .join('');
}