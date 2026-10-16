// PSA View — só apresentação (não decide regra, não captura pixel).
// Usa <marker> nativo do SVG para a ponta da seta (padrão de mercado, sem reinventar geometria).
window.PSA = window.PSA || {};

window.PSA.OverlayView = class {
  menuTap = null;
  deleteTap = null;
  ensureLayer() {
    let layer = document.getElementById('psa-layer');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'psa-layer';
    layer.innerHTML = `<svg id="psa-arrows" xmlns="http://www.w3.org/2000/svg"><defs id="psa-heads"></defs></svg>`;
    document.documentElement.appendChild(layer);
    return layer;
  }
  // Uma ponta de seta (<marker>) por cor — padrão SVG, sem geometria manual.
  markerFor(color) {
    const safeId = 'psa-head-' + color.replace('#', '');
    if (document.getElementById(safeId)) return `url(#${safeId})`;
    const defs = document.getElementById('psa-heads');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.id = safeId;
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth');
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    head.setAttribute('d', 'M0,0 L8,3 L0,6 Z');
    head.setAttribute('fill', color);
    marker.appendChild(head);
    defs.appendChild(marker);
    return `url(#${safeId})`;
  }
  fitToDocument() {
    const layer = document.getElementById('psa-layer');
    if (!layer) return;
    const fullHeight = Math.max(document.body?.scrollHeight || 0, document.documentElement.scrollHeight, window.innerHeight);
    layer.style.height = fullHeight + 'px';
    const svg = document.getElementById('psa-arrows');
    svg.setAttribute('height', fullHeight);
    svg.setAttribute('width', document.documentElement.scrollWidth);
  }
  render(store) {
    this.ensureLayer();
    this.fitToDocument();
    document.querySelectorAll('.psa-box').forEach((node) => node.remove());
    document.querySelectorAll('.psa-box-actions').forEach((node) => node.remove());
    const layer = document.getElementById('psa-layer');
    const svg = document.getElementById('psa-arrows');
    svg.querySelectorAll('line').forEach((node) => node.remove());
    for (const box of store.savedBoxes) this.paintBox(layer, box);
    for (const arrow of store.savedArrows) this.paintArrow(svg, arrow, false);
    store.savedBoxes.forEach((box, index) => this.paintHandle(layer, box, index));
  }
  expandedBox(box) {
    const pad = box.pad || 0;
    return this.frameInBounds({ x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 });
  }
  // Trava qualquer moldura nos limites do documento (vale p/ salva e preview).
  frameInBounds(frame) {
    const docWidth = document.documentElement.scrollWidth;
    const docHeight = Math.max(document.body?.scrollHeight || 0, document.documentElement.scrollHeight);
    const x = Math.max(0, frame.x);
    const y = Math.max(0, frame.y);
    const width = Math.max(1, Math.min(frame.width, docWidth - x));
    const height = Math.max(1, Math.min(frame.height, docHeight - y));
    return { x, y, width, height };
  }
  offsetRadius(radius, pad) {
    if (!pad) return radius || '0px';
    return (radius || '0px').split(' ').map((part) => {
      const number = parseFloat(part);
      if (Number.isNaN(number)) return part;
      return Math.max(0, number + pad) + 'px';
    }).join(' ');
  }
  paintHandle(layer, box, index) {
    const frame = this.expandedBox(box);
    const wrap = document.createElement('div');
    wrap.className = 'psa-box-actions';
    // SEMPRE visível: trava nos 2 eixos (nunca acima de 0, nunca fora da tela).
    const unit = 28;
    const gap = 6;
    const total = unit * 2 + gap;
    const margin = 4;
    const left = Math.min(
      Math.max(frame.x + frame.width - total, window.scrollX + margin),
      window.scrollX + window.innerWidth - total - margin
    );
    const top = Math.min(
      Math.max(frame.y - 14, window.scrollY + margin),
      window.scrollY + window.innerHeight - unit - margin
    );
    wrap.style.left = Math.max(0, left) + 'px';
    wrap.style.top = Math.max(0, top) + 'px';
    const del = document.createElement('button');
    del.className = 'psa-box-menu psa-box-del';
    del.title = 'Apagar borda';
    del.innerHTML = window.PSA.mdi('delete', 18);
    del.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.deleteTap) this.deleteTap(index);
    });
    const menu = document.createElement('button');
    menu.className = 'psa-box-menu';
    menu.title = 'Editar borda';
    menu.innerHTML = window.PSA.mdi('dotsVertical', 18);
    menu.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.menuTap) this.menuTap(index);
    });
    wrap.appendChild(del);
    wrap.appendChild(menu);
    layer.appendChild(wrap);
  }
  paintBox(layer, box) {
    const frame = this.expandedBox(box);
    const node = document.createElement('div');
    node.className = 'psa-box';
    node.style.left = frame.x + 'px';
    node.style.top = frame.y + 'px';
    node.style.width = frame.width + 'px';
    node.style.height = frame.height + 'px';
    node.style.borderRadius = this.offsetRadius(box.radius, box.pad || 0);
    node.style.borderWidth = (box.lineWidth || 3) + 'px';
    node.style.borderColor = box.color || '#FF0000';
    layer.appendChild(node);
  }
  paintArrow(svg, arrow, isPreview) {
    const color = arrow.color || '#FF0000';
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', arrow.x1 ?? arrow.x ?? 0);
    line.setAttribute('y1', arrow.y1 ?? arrow.y ?? 0);
    line.setAttribute('x2', arrow.x2 ?? 0);
    line.setAttribute('y2', arrow.y2 ?? 0);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', isPreview ? '3' : '5');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('marker-end', this.markerFor(color));
    if (isPreview) line.setAttribute('stroke-dasharray', '8 4');
    svg.appendChild(line);
    return line;
  }
  previewArrow(start, end, color) {
    const svg = document.getElementById('psa-arrows');
    if (!svg) return null;
    return this.paintArrow(svg, { x1: start.x, y1: start.y, x2: end.x, y2: end.y, color }, true);
  }
  // Mantém menus dropdown abertos: dispara hover real no elemento marcado
  // (segura menus via JS; para CSS :hover puro use a captura com delay).
  keepOpen(element) {
    if (!element?.dispatchEvent) return;
    try {
      element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true, cancelable: true }));
      let node = element;
      for (let depth = 0; node && depth < 5; depth++) {
        node.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, composed: true, cancelable: true }));
        node = node.parentElement;
      }
      if (typeof element.focus === 'function') element.focus({ preventScroll: true });
    } catch (error) { /* site bloqueou o evento: segue o fluxo */ }
  }
  // Toque leve p/ o pulso contínuo: 1 evento borbulhante, sem focus, sem custo.
  touchHover(element) {
    if (!element?.dispatchEvent) return;
    try {
      element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true, cancelable: true }));
    } catch (error) { /* ignora */ }
  }
  // Etiqueta estilo Inspetor: tag · dimensões seguindo o cursor.
  describe(element) {
    const rect = element.getBoundingClientRect();
    let label = (element.tagName || '?').toLowerCase();
    if (element.id) label += '#' + element.id;
    const rawClass = typeof element.className === 'string' ? element.className : '';
    const firstClass = rawClass.trim().split(/\s+/)[0];
    if (firstClass) label += '.' + firstClass;
    return `${label} · ${Math.round(rect.width)}×${Math.round(rect.height)}`;
  }
  showTag(clientX, clientY, element) {
    let tag = document.getElementById('psa-tag');
    if (!tag) {
      tag = document.createElement('div');
      tag.id = 'psa-tag';
      document.documentElement.appendChild(tag);
    }
    tag.textContent = this.describe(element);
    tag.style.display = 'block';
    tag.style.left = Math.min(clientX + 14, window.innerWidth - 190) + 'px';
    tag.style.top = (clientY + 18) + 'px';
  }
  hideTag() {
    document.getElementById('psa-tag')?.remove();
  }
  // Espelho ÚNICO do hover: substitui o outline (sem borda dupla).
  // Copia o border-radius computado para seguir exatamente o contorno.
  elementRadius(element) {
    const computed = window.getComputedStyle(element);
    return [
      computed.borderTopLeftRadius,
      computed.borderTopRightRadius,
      computed.borderBottomRightRadius,
      computed.borderBottomLeftRadius,
    ].join(' ');
  }
  showHoverMirror(element, color, pad = 0) {
    this.ensureLayer();
    let mirror = document.getElementById('psa-hover-mirror');
    if (!mirror) {
      mirror = document.createElement('div');
      mirror.id = 'psa-hover-mirror';
      mirror.className = 'psa-hover-mirror';
      document.getElementById('psa-layer').appendChild(mirror);
    }
    const viewportRect = element.getBoundingClientRect();
    const radius = this.elementRadius(element);
    // Filho degenerado (0px): mantém o espelho atual em vez de sumir.
    if (viewportRect.width < 2 || viewportRect.height < 2) return;
    const frame = this.frameInBounds({
      x: viewportRect.left + window.scrollX - pad,
      y: viewportRect.top + window.scrollY - pad,
      width: viewportRect.width + pad * 2,
      height: viewportRect.height + pad * 2,
    });
    mirror.style.display = 'block';
    mirror.style.left = frame.x + 'px';
    mirror.style.top = frame.y + 'px';
    mirror.style.width = frame.width + 'px';
    mirror.style.height = frame.height + 'px';
    mirror.style.borderRadius = this.offsetRadius(radius, pad);
    mirror.style.borderColor = color || '#FF0000';
  }
  hideHoverMirror() {
    document.getElementById('psa-hover-mirror')?.remove();
  }
  destroy() {
    document.getElementById('psa-layer')?.remove();
    this.hideTag();
  }
};
