---
title: Summit Patch Lab
description: Browser-based editor for Novation Summit patches.
---

# Summit Patch Lab

A browser-based editor for Novation Summit. Connect over Web MIDI to edit supported
controls, use the virtual keyboard, and transfer patch files.

## Start

```sh
npm install
npm run dev
```

Open the localhost address in Chrome or Edge.

## Publish

The GitHub Actions workflow deploys the app to GitHub Pages on pushes to `master`;
you can also run it manually from the Actions tab. In the repository settings,
set **Pages** → **Build and deployment** → **Source** to **GitHub Actions**.

## Connect

1. Connect and power on the Summit.
2. Select **Connect MIDI** and allow access.
3. Choose the Summit MIDI input and output, then select its MIDI channel.

Supported control changes are sent to the synth and reflected in the editor.

## Basics

- Use the panel sections to edit synth controls. Changes are sent as you make them.
- The modulation matrix has 16 slots. Its assignment mapping is community-documented
  and should be verified with your hardware.
- **Fetch EXP** captures the current edit buffer. Import and export use raw `.syx`
  patch files; patch data is not decoded into editor controls.
- Save your current patch before testing patch transfer. Fetch behavior may vary by
  firmware.

The editor currently provides one set of patch controls; independent Summit A/B
layer editing is not supported. Verify MIDI behavior with your hardware before
relying on changes.

## Checks

```sh
npm run test:run
npm run test:layout
npm run lint
npm run build
```
