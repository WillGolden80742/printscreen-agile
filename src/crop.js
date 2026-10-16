// PSA View — seleção de área (padrão Lightshot/Awesome Screenshot).
// Só UI + rect; pixels ficam no CaptureService (Tell, Don't Ask).
window.PSA = window.PSA || {};

window.PSA.CropView = class {
  normalizeRect(anchor, event) {
    return {
      x: Math.min(event.clientX, anchor.x),
      y: Math.min(event.clientY, anchor.y),
      width: Math.abs(event.clientX - anchor.x),
      height: Math.abs(event.clientY - anchor.y),
    };
  }
  open(onSelected, onCancelled) {
    this.close();
    const dim = document.createElement('div');
    dim.id = 'psa-crop-layer';
    const box = document.createElement('div');
    box.id = 'psa-crop-rect';
    box.style.display = 'none';
    const tag = document.createElement('div');
    tag.id = 'psa-crop-label';
    tag.textContent = 'Arraste para selecionar · Esc cancela';
    document.documentElement.append(dim, box, tag);
    let anchor = null;
    dim.onmousedown = (event) => {
      if (event.button !== 0) return;
      anchor = { x: event.clientX, y: event.clientY };
      box.classList.add('psa-dragging');
      document.documentElement.classList.add('psa-cropping-drag');
      event.preventDefault();
    };
    dim.onmousemove = (event) => {
      tag.style.left = event.clientX + 14 + 'px';
      tag.style.top = event.clientY + 14 + 'px';
      if (!anchor) return;
      const rect = this.normalizeRect(anchor, event);
      Object.assign(box.style, { display: 'block', left: rect.x + 'px', top: rect.y + 'px', width: rect.width + 'px', height: rect.height + 'px' });
      tag.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    };
    dim.onmouseup = (event) => {
      if (!anchor) return;
      const rect = this.normalizeRect(anchor, event);
      this.close();
      if (rect.width < 10 || rect.height < 10) return onCancelled();
      onSelected(rect);
    };
  }
  close() {
    document.getElementById('psa-crop-layer')?.remove();
    document.getElementById('psa-crop-rect')?.remove();
    document.getElementById('psa-crop-label')?.remove();
    document.documentElement.classList.remove('psa-cropping-drag');
  }
};
