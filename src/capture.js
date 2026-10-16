// PSA Model de captura — ELE sabe onde estão os pixels (Controller só pergunta).
// UM pipeline só, igual ao arrastar-e-selecionar (que já funciona):
// 1 clique de captureVisibleTab + canvas + download. A tela inteira só pula
// a seleção manual — sem scroll, sem costura, sem estourar a cota do Chrome.
window.PSA = window.PSA || {};

window.PSA.CaptureService = class {
  async viewportShot(retries = 3) {
    try {
      const answer = await chrome.runtime.sendMessage({ type: 'PSA_SHOT', options: {} });
      if (!answer?.ok) throw new Error(answer?.error || 'capture failed');
      return answer.dataUrl;
    } catch (error) {
      // Chrome cota capturas/segundo (MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND):
      // espera e tenta de novo em vez de abortar a página inteira.
      if (retries > 0 && /quota|capture_visible_tab/i.test(String(error?.message || error))) {
        await this.wait(1500);
        return this.viewportShot(retries - 1);
      }
      throw error;
    }
  }
  loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });
  }
  wait(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }

  // Área (manual ou automática da tela inteira): viewport + crop + download.
  async area(viewportRect) {
    const shotUrl = await this.viewportShot();
    const shot = await this.loadImage(shotUrl);
    const pixelRatio = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewportRect.width * pixelRatio);
    canvas.height = Math.round(viewportRect.height * pixelRatio);
    canvas.getContext('2d').drawImage(
      shot,
      viewportRect.x * pixelRatio, viewportRect.y * pixelRatio,
      viewportRect.width * pixelRatio, viewportRect.height * pixelRatio,
      0, 0, canvas.width, canvas.height
    );
    return canvas.toDataURL('image/png');
  }

  // dataURL -> Blob com fallback manual (fetch(data:) pode ser barrado por CSP).
  async dataUrlToBlob(dataUrl) {
    try {
      const viaFetch = await (await fetch(dataUrl)).blob();
      if (viaFetch && viaFetch.size > 0) return viaFetch;
    } catch (error) { /* tenta decodificação manual */ }
    const comma = dataUrl.indexOf(',');
    const head = dataUrl.slice(0, comma);
    const base64 = dataUrl.slice(comma + 1);
    const mime = (head.match(/data:(.*?);/) || [])[1] || 'image/png';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  // Download via Blob + object URL: dataURL gigante (página inteira) falha
  // silencioso no clique do <a>. Prática de mercado (GoFullPage/FireShot).
  async download(dataUrl, fileName) {
    const blob = await this.dataUrlToBlob(dataUrl);
    if (!blob || blob.size === 0) throw new Error('imagem vazia (0 bytes)');
    const objectUrl = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.documentElement.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    }
  }
};
