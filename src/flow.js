// PSA Controller — fino (Rails way): recebe evento, chama o Model, pede à View.
// Sem pixel aqui. Sem else. Early returns.
window.PSA = window.PSA || {};

window.PSA.FlowController = class {
  constructor() {
    this.store = new window.PSA.MarkStore();
    this.overlay = new window.PSA.OverlayView();
    this.overlay.menuTap = (index) => this.openBoxEditor(index);
    this.overlay.deleteTap = (index) => this.deleteBox(index);
    this.editor = new window.PSA.BoxEditorView();
    this.suppressClickUntil = 0;
    this.capture = new window.PSA.CaptureService();
    this.crop = new window.PSA.CropView();
    this.chrome = new window.PSA.ChromeView({
      onPrint: () => this.chrome.askCaptureMode(this.store.summary()),
      onUndo: () => this.handleUndo(),
      onClear: () => this.handleClear(),
      onCancel: () => this.stop(),
      onColor: (color) => this.handleColor(color),
      onFullPage: () => this.handleFullPage(),
      onDelay: () => this.handleDelayed(),
      onArea: () => this.handleArea(),
    });
    this.running = false;
    this.hovered = null;
    this.pressStart = null;
    this.pressMoved = false;
    this.previewLine = null;
    this.cropping = false;
    this.pinned = [];
    this.pinTimer = null;
    this.pinOrder = [];
  }

  start() {
    if (this.running) return true;
    this.running = true;
    document.body.classList.add('psa-armed');
    this.chrome.showFloating();
    this.repaint();
    window.addEventListener('mouseover', this.onHover, true);
    window.addEventListener('mousedown', this.onPress, true);
    window.addEventListener('mousemove', this.onDrag, true);
    window.addEventListener('mouseup', this.onRelease, true);
    window.addEventListener('click', this.onConfirm, true);
    window.addEventListener('keydown', this.onKey, true);
    window.addEventListener('mousemove', this.onTrack, true);
    return true;
  }
  stop() {
    if (!this.running) return;
    this.running = false;
    this.cropping = false;
    this.pressStart = null;
    this.pressMoved = false;
    this.previewLine = null;
    this.clearHover();
    this.store.clearAll();
    document.body.classList.remove('psa-armed');
    window.removeEventListener('mouseover', this.onHover, true);
    window.removeEventListener('mousedown', this.onPress, true);
    window.removeEventListener('mousemove', this.onDrag, true);
    window.removeEventListener('mouseup', this.onRelease, true);
    window.removeEventListener('click', this.onConfirm, true);
    window.removeEventListener('keydown', this.onKey, true);
    window.removeEventListener('mousemove', this.onTrack, true);
    this.overlay.destroy();
    this.chrome.destroy();
    this.editor.close();
    this.crop.close();
    this.unpinAll();
    document.documentElement.classList.remove('psa-capturing');
  }
  repaint() {
    this.overlay.hideHoverMirror();
    this.overlay.render(this.store);
    this.chrome.refreshCounter(this.store.summary());
  }
  handleUndo() {
    const removed = this.store.undoLast();
    if (removed && removed.width !== undefined) this.unpinBox(removed);
    this.repaint();
  }
  handleClear() { this.store.clearAll(); this.unpinAll(); this.repaint(); }
  handleColor(color) {
    this.store.setColor(color);
    this.chrome.setActiveSwatch(this.store.currentColor);
  }

  onHover = (event) => {
    if (!this.running || this.cropping || this.pressStart) return;
    this.setHovered(event.target);
  };
  // Igual ao Inspetor: o alvo é o elemento de cima no ponto do mouse,
  // seguindo em tempo real antes mesmo do clique.
  setHovered(element) {
    if (!element || this.chrome.isOwnInterface(element)) return;
    if (element === document.documentElement || element === document.body) return;
    if (this.hovered === element) return;
    // Alvo degenerado: mantém o atual em vez de trocar por um invisível.
    const rect = element.getBoundingClientRect();
    if ((rect.width < 2 || rect.height < 2) && this.hovered) return;
    this.clearHover();
    this.hovered = element;
    this.overlay.showHoverMirror(element, this.store.currentColor, window.PSA.MarkStore.DEFAULT_PAD);
  };
  clearHover() {
    this.hovered = null;
    this.overlay.hideHoverMirror();
    this.overlay.hideTag();
  }
  // Rastreador estilo Inspetor: resolve o elemento no ponto do mouse,
  // mantém a borda e move a etiqueta. Com o mouse em cima, a borda fica lá.
  onTrack = (event) => {
    if (!this.running || this.cropping || this.pressStart) return;
    const under = event?.clientX !== undefined
      ? document.elementFromPoint(event.clientX, event.clientY)
      : null;
    if (under) this.setHovered(under);
    if (!this.hovered || !this.hovered.isConnected) return;
    if (!document.getElementById('psa-hover-mirror')) {
      this.overlay.showHoverMirror(this.hovered, this.store.currentColor, window.PSA.MarkStore.DEFAULT_PAD);
    }
    if (event?.clientX !== undefined) this.overlay.showTag(event.clientX, event.clientY, this.hovered);
  };

  onPress = (event) => {
    if (!this.running || this.cropping || event.button !== 0) return;
    if (this.chrome.isOwnInterface(event.target)) return;
    if (this.editor.isOpen()) {
      this.closeBoxEditor(true);
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.pressStart = { x: event.pageX, y: event.pageY };
    this.pressMoved = false;
  };
  onDrag = (event) => {
    if (!this.running || !this.pressStart || this.cropping) return;
    const moved = Math.hypot(event.pageX - this.pressStart.x, event.pageY - this.pressStart.y);
    if (moved <= 6) return;
    this.pressMoved = true;
    this.clearHover();
    this.previewLine?.remove();
    this.previewLine = this.overlay.previewArrow(this.pressStart, { x: event.pageX, y: event.pageY }, this.store.currentColor);
  };
  onRelease = (event) => {
    if (!this.running || !this.pressStart || this.cropping) return;
    if (event.button !== 0) return void (this.pressStart = null);
    if (!this.pressMoved) return void (this.pressStart = null);
    this.store.addArrow(this.pressStart, { x: event.pageX, y: event.pageY });
    this.previewLine?.remove();
    this.previewLine = null;
    this.pressStart = null;
    this.repaint();
  };
  onConfirm = (event) => {
    if (!this.running || this.cropping) return;
    if (this.chrome.isOwnInterface(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    if (Date.now() < this.suppressClickUntil) return;
    if (this.pressMoved) return;
    this.pressStart = null;
    const saved = this.store.addBox(event.target.getBoundingClientRect(), this.overlay.elementRadius(event.target));
    if (saved) {
      this.pinElement(event.target);
      this.repaint();
      // Mouse parado em cima: devolve o espelho logo após salvar.
      this.hovered = event.target;
      this.overlay.hideTag();
      this.overlay.showHoverMirror(event.target, this.store.currentColor, window.PSA.MarkStore.DEFAULT_PAD);
    }
  };
  onKey = (event) => {
    if (!this.running) return;
    if (event.key === 'Escape' && this.editor.isOpen()) return this.closeBoxEditor();
    if (event.key === 'Escape' && this.cropping) return this.cancelCrop();
    if (event.key === 'Escape') return this.chrome.closeModal();
    const wantsUndo = (event.key === 'z' || event.key === 'Z') && (event.ctrlKey || event.metaKey);
    if (!wantsUndo) return;
    event.preventDefault();
    this.handleUndo();
  };

  openBoxEditor(index) {
    const box = this.store.savedBoxes[index];
    if (!box) return;
    this.clearHover();
    const frame = this.overlay.expandedBox(box);
    const anchor = {
      x: frame.x - window.scrollX,
      y: frame.y - window.scrollY,
      width: frame.width,
      height: frame.height,
    };
    this.editor.open(box, anchor, {
      onColor: (color) => this.patchOpenBox(index, { color }),
      onStep: (kind, delta) => this.stepOpenBox(index, kind, delta),
      onClose: () => {},
    });
  }
  patchOpenBox(index, patch) {
    const box = this.store.patchBox(index, patch);
    if (!box) return this.closeBoxEditor();
    this.repaint();
    this.editor.refresh(box);
  }
  stepOpenBox(index, kind, delta) {
    const box = this.store.savedBoxes[index];
    if (!box) return this.closeBoxEditor();
    const next = kind === 'pad' ? (box.pad || 0) + delta : (box.lineWidth || 3) + delta;
    this.patchOpenBox(index, { [kind]: next });
  }
  closeBoxEditor(suppressNextClick) {
    this.editor.close();
    if (suppressNextClick) this.suppressClickUntil = Date.now() + 400;
  }
  // Hover infinito sem print: fixa o mouseover no marcado (e em tudo dentro),
  // rearma a cada mouseout + pulso periódico. Vale p/ menus via JS.
  pinElement(element) {
    if (!element?.dispatchEvent) return;
    this.overlay.keepOpen(element);
    if (!this.pinned.includes(element)) this.pinned.push(element);
    this.pinOrder.push(element);
    if (!this.pinTimer) {
      window.addEventListener('mouseout', this.onPinnedOut, true);
      this.pinTimer = setInterval(() => this.pulsePinned(), 2500);
    }
  }
  pulsePinned() {
    this.pinned = this.pinned.filter((node) => node.isConnected);
    if (this.pinned.length === 0) return this.unpinAll();
    for (const node of this.pinned) this.overlay.touchHover(node);
  }
  onPinnedOut = (event) => {
    const root = this.pinned.find((node) => node === event.target || node.contains(event.target));
    if (!root) return;
    if (event.relatedTarget && root.contains(event.relatedTarget)) return;
    setTimeout(() => { if (this.running) this.overlay.touchHover(root); }, 0);
  };
  unpinBox(box) {
    const element = this.pinOrder.pop();
    if (!element) return;
    if (this.pinOrder.includes(element)) return;
    this.pinned = this.pinned.filter((node) => node !== element);
    if (this.pinned.length === 0) this.unpinAll();
  }
  deleteBox(index) {
    const removed = this.store.removeBox(index);
    if (!removed) return;
    const [element] = this.pinOrder.splice(index, 1);
    if (element && !this.pinOrder.includes(element)) {
      this.pinned = this.pinned.filter((node) => node !== element);
      if (this.pinned.length === 0) this.unpinAll();
    }
    this.editor.close();
    this.repaint();
  }
  unpinAll() {
    if (this.pinTimer) clearInterval(this.pinTimer);
    this.pinTimer = null;
    window.removeEventListener('mouseout', this.onPinnedOut, true);
    this.pinned = [];
    this.pinOrder = [];
  }
  async handleFullPage() {
    this.chrome.closeModal();
    this.cropping = true;
    this.clearHover();
    this.chrome.setHiddenForCapture(true);
    // Mesma função do arrastar-e-selecionar: retângulo automático
    // do topo superior esquerdo (0,0) até o inferior direito da tela.
    this.finishArea(
      { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
      'full'
    );
  }
  async handleDelayed() {
    this.chrome.closeModal();
    this.cropping = true;
    this.clearHover();
    this.chrome.setHiddenForCapture(true);
    for (let left = 5; left >= 1; left--) {
      this.chrome.showCountdown(left);
      await this.capture.wait(1000);
    }
    this.chrome.hideCountdown();
    // Mesma função do área/tela: rect automático da viewport toda.
    this.finishArea(
      { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
      'full'
    );
  }
  handleArea() {
    this.chrome.closeModal();
    this.cropping = true;
    this.clearHover();
    this.chrome.setHiddenForCapture(true);
    this.crop.open(
      (rect) => this.finishArea(rect),
      () => this.cancelCrop()
    );
  }
  async finishArea(rect, prefix = 'area') {
    this.chrome.showProgress('Recortando área…');
    await this.capture.wait(200);
    try {
      const image = await this.capture.area(rect);
      await this.capture.download(image, `print-agile-${prefix}-${Date.now()}.png`);
    } catch (error) {
      this.cancelCrop();
      this.chrome.showError('Não consegui capturar', error.message);
      return;
    }
    this.stop();
  }
  cancelCrop() {
    this.cropping = false;
    this.crop.close();
    this.chrome.setHiddenForCapture(false);
  }
};
