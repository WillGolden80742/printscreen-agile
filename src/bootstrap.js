// Bootstrap — instala o Controller e assume o controle mesmo se uma versão
// antiga já estiver injetada na aba (update da extensão não troca o script
// de abas abertas; o listener antigo ignora o namespace novo e é desligado).
(() => {
  const BUILD = '1.9.1';
  const TYPES = {
    start: 'PSA2_START',
    stop: 'PSA2_STOP',
    status: 'PSA2_STATUS',
  };
  if (window.__psaFlow && window.__psaFlow.build === BUILD) return;
  try { window.__psaFlow?.stop(); } catch (error) { /* versão antiga sem stop limpo */ }

  window.__psaFlow = new window.PSA.FlowController();
  window.__psaFlow.build = BUILD;

  chrome.runtime.onMessage.addListener((message, _sender, reply) => {
    if (message?.type === TYPES.start) reply({ ok: window.__psaFlow.start(), build: BUILD });
    if (message?.type === TYPES.stop) reply({ ok: (window.__psaFlow.stop(), true), build: BUILD });
    if (message?.type === TYPES.status) {
      const summary = window.__psaFlow.store.summary();
      reply({ active: window.__psaFlow.running, boxes: summary.boxes, arrows: summary.arrows, build: BUILD });
    }
    return true;
  });
})();
