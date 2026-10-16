// PSA View — editor da borda (menu M3 ancorado no ⋮ de cada marcação).
// Só UI; os dados moram no MarkStore (callbacks devolvem intenção ao Controller).
window.PSA = window.PSA || {};

window.PSA.BoxEditorView = class {
  isOpen() { return !!document.getElementById('psa-editor'); }

  open(box, viewportFrame, callbacks) {
    this.close();
    this.callbacks = callbacks;
    const root = document.createElement('div');
    root.id = 'psa-editor';
    const swatches = window.PSA.MarkStore.PALETTE.map((option) =>
      `<button class="psa-swatch" data-color="${option.value}" title="${option.name}" style="--swatch:${option.value}"></button>`
    ).join('');
    root.innerHTML = `
      <div class="psa-ed-head"><span>Borda</span>
        <button class="psa-ed-close" title="Fechar">${window.PSA.mdi('close', 18)}</button>
      </div>
      <div class="psa-ed-label">Cor</div>
      <div class="psa-ed-swatches">${swatches}</div>
      <div class="psa-ed-label">Largura</div>
      <div class="psa-ed-row" data-kind="lineWidth">
        <div class="psa-ed-stepper">
          <button data-step="-1" title="Afinar">${window.PSA.mdi('minus', 18)}</button>
          <span class="psa-ed-value" data-value></span>
          <button data-step="1" title="Engrossar">${window.PSA.mdi('plus', 18)}</button>
        </div>
      </div>
      <div class="psa-ed-label">Respiro</div>
      <div class="psa-ed-row" data-kind="pad">
        <div class="psa-ed-stepper">
          <button data-step="-2" title="Encolher">${window.PSA.mdi('minus', 18)}</button>
          <span class="psa-ed-value" data-value></span>
          <button data-step="2" title="Expandir">${window.PSA.mdi('plus', 18)}</button>
        </div>
      </div>`;
    document.documentElement.appendChild(root);
    this.place(root, viewportFrame);
    root.querySelector('.psa-ed-close').onclick = (event) => {
      event.stopPropagation();
      this.close();
      this.callbacks.onClose();
    };
    root.querySelectorAll('.psa-swatch').forEach((swatch) => {
      swatch.onclick = (event) => {
        event.stopPropagation();
        this.callbacks.onColor(swatch.dataset.color);
      };
    });
    root.querySelectorAll('.psa-ed-row').forEach((row) => {
      const kind = row.dataset.kind;
      row.querySelectorAll('button').forEach((button) => {
        button.onclick = (event) => {
          event.stopPropagation();
          this.callbacks.onStep(kind, Number(button.dataset.step));
        };
      });
    });
    this.outside = (event) => {
      if (event.target.closest?.('#psa-editor,.psa-box-menu')) return;
      this.close();
      this.callbacks.onClose();
    };
    window.addEventListener('mousedown', this.outside, true);
    this.refresh(box);
  }

  place(root, frame) {
    const width = 232;
    let left = frame.x + frame.width + 8;
    if (left + width > window.innerWidth - 8) left = frame.x - width - 8;
    if (left < 8) left = 8;
    root.style.left = left + 'px';
    root.style.top = '8px';
    root.style.visibility = 'hidden';
    const height = root.offsetHeight || 280;
    let top = frame.y - 8;
    top = Math.max(8, Math.min(top, window.innerHeight - height - 8));
    root.style.top = top + 'px';
    root.style.visibility = 'visible';
  }

  refresh(box) {
    const root = document.getElementById('psa-editor');
    if (!root || !box) return;
    root.querySelectorAll('.psa-swatch').forEach((swatch) => {
      swatch.classList.toggle('psa-swatch-on', swatch.dataset.color === box.color);
    });
    root.querySelector('[data-kind="lineWidth"] [data-value]').textContent = `${box.lineWidth || 3}px`;
    const pad = box.pad || 0;
    root.querySelector('[data-kind="pad"] [data-value]').textContent = `${pad > 0 ? '+' : ''}${pad}px`;
  }

  close() {
    document.getElementById('psa-editor')?.remove();
    if (this.outside) window.removeEventListener('mousedown', this.outside, true);
    this.outside = null;
  }
};
