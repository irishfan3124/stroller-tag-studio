# Stroller Tag Studio

Client-side family tag designer with an interactive Three.js preview, Manifold solid geometry, and 3MF / binary STL exports. Names and custom SVG shapes stay in the browser.

## Run

With Node.js installed:

```
npm install
npm run build
npm start
```

Open http://127.0.0.1:4173. `npm test` checks dimensions, connectedness, every edge's face incidence, and both export formats for ten representative designs.

## Model reference

The corrected **Crall Family Disney Stroller Sign.3mf**, not the MEGA version, is the source. Its uniform scale is 2.1652756753946427. The design-aligned dimensions (before plate rotation) are **315.76364232 × 131.48026624 × 10.99960026 mm**. The plate rotates the object approximately 45°. The base is 5.49980013 mm thick; the two raised layers are each 2.749900065 mm. Controls show dimensions rounded to 0.01 mm.

`dist/reference.json` contains cross sections extracted from that mesh. The exact outline, original sparkle holes, strap slots, CRALL letter silhouettes, and The / Family text are reused. Regenerated solids use straight extrusions of these contours; the source's bevels and triangle paint metadata are not reproduced. Alternative names use bundled open-license fonts. OpenType variable fonts are rendered at their default axes. The OFL license files accompany the fonts.

## Printing

3MF exports aligned separate parts with core base-material colors, within one assembly. Filament assignment and printer/process settings remain slicer tasks. STL exports a single Boolean-unioned watertight solid without colors. These files contain no G-code, printer settings, or user-source metadata. There has been no physical test print. Check fine features and rotated bed fit in the slicer; the original width exceeds a 256 mm bed edge before rotation.

Custom SVGs accept filled vector shapes only; scripts, linked content, images, text, and external styles are rejected. SVG uploads are limited to 100 KB / 10,000 sampled points. Cutouts that leave disconnected base islands are rejected. Review fine details before printing.

The site is static and can be served from `dist/` on any ordinary HTTP static host. The WASM file must be served as `application/wasm`. Rebuild after changing `src/`.
