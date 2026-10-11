---
title: PatchGator
description: >-
  PatchGator is a browser-based synth patch designer with a built-in Web Synth
  and optional Novation Summit and UltraNova MIDI support.
---

PatchGator is a browser-based synth patch designer with a built-in Web Synth
selected by default. Connect to Novation Summit or UltraNova over Web MIDI to
edit supported controls, or use the virtual keyboard with any synth profile.
Summit also supports raw patch transfer.

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

1. Connect and power on your synth, then select its **Synth profile**.
2. Select **Connect MIDI** and allow access.
3. Choose your synth's MIDI input and output, then select its MIDI channel.

Supported control changes are sent to the synth and reflected in the editor.

## Basics

- Click the `?` beside a Web Synth control to learn what it changes and the
  synthesis concept behind it. You can also focus the help button and press
  Enter or Space. Press Escape, click elsewhere, or click `?` again to dismiss.
- Select oscillator waveforms using the shape buttons in Web Synth. Use Tab to focus
  a waveform group and arrow keys to change its selection.
- Blend the oscillators with the mixer sliders. The envelope graphs sit beside
  their ADSR sliders.
- Web Synth amplifier and filter envelopes use actual durations: attack 0-20 s,
  decay 0-22 s, release 0-30 s, and sustain 0-100%. Values below one second
  display in milliseconds; longer values display in seconds. Click a value
  to enter an exact whole number in milliseconds (for example, 1500 for 1.5 s).
  The numeric editor shows a visible milliseconds label while editing.
  Defaults, presets, and tutorial targets keep their existing timings.
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

### Envelope timing comparison

Summit and UltraNova expose ADSR controls as 0-127 values, not milliseconds.
The same raw value does not necessarily produce the same duration.

| Stage | Summit | UltraNova | Web Synth |
|-------|--------|-----------|-----------|
| Attack | Maximum over 18 s | Maximum over 20 s; 64 is about 220 ms | 0-20 s |
| Decay | Maximum about 22 s | 64 is about 150 ms; maximum not specified | 0-22 s |
| Sustain | 0-127 level | 0-127 level | 0-100% level |
| Release | Maximum over 24 s | Maximum about 30 s; 64 is about 300 ms | 0-30 s |

These hardware timings are approximate and come from the
[Summit user guide](https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/downloads/Summit%20User%20Guide%201.1%20EN.pdf)
(Envelopes) and
[UltraNova user guide](https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/novation/downloads/10524/ultranova-userguide2.pdf)
(Amplitude envelope, default slope settings). Web Synth uses the agreed shared
hardware-sized limits, not an exact hardware curve emulation. Its attack and
decay ramps are linear; hardware slopes can differ. Zero-time stages use a
5 ms minimum in audio playback to avoid abrupt changes. Existing browser
presets still store milliseconds and percentages, so no migration is needed.

## Novation UltraNova

Select **Novation UltraNova** for a Summit-style panel with a blue chassis,
dark knobs and red LED accents. UltraNova keeps its own patch values, separate
from Summit and Web Synth, and uses its own CC and NRPN mappings.

Supported controls include three oscillators (all 72 waveform choices), mixer,
two filters and their routing, amplifier ADSR, envelopes 2-6, three LFOs,
five effect-slot selections and levels, voice/unison, glide, and arp octaves
and gate. Use the LFO and envelope selectors to edit each generator.
Each effect processor can occupy only one slot; already-assigned processors
are unavailable in the other slot selectors.
Reset defaults restores and transmits only these controls, not a complete
hardware Init patch. Save your hardware patch first.

Mappings follow Novation's [UltraNova MIDI implementation](https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/novation/downloads/10539/ultranova-midi-implementation2.pdf)
and [user guide](https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/novation/downloads/10524/ultranova-userguide2.pdf).
Enable MIDI control transmission/reception on your synth and verify behavior
with your hardware. PatchGator does not read the current patch into these controls;
incoming supported CC/NRPN edits update them without echoing.

UltraNova SysEx transfer, its 20-slot modulation matrix, Touch controls,
vocoder, effect-processor settings, and arp on/off, latch, clock and patterns
are not yet implemented. These limitations are shown in the panel.
Use Novation's librarian to back up and transfer UltraNova patches.
Summit's experimental patch-transfer and matrix support are unchanged.

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
Each challenge uses a consistent **Learn**, **See the idea**, **Try it**, and
**Listen for** layout. Compact 15px lesson text, numbered actions with suggested
settings, and a seven-step roadmap make it easier to follow. Tighter spacing,
smaller diagrams, and side-by-side action and listening cards on desktop leave
more room for the synth controls. Original, labeled
concept sketches explain harmonics, detuning, filters, envelopes, vibrato, and
presets. They illustrate ideas rather than measure live audio; the envelope
graphs in the controls respond to your settings. Listening is encouraged but
is not a requirement to advance.

Click a numeric Web Synth value label (or focus it and press Enter) to edit
an exact value inline, such as a filter cutoff of 1500 Hz. Press Enter or leave the field to apply a
whole-number value in the displayed control's range, or press Escape to cancel.
Invalid or empty entries show an error without changing the sound. Knobs and
sliders remain available and stay synchronized with the value fields.

The seventh challenge names and saves your sound, earning the Patch builder
badge and bringing your total to 700 XP. Saving unlocks the full editor.
This teaches subtractive synthesis, not FM or ring modulation.

Choose **Skip tutorial** to dismiss the introduction without changing your sound,
or **Exit tutorial** at any time to return to the full editor with your current
learning patch. Starting the tutorial replaces your current sound with a learning
patch; exiting does not restore the previous sound.

Skipping, exiting, or completing the tutorial is remembered in this browser and
site, so returning users no longer see the introduction. **Start tutorial** remains
available if you want to try again. Clearing site data resets this preference.
Storage failures are displayed if the preference cannot be remembered.
Switching synth profiles exits the tutorial and leaves your learning patch in
Web Synth. Challenge progress is not retained after exiting or reloading.

You can also name and **Save preset** outside the tutorial. Saved patches appear
under **Your browser presets** in the preset selector and survive page reloads.
They store all Web Synth parameters, remain separate from Summit SysEx files,
and are local to this browser and site. Clearing site data removes them.
Storage failures are displayed without reporting a successful save.

### Tutorial presentation rationale

The presentation applies research-backed guidance, with original lesson text
and diagrams rather than reproducing third-party material:

* Keep explanations and relevant diagrams together, emphasize essential ideas,
  and remove decorative distractions, following
  [Mayer's multimedia learning principles](https://www.cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/principles-for-reducing-extraneous-processing-in-multimedia-learning-coherence-signaling-redundancy-spatial-contiguity-and-temporal-contiguity-principles/C98AB3A6CE760DD63C048936EA0B3B44).
* Use headings, spacing, explicit feedback, and text alternatives for diagrams,
  following [W3C WAI design guidance](https://www.w3.org/WAI/tips/designing/).
* Use comfortable screen text sizes, following
  [Practical Typography's point-size guidance](https://practicaltypography.com/point-size.html).

These are design choices informed by research, not evidence that this tutorial
has improved learning outcomes. Validate that with beginner usability sessions:
can learners find the next action, explain cutoff versus loudness, distinguish
an envelope from an LFO, and save their patch without assistance?

## Checks

```sh
npm run test:run
npm run test:layout
npm run lint
npm run build
```
