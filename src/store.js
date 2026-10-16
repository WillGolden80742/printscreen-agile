// PSA Model — dono dos dados (Rails way: Controller nunca toca em array solto).
// Tell, Don't Ask: a View/Controller pede, o Store decide.
window.PSA = window.PSA || {};

window.PSA.MarkStore = class {
  constructor() {
    this.savedBoxes = [];
    this.savedArrows = [];
    this.currentColor = '#FF0000';
  }
  static get DEFAULT_PAD() { return 6; }
  static get PALETTE() {
    return [
      { name: 'Vermelho', value: '#FF0000' },
      { name: 'Azul', value: '#2563EB' },
      { name: 'Verde', value: '#16A34A' },
      { name: 'Amarelo', value: '#EAB308' },
      { name: 'Roxo', value: '#9333EA' },
      { name: 'Preto', value: '#000000' },
    ];
  }
  setColor(color) {
    const known = this.constructor.PALETTE.some((option) => option.value === color);
    if (known) this.currentColor = color;
  }
  addBox(rect, radius) {
    if (rect.width < 2 && rect.height < 2) return false;
    this.savedBoxes.push({
      x: Math.round(rect.left + window.scrollX),
      y: Math.round(rect.top + window.scrollY),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      radius: radius || '0px',
      color: this.currentColor,
      lineWidth: 3,
      pad: this.constructor.DEFAULT_PAD,
    });
    return true;
  }
  patchBox(index, patch) {
    const box = this.savedBoxes[index];
    if (!box) return null;
    if (patch.color) this.setBoxColor(box, patch.color);
    if (patch.lineWidth !== undefined) box.lineWidth = Math.min(12, Math.max(1, Math.round(patch.lineWidth)));
    if (patch.pad !== undefined) box.pad = Math.min(60, Math.max(-20, Math.round(patch.pad)));
    return box;
  }
  removeBox(index) {
    if (index < 0 || index >= this.savedBoxes.length) return null;
    return this.savedBoxes.splice(index, 1)[0];
  }
  setBoxColor(box, color) {
    const known = this.constructor.PALETTE.some((option) => option.value === color);
    if (known) box.color = color;
  }
  addArrow(start, end) {
    if (Math.hypot(end.x - start.x, end.y - start.y) < 6) return false;
    this.savedArrows.push({ x1: Math.round(start.x), y1: Math.round(start.y), x2: Math.round(end.x), y2: Math.round(end.y), color: this.currentColor });
    return true;
  }
  undoLast() {
    if (this.savedArrows.length > 0) return this.savedArrows.pop();
    if (this.savedBoxes.length > 0) return this.savedBoxes.pop();
    return null;
  }
  clearAll() {
    this.savedBoxes = [];
    this.savedArrows = [];
  }
  isEmpty() { return this.savedBoxes.length === 0 && this.savedArrows.length === 0; }
  summary() { return { boxes: this.savedBoxes.length, arrows: this.savedArrows.length }; }
};
