# Stroller Tag Studio

Customize a family stroller tag with a last name, fonts, dimensions, thickness, colors, and ear cutouts. The default name is **Smith**. Preview in 3D, then download a color-grouped 3MF or a merged STL for your slicer.

## Features

- Original tag silhouette and strap slots
- Handwritten, playful, and serif lettering
- Adjustable width, height, base thickness, and raised layers
- Sparkles, stars, hearts, circles, diamonds, or a custom SVG silhouette
- Local browser processing: names and uploaded patterns are not sent to a server
- Original design size: 315.76 × 131.48 mm, with 11.00 mm total depth

## Run locally

Requires Node.js 22 or newer.

```sh
cd app
npm ci
npm run build
npm test
npm start
```

Open http://127.0.0.1:4173.

## Publish changes

`npm run build` in `app/` refreshes both `app/dist/` and the root `docs/` folder. GitHub Pages serves `docs/` from the repository's default branch. Commit both generated folders with the source changes.

## Printing and model provenance

The corrected Crall family reference supplied by the creator establishes the dimensions, outline, strap slots, sparkle cutouts, and fixed text. The original 3MF is not included. Generated geometry uses straight extrusions; source bevels and painted triangle metadata are not reproduced. See [implementation and print notes](app/README.md).

STL files contain one closed solid; 3MF files contain aligned color groups. Set printer, filament, and process settings in your slicer. Check bed fit and small features in the sliced preview. These generated models have not been physically test-printed.

Bundled fonts retain their SIL Open Font License notices. Third-party libraries retain their respective licenses. No additional license is granted for the project or reference design.
