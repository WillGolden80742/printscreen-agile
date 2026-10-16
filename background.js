// Service worker (MV3) — 1 clique de captureVisibleTab por vez.
// Sem rajada: o content chama uma vez por captura (igual ao área).
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'PSA_SHOT') return false;
  (async () => {
    try {
      const currentWindow = await chrome.windows.getCurrent();
      const dataUrl = await chrome.tabs.captureVisibleTab(currentWindow.id, { format: 'png' });
      sendResponse({ ok: true, dataUrl });
    } catch (error) {
      sendResponse({ ok: false, error: String(error?.message || error) });
    }
  })();
  return true;
});
