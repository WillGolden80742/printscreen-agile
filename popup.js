const statusEl = document.getElementById('status');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');

// Namespace novo (PSA2_*): abas abertas com a versão antiga ignoram essas
// mensagens, e o bootstrap novo desliga o fluxo antigo ao injetar.
const MSG = { start: 'PSA2_START', stop: 'PSA2_STOP', status: 'PSA2_STATUS' };

// Arquivos injetados em ordem (Model → View → Controller). Lib de mercado primeiro.
const CONTENT_FILES = [
  'lib/html-to-image.min.js',
  'src/icons.js',
  'src/store.js',
  'src/overlay.js',
  'src/chrome.js',
  'src/crop.js',
  'src/editor.js',
  'src/capture.js',
  'src/flow.js',
  'src/bootstrap.js'
];

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
function setStatus(t) { statusEl.textContent = t; }

async function refresh() {
  try {
    const tab = await activeTab();
    if (!tab?.id) return;
    const res = await chrome.tabs.sendMessage(tab.id, { type: MSG.status }).catch(() => null);
    if (res?.active) {
      btnStart.style.display = 'none';
      btnStop.style.display = 'block';
      setStatus(`Fluxo ativo — ${res.boxes} borda(s), ${res.arrows} seta(s).`);
    } else {
      btnStart.style.display = 'block';
      btnStop.style.display = 'none';
    }
  } catch (e) { /* sem content ainda */ }
}

btnStart.addEventListener('click', async () => {
  const tab = await activeTab();
  if (!tab?.id) return setStatus('Nenhuma aba ativa.');
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: CONTENT_FILES }).catch(() => {});
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['fonts/mdi.css', 'content.css'] }).catch(() => {});
  } catch (e) {}
  const res = await chrome.tabs.sendMessage(tab.id, { type: MSG.start }).catch((e) => ({ ok: false, error: String(e) }));
  if (res?.ok) { setStatus('Fluxo iniciado! Volte para a página e marque.'); window.close(); }
  else setStatus('Não consegui iniciar aqui (página chrome:// ou PDF?). Abra um site http/https.');
});

btnStop.addEventListener('click', async () => {
  const tab = await activeTab();
  await chrome.tabs.sendMessage(tab.id, { type: MSG.stop }).catch(() => {});
  setStatus('Fluxo parado.');
  refresh();
});

refresh();
