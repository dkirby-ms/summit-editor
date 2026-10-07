---
title: Summit Patch Lab
description: Minimal browser-based Novation Summit patch editor.
---

## Summit Patch Lab

A browser-only Novation Summit editor built with React, TypeScript, and Web MIDI. It supports live CC and NRPN controls, raw SysEx patch transfer, an envelope display, and a virtual keyboard.

## Run

```powershell
npm install
npm run dev
```

Open the localhost URL printed by Vite in Chrome or Edge.

## Connect

1. Connect and power on the Summit.
2. Select **Connect MIDI** and allow MIDI/SysEx access.
3. Select the Summit input and output.
4. Match the editor channel to the Summit MIDI channel.

Editor changes are sent to the Summit. Registered CC and NRPN changes from the Summit are reflected in the interface.

## Patch Transfer

Save the current Summit patch before testing SysEx.

* **Fetch EXP** requests and captures the current edit buffer.
* **Import** and **Export** read and write raw `.syx` files.
* **Send** writes the imported or captured buffer to the Summit.

Fetch remains experimental across untested firmware revisions. Patch data is preserved as raw SysEx and is not decoded.

## Validate

```powershell
npm test -- --run
npm run lint
npm run build
```
