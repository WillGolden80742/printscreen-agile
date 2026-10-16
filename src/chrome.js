// PSA View — flutuante, modal final e crop (só UI; captura mora no CaptureService).
// Ícones: MDI vendorizado via window.PSA.mdi() (sem emoji, sem CDN).
window.PSA = window.PSA || {};

window.PSA.ChromeView = class {
  constructor(callbacks) {
    this.callbacks = callbacks;
  }
  icon(name, size) { return window.PSA.mdi(name, size); }
  isOwnInterface(node) {
    return !!node?.closest?.('#psa-layer,#psa-float,#psa-backdrop,#psa-editor,#psa-progress,#psa-countdown,#psa-tag,#psa-crop-layer,#psa-crop-rect,#psa-crop-label');
  }
  showFloating() {
    if (document.getElementById('psa-float')) return;
    const root = document.createElement('div');
    root.id = 'psa-float';
    const swatches = window.PSA.MarkStore.PALETTE.map((option) =>
      `<button class="psa-swatch" data-color="${option.value}" title="${option.name}" style="--swatch:${option.value}"></button>`
    ).join('');
    root.innerHTML = `
      <div id="psa-hint">Passe o mouse → borda colorida<br>Clique salva · Arraste cria seta</div>
      <div id="psa-toolbar">
        <span id="psa-count"></span>
        <span id="psa-colors">${swatches}</span>
        <button id="psa-undo" title="Desfazer último">${this.icon('undo', 16)} Desfazer</button>
        <button id="psa-clear" title="Limpar tudo">${this.icon('delete', 16)}</button>
        <button id="psa-cancel" title="Cancelar fluxo">${this.icon('close', 16)}</button>
      </div>
      <div id="psa-float-btn" title="Finalizar e capturar">${this.icon('camera', 28)}</div>`;
    document.documentElement.appendChild(root);
    this.refreshCounter({ boxes: 0, arrows: 0 });
    this.setActiveSwatch(window.PSA.MarkStore.PALETTE[0].value);
    root.querySelectorAll('.psa-swatch').forEach((swatch) => {
      swatch.onclick = (event) => {
        event.stopPropagation();
        this.callbacks.onColor(swatch.dataset.color);
      };
    });
    document.getElementById('psa-float-btn').onclick = (event) => this.callbacks.onPrint(event);
    document.getElementById('psa-undo').onclick = (event) => this.callbacks.onUndo(event);
    document.getElementById('psa-clear').onclick = (event) => this.callbacks.onClear(event);
    document.getElementById('psa-cancel').onclick = (event) => this.callbacks.onCancel(event);
  }
  refreshCounter(summary) {
    const counter = document.getElementById('psa-count');
    if (!counter) return;
    counter.innerHTML = `${this.icon('squareOutline', 14)} ${summary.boxes} ${this.icon('arrowTopRight', 14)} ${summary.arrows}`;
  }
  setActiveSwatch(color) {
    document.querySelectorAll('.psa-swatch').forEach((swatch) => {
      swatch.classList.toggle('psa-swatch-on', swatch.dataset.color === color);
    });
  }
  setHiddenForCapture(hidden) {
    document.documentElement.classList.toggle('psa-capturing', hidden);
    document.getElementById('psa-float')?.classList.toggle('psa-hidden-capture', hidden);
    const mirror = document.getElementById('psa-hover-mirror');
    if (mirror) mirror.style.display = hidden ? 'none' : 'block';
  }
  askCaptureMode(summary) {
    this.closeModal();
    const backdrop = document.createElement('div');
    backdrop.id = 'psa-backdrop';
    backdrop.innerHTML = `
      <div id="psa-modal">
        <h2>${this.icon('camera', 22)} Finalizar print</h2>
        <p>${summary.boxes} borda(s) · ${summary.arrows} seta(s).<br>Como quer capturar?</p>
        <button id="psa-btn-full">${this.icon('monitor', 18)} Página inteira</button>
        <button id="psa-btn-delay">${this.icon('timer', 18)} Tela em 5s</button>
        <button id="psa-btn-area">${this.icon('selectionDrag', 18)} Arrastar e selecionar</button>
        <button id="psa-btn-cancel">Voltar a marcar</button>
      </div>`;
    document.documentElement.appendChild(backdrop);
    backdrop.addEventListener('click', (event) => {
      if (event.target.id === 'psa-backdrop') this.closeModal();
    });
    document.getElementById('psa-btn-full').onclick = () => this.callbacks.onFullPage();
    document.getElementById('psa-btn-delay').onclick = () => this.callbacks.onDelay();
    document.getElementById('psa-btn-area').onclick = () => this.callbacks.onArea();
    document.getElementById('psa-btn-cancel').onclick = () => this.closeModal();
  }
  closeModal() { document.getElementById('psa-backdrop')?.remove(); }
  showProgress(text) {
    this.hideProgress();
    const bar = document.createElement('div');
    bar.id = 'psa-progress';
    bar.innerHTML = `<span class="psa-spin"></span><span></span>`;
    bar.lastChild.textContent = text;
    document.documentElement.appendChild(bar);
  }
  hideProgress() { document.getElementById('psa-progress')?.remove(); }
  showCountdown(left, label) {
    let dial = document.getElementById('psa-countdown');
    if (!dial) {
      dial = document.createElement('div');
      dial.id = 'psa-countdown';
      dial.innerHTML = `<span class="psa-cd-num"></span><span class="psa-cd-label"></span>`;
      document.documentElement.appendChild(dial);
    }
    dial.querySelector('.psa-cd-num').textContent = left;
    dial.querySelector('.psa-cd-label').textContent = label || 'abra o menu…';
  }
  hideCountdown() { document.getElementById('psa-countdown')?.remove(); }
  showError(title, message) {
    this.hideProgress();
    this.closeModal();
    const backdrop = document.createElement('div');
    backdrop.id = 'psa-backdrop';
    backdrop.innerHTML = `
      <div id="psa-modal">
        <h2>${this.icon('close', 22)} ${title}</h2>
        <p class="psa-err"></p>
        <button id="psa-btn-cancel">Fechar</button>
      </div>`;
    backdrop.querySelector('.psa-err').textContent = message;
    document.documentElement.appendChild(backdrop);
    backdrop.addEventListener('click', (event) => {
      if (event.target.id === 'psa-backdrop') this.closeModal();
    });
    backdrop.querySelector('#psa-btn-cancel').onclick = () => this.closeModal();
  }
  destroy() {
    document.getElementById('psa-float')?.remove();
    this.hideProgress();
    this.hideCountdown();
    this.closeModal();
  }
};
