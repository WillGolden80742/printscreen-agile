// Ícones MDI oficiais via webfont vendorizada (@mdi/font, Apache-2.0).
// fonts/mdi.css + woff2 locais (sem CDN em runtime, exigência MV3).
// Uso: <span class="mdi mdi-camera"></span> — helper abaixo gera com tamanho.
window.PSA = window.PSA || {};

window.PSA.MDI_NAMES = {
  camera: 'camera',
  play: 'play',
  stop: 'stop',
  undo: 'undo',
  delete: 'delete',
  close: 'close',
  monitor: 'monitor',
  selectionDrag: 'selection-drag',
  squareOutline: 'square-outline',
  arrowTopRight: 'arrow-top-right',
  dotsVertical: 'dots-vertical',
  minus: 'minus',
  plus: 'plus',
  timer: 'timer',
};

window.PSA.mdi = function (name, size) {
  const icon = window.PSA.MDI_NAMES[name] || name;
  const dimension = size || 18;
  return `<span class="psa-mdi mdi mdi-${icon}" style="font-size:${dimension}px" aria-hidden="true"></span>`;
};
