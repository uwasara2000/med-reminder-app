// Polyfills for React Native / Hermes environment
(function () {
  const g = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;

  // 1. DOMException Polyfill
  if (!g.DOMException) {
    class DOMException extends Error {
      constructor(message = '', name = 'Error') {
        super(message);
        this.name = name;
        this.message = message;
      }
    }

    DOMException.INDEX_SIZE_ERR = 1;
    DOMException.DOMSTRING_SIZE_ERR = 2;
    DOMException.HIERARCHY_REQUEST_ERR = 3;
    DOMException.WRONG_DOCUMENT_ERR = 4;
    DOMException.INVALID_CHARACTER_ERR = 5;
    DOMException.NO_DATA_ALLOWED_ERR = 6;
    DOMException.NO_MODIFICATION_ALLOWED_ERR = 7;
    DOMException.NOT_FOUND_ERR = 8;
    DOMException.NOT_SUPPORTED_ERR = 9;
    DOMException.INUSE_ATTRIBUTE_ERR = 10;
    DOMException.INVALID_STATE_ERR = 11;
    DOMException.SYNTAX_ERR = 12;
    DOMException.INVALID_MODIFICATION_ERR = 13;
    DOMException.NAMESPACE_ERR = 14;
    DOMException.INVALID_ACCESS_ERR = 15;
    DOMException.VALIDATION_ERR = 16;
    DOMException.TYPE_MISMATCH_ERR = 17;
    DOMException.SECURITY_ERR = 18;
    DOMException.NETWORK_ERR = 19;
    DOMException.ABORT_ERR = 20;
    DOMException.URL_MISMATCH_ERR = 21;
    DOMException.QUOTA_EXCEEDED_ERR = 22;
    DOMException.TIMEOUT_ERR = 23;
    DOMException.INVALID_NODE_TYPE_ERR = 24;
    DOMException.DATA_CLONE_ERR = 25;

    g.DOMException = DOMException;
    if (typeof globalThis !== 'undefined') globalThis.DOMException = DOMException;
    if (typeof global !== 'undefined') global.DOMException = DOMException;
    if (typeof window !== 'undefined') window.DOMException = DOMException;
  }

  // 2. Fix for React Native 0.81 Event.NONE read-only property collision with event-target-shim
  if (typeof g.Event !== 'undefined') {
    try {
      const eventConstants = { NONE: 0, CAPTURING_PHASE: 1, AT_TARGET: 2, BUBBLING_PHASE: 3 };
      Object.keys(eventConstants).forEach(key => {
        try {
          Object.defineProperty(g.Event, key, {
            value: eventConstants[key],
            writable: true,
            configurable: true,
            enumerable: true
          });
          if (g.Event.prototype) {
            Object.defineProperty(g.Event.prototype, key, {
              value: eventConstants[key],
              writable: true,
              configurable: true,
              enumerable: true
            });
          }
        } catch (e) {
          // ignore
        }
      });
    } catch (e) {
      // ignore
    }
  }
})();
