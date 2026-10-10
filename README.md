---
title: Zinth
description: Browser-based synth patch designer with a built-in Web Synth and optional Novation Summit MIDI support.
---

# Zinth

A browser-based synth patch designer with a built-in Web Synth selected by default. Connect to
Novation Summit over Web MIDI to edit supported controls and transfer patch files, or use the
virtual keyboard with either synth profile.

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

- Click the `?` beside a Web Synth control to learn what it changes and the
  synthesis concept behind it. You can also focus the help button and press
  Enter or Space. Press Escape, click elsewhere, or click `?` again to dismiss.
- Select oscillator waveforms using the shape buttons in Web Synth. Use Tab to focus
  a waveform group and arrow keys to change its selection.
- Blend the oscillators with the mixer sliders. The envelope graphs sit beside
  their ADSR sliders.
- Give each oscillator its own LP (low-pass), HP (high-pass), or BP (band-pass)
  filter with independent cutoff and resonance. The filter envelope is shared,
  but each filter moves relative to its own cutoff.
- Set LFO pitch, cutoff, and resonance depths independently. Zero disables an
  assignment; multiple destinations can be active together.
- Use Voice / unison to select 1-16 simultaneous notes and 1-4 detuned copies of
  each oscillator per note. Spread sets the outer copies' detune in cents.
  Changing either voice count releases sounding notes; full polyphony steals
  the oldest note. Unison levels are normalized.
- Use oscillator Shape for square-wave pulse width (1-99%, 50% for square), or
  phase offset for sine, triangle, and sawtooth (50% is neutral). Phase changes
  are most audible when mixing oscillators at matching pitches; they do not
  change pitch. Pulse width is adjustable, but not LFO-modulated.
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

## Learn subtractive synthesis

Select Built-in Web Synth and choose **Start tutorial** for an optional,
untimed patch-building quest. It starts from a simple sine patch and reveals
controls as you earn six badges and 100 XP per challenge:

1. Choose a waveform with harmonics.
2. Blend and detune a second oscillator.
3. Subtract harmonics with the two low-pass filters.
4. Shape loudness with the amplifier envelope.
5. Move brightness with the filter envelope.
6. Add vibrato with the LFO.

Use **Start audio** and the virtual keyboard to hear each change. The displayed
targets enable **Claim badge and continue**; earlier controls remain available.
The seventh challenge names and saves your sound, earning the Patch builder
badge and bringing your total to 700 XP. Saving unlocks the full editor.
This teaches subtractive synthesis, not FM or ring modulation.

You can leave at any time, keeping your learning patch or restoring the patch
you had before starting. Switching synth profiles leaves your learning patch
in Web Synth and exits the tutorial. Progress is not retained after leaving
or reloading.

You can also name and **Save preset** outside the tutorial. Saved patches appear
under **Your browser presets** in the preset selector and survive page reloads.
They store all Web Synth parameters, remain separate from Summit SysEx files,
and are local to this browser and site. Clearing site data removes them.
Storage failures are displayed without reporting a successful save.

## Checks

```sh
npm run test:run
npm run test:layout
npm run lint
npm run build
```
