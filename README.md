---
title: Summit Patch Lab
description: Minimal browser-based Novation Summit patch editor.
---

## Summit Patch Lab

A browser-only Novation Summit editor built with React, TypeScript, and Web MIDI. It supports live CC and NRPN controls, raw SysEx patch transfer, an envelope display, and a virtual keyboard.

## Panel layout

The editor groups controls using the [Novation PEAK front panel](https://userguides.novationmusic.com/hc/en-gb/articles/25494651161362-Peak-hardware-overview)
as a reference, with a compact layout rather than matching its physical proportions.
Patch utilities, a single selector for four LFOs, and the amp and mod envelopes sit above
three wide oscillator rows, the mixer and filter. Arp, glide, effects and menu settings sit below.
Continuous synth parameters use rotary-style controls with pointer and keyboard input;
the amplifier and mod envelopes use vertical ADSR faders.
Both envelope sections include a live ADSR curve; the mod curve follows the selected envelope.
Control helper text is available from the information icons on hover or keyboard focus.
Press Escape to dismiss a tooltip. CC and NRPN addresses are hidden by default;
use the footer's Debug toggle to show them.
Each section starts expanded. Click its heading, or focus the heading button and press
Enter or Space, to collapse or expand it independently. Values and selector choices are
preserved while collapsed. Collapsing the virtual keyboard stops held notes.
The mixer uses two columns and three rows: Osc 1, Osc 2 and Osc 3 on the left;
ring mod, noise and VCA on the right.
Double-click a parameter control to restore its default, or focus it and press Delete.
Coarse tuning displays -64 to +63 and fine tuning -50 to +50, both centred at 0,
while preserving their documented raw MIDI ranges.
Smaller knobs, shorter faders, compact spacing and a low-profile keyboard reduce scrolling
without hiding sections or scaling down the entire interface. Smaller screens reflow the panel
without hiding controls. Scrolling remains available when the controls cannot fit in the viewport.
The virtual keyboard uses a Summit-style 61-key layout: five octaves plus the final C,
starting at C2 and ending at C7 (MIDI notes 36 to 96). Longer white keys and raised black
keys follow the two/three-key grouping. The starting octave can range from 1 to 4
to keep every note within MIDI limits. The keyboard fits without a scrollbar, showing
fewer octaves on narrow screens to preserve 24-pixel key targets. Use the octave
buttons to shift the visible range. Resizing the keybed stops held notes.

The single-part sound controls include wave, range, coarse/fine tuning and shape for all three oscillators, oscillator and noise mixer levels, VCA level, and the filter's frequency, key tracking and post drive. The filter frequency is the filter section's larger featured knob. Each oscillator also has its Mod Env 2 and LFO 2 pitch depths and Mod Env 1 and LFO 1 shape depths, and the filter has LFO 1, amp envelope, Mod Env 1 and Osc 3 frequency mod depths. Bipolar depths display centred at 0. Because every depth is shown separately, the panel's shape-source and envelope-select buttons are not needed.

The Modulation matrix module provides 16 slots, each with two sources, one destination and a bipolar depth. Assignment NRPN behavior follows the open-source [twinpeaks Summit editor](https://github.com/sildater/twinpeaks); the [Summit/Peak MIDI database](https://github.com/pencilresearch/midi/blob/main/Novation/Summit%20and%20Peak.csv) independently lists the slot depth NRPNs. Novation does not publish the complete assignment NRPN map, so source and destination changes are marked as community-documented and should be verified with the connected hardware. Available source and destination choices may not include later firmware additions.

The LFO selector switches between four LFOs. LFO 1 and 2 offer range (Low, High, Sync), rate, sync rate, wave, phase, slew, fade time, fade mode, one shot and common sync. Rate is active in Low and High range and Sync rate when Range is Sync. LFO 3 and 4 expose phase, slew and fade time only; their wave and rate have no published MIDI address.
The amp envelope and the Mod env 1 / Mod env 2 selector each offer attack, decay, sustain, release, velocity and mono-trigger (Legato / Re-Trig). The Glide module offers glide time and on/off.

The filter Shape selector offers Low-pass, Band-pass, High-pass and Dual.
The dual-filter pane is hidden unless Shape is Dual, preserving its values when hidden.
In Dual mode the combination selector (series `>` or parallel `+`: LP > HP, LP > BP,
HP > BP, LP + HP, LP + BP, HP + BP, LP + LP, BP + BP, HP + HP) and the separation knob
become editable. A Filter slope selector (12 dB / 24 dB) is also available.

Settings that live in the hardware Voice and Osc menus rather than on panel knobs are grouped in the **Voice & oscillator menus** module. Its tabs cover voice mode, unison, unison detune, spread, spread mode, pre-glide, keyboard octave and filter divergence; oscillator divergence and drift; per-oscillator wavetable, saw density, density detune, fixed note, bend range and virtual sync; and the noise low-pass and high-pass filters.
Ranges, value orders and defaults follow the MIDI parameter list in the [Summit user guide appendix](https://userguides.novationmusic.com/hc/en-gb/articles/25003993283986-Summit-appendix). The dual-filter combination and separation (NRPN 25:9 and 25:10) and noise high-pass (NRPN 0:12) addresses are missing from that list and come from community documentation. **Reset defaults** updates those three locally but does not send them to the synth.
NRPN messages are sent as CC 99/98 plus Data Entry (CC 6) only. The trailing CC 38 data-entry LSB is omitted because the Summit uses CC 38 for Oscillator 2 Mod Env 2 > pitch. Parameters that the guide lists as 14-bit CC pairs (such as LFO rate) send only their 7-bit coarse controller.
Unsupported sections and missing controls are labelled **Not yet implemented** or noted within their section.
Patch transfer occupies the patch/menu area; it still preserves raw SysEx rather than decoding parameter values.

Editing remains on the selected MIDI channel with one local set of parameter values.
Independent SUMMIT A/B layer editing and multilayer patch management are not yet implemented.
MIDI assignments follow the [Summit and Peak CC/NRPN reference](https://midi.guide/d/novation/summit-and-peak/); verify control behavior with the connected hardware before saving patches.

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
npm run test:layout
```

The layout checks launch their own local Vite server and use Playwright Chromium.
If the browser is missing, run `npx playwright install chromium`.
They check desktop page-height budgets, narrow-screen reflow, control clipping,
minimum 24-pixel interactive targets, and keyboard/pointer editing.
