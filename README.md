# Printscreen Agile — Extensão (global, v1.1)

Fluxo em qualquer site: hover = borda vermelha → clique salva (N) → arraste = seta → o botão flutuante de câmera pergunta **página inteira** ou **arrastar e selecionar**.

## Bibliotecas de mercado (nada reinventado)
| Problema | Solução usada | Origem |
|---|---|---|
| Full-page 1 clique | `captureBeyondViewport: true` + `rect` no `captureVisibleTab` (Chrome 116+) | padrão **GoFullPage / FireShot** |
| Full-page fallback | scroll + stitch de `captureVisibleTab` | algoritmo consagrado das extensões open-source de screenshot |
| Full-page fallback 2 | **`html-to-image`** vendorizado em `lib/` (`toPng`, fork moderno do `dom-to-image`) | `html-to-image@1.11.11` via jsDelivr |
| Área | `captureVisibleTab` + crop em canvas com `devicePixelRatio` | padrão **Lightshot / Awesome Screenshot** |
| Ponta da seta | `<marker>` nativo do SVG | padrão SVG, sem matemática manual |

> MV3 proíbe código remoto: a lib está **vendorizada** em `lib/html-to-image.min.js`. Nada de CDN em runtime.

## Boas práticas aplicadas (skill `boas-praticas-de-codigo`)
- **MVC / Rails way:** `MarkStore` e `CaptureService` são os Models (donos dos dados e dos pixels). `FlowController` é fino — só orquestra evento → Model → View. Controller nunca toca em pixel direto.
- **Tell, Don't Ask:** `store.undoLast()`, `capture.fullPage()`, `crop.open(...)` decidem por si; ninguém lê array interno.
- **Calisthenics:** early returns (sem `else`), nomes completos (`savedBoxes`, `handleFullPage`), entidades pequenas (`store 35`, `bootstrap 15`, `background 19`, `crop 60` linhas), um ponto por linha onde coube.
- **DRY/CoC:** `normalizeRect` mora só no `CropView`; `wait/loadImage/download` só no `CaptureService`.

## Estrutura
```
manifest.json
popup.html/js/css
content.css
background.js
lib/html-to-image.min.js   (vendorizado)
src/store.js               (Model)
src/capture.js             (Model de pixels)
src/overlay.js             (View caixas+setas)
src/chrome.js              (View flutuante+modal)
src/crop.js                (View seleção de área)
src/flow.js                (Controller fino)
src/bootstrap.js           (wiring + mensagens)
```

## Instalar
1. `chrome://extensions` → modo desenvolvedor → **Carregar sem compactação** → pasta `PRINTSCREEN-AGILE`.
2. Fixe na barra. Use em qualquer `http/https` (não funciona em `chrome://`/WebStore/PDF nativo — limite do Chrome).

## Testar
1. Abra um site → extensão → **Iniciar fluxo**.
2. Marque 2 bordas + 1 seta → botão de câmera → **página inteira** → confira PNG.
3. Repita → **arrastar e selecionar**.
