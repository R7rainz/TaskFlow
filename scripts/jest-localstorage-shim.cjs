// Ensures Node's experimental localStorage getter is not invoked by Jest.
// Node v25 exposes a global `localStorage` that throws unless started with
// `--localstorage-file`. We override it with a harmless stub before Jest loads.
try {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    enumerable: true,
    value: {
      get length() {
        return 0;
      },
      clear() {},
      getItem() {
        return null;
      },
      key() {
        return null;
      },
      removeItem() {},
      setItem() {},
    },
    writable: true,
  });
} catch (error) {
  // If overriding fails, fall back to deleting the property entirely
  // so Jest does not trigger Node's experimental getter.
  try {
    delete globalThis.localStorage;
  } catch {
    // ignore
  }
}
