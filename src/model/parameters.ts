export type ParameterSection =
  | 'Oscillator 1'
  | 'Oscillator 2'
  | 'Oscillator 3'
  | 'Mixer'
  | 'Filter'
  | 'Dual filter'
  | 'Voice menu'
  | 'Oscillator 1 menu'
  | 'Oscillator 2 menu'
  | 'Oscillator 3 menu'
  | 'Noise menu'
  | 'Oscillator common menu'
  | 'Glide'
  | 'Filter modulation'
  | 'Envelope'
  | 'Mod envelope 1'
  | 'Mod envelope 2'
  | 'LFO'
  | 'Effects'

type CcAddress = { type: 'cc'; controller: number }
type NrpnAddress = { type: 'nrpn'; msb: number; lsb: number }

export type ParameterDefinition = {
  id: string
  section: ParameterSection
  label: string
  shortLabel: string
  min: number
  max: number
  defaultValue: number
  address: CcAddress | NrpnAddress
  /** Labels for raw values min..max, indexed by `value - min`. */
  valueLabels?: readonly string[]
  /** Raw value shown as zero; displayed values are signed (`raw - displayOffset`). */
  displayOffset?: number
  /** Renders as a vertical fader (envelope stages). */
  fader?: boolean
  /** Renders as the module's featured, larger knob. */
  prominent?: boolean
  /** Value encoding is not hardware-verified, so reset-to-defaults does not transmit it. */
  unverifiedEncoding?: boolean
}

/** Footage labels for oscillator range raw values 63–66 (Summit user guide, appendix). */
const oscRangeLabels = ["16'", "8'", "4'", "2'"] as const

/** Wavetable names for Wave More raw values 4–63, in manual order. */
const wavetableNames = [
  'BS Sine', 'String', 'Glassy', 'Spirals', 'Random', 'BassOrgn', 'Granular', 'Steel',
  'Zing', 'Acid', 'Grime', 'Sunrise', 'Tubey', 'Buzzy', 'Drow', 'Swell',
  'Octaves', 'Carousel', 'Heavy', 'Thicker', 'Wobbler', 'Choral', 'Hedge', 'Thinner',
  'Chords', 'Climbing', 'Hungry', 'Tides', 'Didgery', 'CoinFlip', 'Ladders', 'Tokyo',
  'Harsh', 'Deep', 'Lead', 'Tops', 'Organ', 'Dub', 'Modeling', 'V.Chord',
  'E. Piano', 'Eee', 'Modem', 'Variance', 'VoxOooEe', 'Eris', 'Monster', 'Vocaloid',
  'VoxYahEe', 'Flame', 'Screech', 'Vowelled', 'Winds', 'Further', 'SeaBase', 'WeirdVox',
  'SoftClav', 'GlassSaw', 'Shmorgan', 'Yeah',
] as const

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
/** Fixed note: 0 = Off, 1–88 = C-2 through D#5. */
const fixedNoteLabels = ['Off', ...Array.from({ length: 88 }, (_, index) => `${noteNames[index % 12]}${Math.floor(index / 12) - 2}`)]

const offOn = ['Off', 'On'] as const
const triggerLabels = ['Legato', 'Re-Trig'] as const
const lfoWaveLabels = ['Triangle', 'Saw', 'Square', 'Sample & hold'] as const
const lfoRangeLabels = ['Low', 'High', 'Sync'] as const
const lfoFadeModeLabels = ['FadeIn', 'FadeOut', 'GateIn', 'GateOut'] as const
/** LFO phase: 0 = Free, then 0°–357° in 3° steps. */
const lfoPhaseLabels = ['Free', ...Array.from({ length: 120 }, (_, index) => `${index * 3}°`)]

/** LFO sync divisions for raw values 0–34 (Summit user guide, appendix "LFO sync rate"). */
const lfoSyncRateLabels = [
  '64 beats', '48 beats', '42 beats', '36 beats', '32 beats', '30 beats', '28 beats', '24 beats',
  '21 + 1/3', '20 beats', '18 + 2/3', '18 beats', '16 beats', '13 + 1/3', '12 beats', '10 + 2/3',
  '8 beats', '6 beats', '5 + 1/3', '4 beats', '3 beats', '2 + 2/3', '2nd', '4th D',
  '1 + 1/3', '4th', '8th D', '4th T', '8th', '16th D', '8th T', '16th',
  '16th T', '32nd', '32nd T',
] as const

export const summitParameters = [
  { id: 'osc1Wave', section: 'Oscillator 1', label: 'Oscillator 1 wave', shortLabel: 'Wave', min: 0, max: 4, defaultValue: 2, address: { type: 'nrpn', msb: 0, lsb: 14 }, valueLabels: ['Sine', 'Triangle', 'Saw', 'Square', 'Wavetable'] },
  { id: 'osc1Range', section: 'Oscillator 1', label: 'Oscillator 1 range', shortLabel: 'Range', min: 63, max: 66, defaultValue: 64, address: { type: 'cc', controller: 3 }, valueLabels: oscRangeLabels },
  { id: 'osc1Coarse', section: 'Oscillator 1', label: 'Oscillator 1 coarse tuning', shortLabel: 'Coarse', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 14 }, displayOffset: 64 },
  { id: 'osc1Fine', section: 'Oscillator 1', label: 'Oscillator 1 fine tuning', shortLabel: 'Fine', min: 14, max: 114, defaultValue: 64, address: { type: 'cc', controller: 15 }, displayOffset: 64 },
  { id: 'osc1Shape', section: 'Oscillator 1', label: 'Oscillator 1 manual shape', shortLabel: 'Shape', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 12 } },
  { id: 'osc1ModEnv2Pitch', section: 'Oscillator 1', label: 'Oscillator 1 mod envelope 2 to pitch depth', shortLabel: 'Env 2 > pitch', min: 1, max: 127, defaultValue: 64, address: { type: 'cc', controller: 9 }, displayOffset: 64 },
  { id: 'osc1Lfo2Pitch', section: 'Oscillator 1', label: 'Oscillator 1 LFO 2 to pitch depth', shortLabel: 'LFO 2 > pitch', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 16 }, displayOffset: 64 },
  { id: 'osc1ModEnv1Shape', section: 'Oscillator 1', label: 'Oscillator 1 mod envelope 1 to shape depth', shortLabel: 'Env 1 > shape', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 119 }, displayOffset: 64 },
  { id: 'osc1Lfo1Shape', section: 'Oscillator 1', label: 'Oscillator 1 LFO 1 to shape depth', shortLabel: 'LFO 1 > shape', min: 1, max: 127, defaultValue: 64, address: { type: 'cc', controller: 33 }, displayOffset: 64 },
  { id: 'osc2Wave', section: 'Oscillator 2', label: 'Oscillator 2 wave', shortLabel: 'Wave', min: 0, max: 4, defaultValue: 2, address: { type: 'nrpn', msb: 0, lsb: 23 }, valueLabels: ['Sine', 'Triangle', 'Saw', 'Square', 'Wavetable'] },
  { id: 'osc2Range', section: 'Oscillator 2', label: 'Oscillator 2 range', shortLabel: 'Range', min: 63, max: 66, defaultValue: 64, address: { type: 'cc', controller: 37 }, valueLabels: oscRangeLabels },
  { id: 'osc2Coarse', section: 'Oscillator 2', label: 'Oscillator 2 coarse tuning', shortLabel: 'Coarse', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 17 }, displayOffset: 64 },
  { id: 'osc2Fine', section: 'Oscillator 2', label: 'Oscillator 2 fine tuning', shortLabel: 'Fine', min: 14, max: 114, defaultValue: 64, address: { type: 'cc', controller: 18 }, displayOffset: 64 },
  { id: 'osc2Shape', section: 'Oscillator 2', label: 'Oscillator 2 manual shape', shortLabel: 'Shape', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 39 } },
  { id: 'osc2ModEnv2Pitch', section: 'Oscillator 2', label: 'Oscillator 2 mod envelope 2 to pitch depth', shortLabel: 'Env 2 > pitch', min: 1, max: 127, defaultValue: 64, address: { type: 'cc', controller: 38 }, displayOffset: 64 },
  { id: 'osc2Lfo2Pitch', section: 'Oscillator 2', label: 'Oscillator 2 LFO 2 to pitch depth', shortLabel: 'LFO 2 > pitch', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 19 }, displayOffset: 64 },
  { id: 'osc2ModEnv1Shape', section: 'Oscillator 2', label: 'Oscillator 2 mod envelope 1 to shape depth', shortLabel: 'Env 1 > shape', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 40 }, displayOffset: 64 },
  { id: 'osc2Lfo1Shape', section: 'Oscillator 2', label: 'Oscillator 2 LFO 1 to shape depth', shortLabel: 'LFO 1 > shape', min: 1, max: 127, defaultValue: 64, address: { type: 'cc', controller: 41 }, displayOffset: 64 },
  { id: 'osc3Wave', section: 'Oscillator 3', label: 'Oscillator 3 wave', shortLabel: 'Wave', min: 0, max: 4, defaultValue: 2, address: { type: 'nrpn', msb: 0, lsb: 32 }, valueLabels: ['Sine', 'Triangle', 'Saw', 'Square', 'Wavetable'] },
  { id: 'osc3Range', section: 'Oscillator 3', label: 'Oscillator 3 range', shortLabel: 'Range', min: 63, max: 66, defaultValue: 64, address: { type: 'cc', controller: 65 }, valueLabels: oscRangeLabels },
  { id: 'osc3Coarse', section: 'Oscillator 3', label: 'Oscillator 3 coarse tuning', shortLabel: 'Coarse', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 20 }, displayOffset: 64 },
  { id: 'osc3Fine', section: 'Oscillator 3', label: 'Oscillator 3 fine tuning', shortLabel: 'Fine', min: 14, max: 114, defaultValue: 64, address: { type: 'cc', controller: 21 }, displayOffset: 64 },
  { id: 'osc3Shape', section: 'Oscillator 3', label: 'Oscillator 3 manual shape', shortLabel: 'Shape', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 71 } },
  { id: 'osc3ModEnv2Pitch', section: 'Oscillator 3', label: 'Oscillator 3 mod envelope 2 to pitch depth', shortLabel: 'Env 2 > pitch', min: 1, max: 127, defaultValue: 64, address: { type: 'cc', controller: 43 }, displayOffset: 64 },
  { id: 'osc3Lfo2Pitch', section: 'Oscillator 3', label: 'Oscillator 3 LFO 2 to pitch depth', shortLabel: 'LFO 2 > pitch', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 22 }, displayOffset: 64 },
  { id: 'osc3ModEnv1Shape', section: 'Oscillator 3', label: 'Oscillator 3 mod envelope 1 to shape depth', shortLabel: 'Env 1 > shape', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 72 }, displayOffset: 64 },
  { id: 'osc3Lfo1Shape', section: 'Oscillator 3', label: 'Oscillator 3 LFO 1 to shape depth', shortLabel: 'LFO 1 > shape', min: 1, max: 127, defaultValue: 64, address: { type: 'cc', controller: 73 }, displayOffset: 64 },
  { id: 'osc1Mix', section: 'Mixer', label: 'Oscillator 1 level', shortLabel: 'Osc 1', min: 0, max: 127, defaultValue: 127, address: { type: 'cc', controller: 23 } },
  { id: 'osc2Mix', section: 'Mixer', label: 'Oscillator 2 level', shortLabel: 'Osc 2', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 24 } },
  { id: 'osc3Mix', section: 'Mixer', label: 'Oscillator 3 level', shortLabel: 'Osc 3', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 25 } },
  { id: 'ringModMix', section: 'Mixer', label: 'Ring modulator level', shortLabel: 'Ring mod', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 26 } },
  { id: 'noiseMix', section: 'Mixer', label: 'Noise level', shortLabel: 'Noise', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 27 } },
  { id: 'vcaLevel', section: 'Mixer', label: 'VCA level', shortLabel: 'VCA', min: 0, max: 127, defaultValue: 127, address: { type: 'nrpn', msb: 0, lsb: 42 } },
  { id: 'filterShape', section: 'Filter', label: 'Filter shape', shortLabel: 'Shape', min: 0, max: 3, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 46 }, valueLabels: ['Low-pass', 'Band-pass', 'High-pass', 'Dual'] },
  { id: 'filterSlope', section: 'Filter', label: 'Filter slope', shortLabel: 'Slope', min: 0, max: 1, defaultValue: 1, address: { type: 'nrpn', msb: 0, lsb: 45 }, valueLabels: ['12 dB', '24 dB'] },
  { id: 'filterCutoff', section: 'Filter', label: 'Filter frequency', shortLabel: 'Frequency', min: 0, max: 127, defaultValue: 127, address: { type: 'cc', controller: 29 }, prominent: true },
  { id: 'filterTrack', section: 'Filter', label: 'Filter key tracking', shortLabel: 'Key track', min: 0, max: 127, defaultValue: 127, address: { type: 'cc', controller: 75 } },
  { id: 'filterPostDrive', section: 'Filter', label: 'Filter post drive', shortLabel: 'Post drive', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 36 } },
  { id: 'filterOverdrive', section: 'Filter', label: 'Filter overdrive', shortLabel: 'Drive', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 80 } },
  { id: 'filterResonance', section: 'Filter', label: 'Filter resonance', shortLabel: 'Resonance', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 79 } },
  { id: 'filterLfo1Depth', section: 'Filter modulation', label: 'LFO 1 to filter frequency depth', shortLabel: 'LFO 1 depth', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 28 }, displayOffset: 64 },
  { id: 'filterAmpEnvDepth', section: 'Filter modulation', label: 'Amp envelope to filter frequency depth', shortLabel: 'Amp env depth', min: 1, max: 127, defaultValue: 64, address: { type: 'cc', controller: 77 }, displayOffset: 64 },
  { id: 'filterModEnv1Depth', section: 'Filter modulation', label: 'Mod envelope 1 to filter frequency depth', shortLabel: 'Mod env 1 depth', min: 1, max: 127, defaultValue: 64, address: { type: 'cc', controller: 78 }, displayOffset: 64 },
  { id: 'filterOsc3Depth', section: 'Filter modulation', label: 'Oscillator 3 to filter frequency depth', shortLabel: 'Osc 3 depth', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 76 } },
  { id: 'filterDualType', section: 'Dual filter', label: 'Dual filter combination', shortLabel: 'Combination', min: 0, max: 8, defaultValue: 0, address: { type: 'nrpn', msb: 25, lsb: 9 }, valueLabels: ['LP > HP', 'LP > BP', 'HP > BP', 'LP + HP', 'LP + BP', 'HP + BP', 'LP + LP', 'BP + BP', 'HP + HP'], unverifiedEncoding: true },
  { id: 'filterSeparation', section: 'Dual filter', label: 'Dual filter separation', shortLabel: 'Separation', min: 0, max: 127, defaultValue: 64, address: { type: 'nrpn', msb: 25, lsb: 10 }, unverifiedEncoding: true, displayOffset: 64 },
  { id: 'voiceMode', section: 'Voice menu', label: 'Voice mode', shortLabel: 'Mode', min: 0, max: 4, defaultValue: 3, address: { type: 'nrpn', msb: 0, lsb: 2 }, valueLabels: ['Mono', 'Mono 2', 'MonoLG', 'Poly', 'Poly 2'] },
  { id: 'unison', section: 'Voice menu', label: 'Unison voices', shortLabel: 'Unison', min: 0, max: 4, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 3 }, valueLabels: ['1', '2', '3', '4', '8'] },
  { id: 'unisonDetune', section: 'Voice menu', label: 'Unison detune', shortLabel: 'Detune', min: 0, max: 127, defaultValue: 25, address: { type: 'nrpn', msb: 0, lsb: 4 } },
  { id: 'voiceSpread', section: 'Voice menu', label: 'Voice spread', shortLabel: 'Spread', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 5 } },
  { id: 'spreadMode', section: 'Voice menu', label: 'Voice panning mode', shortLabel: 'Spread mode', min: 0, max: 3, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 52 }, valueLabels: ['Diverge', 'Alternate', 'Diverge 2', 'NoteVal'] },
  { id: 'preGlide', section: 'Voice menu', label: 'Pre-glide', shortLabel: 'Pre-glide', min: 52, max: 76, defaultValue: 64, address: { type: 'nrpn', msb: 0, lsb: 7 }, displayOffset: 64 },
  { id: 'keyboardOctave', section: 'Voice menu', label: 'Keyboard octave', shortLabel: 'Kbd octave', min: 61, max: 67, defaultValue: 64, address: { type: 'nrpn', msb: 0, lsb: 6 }, displayOffset: 64 },
  { id: 'filterDivergence', section: 'Voice menu', label: 'Filter divergence', shortLabel: 'Filter diverge', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 48 } },
  { id: 'oscDiverge', section: 'Oscillator common menu', label: 'Oscillator divergence', shortLabel: 'Diverge', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 9 } },
  { id: 'oscDrift', section: 'Oscillator common menu', label: 'Oscillator drift', shortLabel: 'Drift', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 10 } },
  { id: 'osc1WaveMore', section: 'Oscillator 1 menu', label: 'Oscillator 1 wavetable', shortLabel: 'Wavetable', min: 4, max: 63, defaultValue: 4, address: { type: 'nrpn', msb: 0, lsb: 15 }, valueLabels: wavetableNames },
  { id: 'osc1SawDense', section: 'Oscillator 1 menu', label: 'Oscillator 1 saw density', shortLabel: 'Density', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 17 } },
  { id: 'osc1SawDetune', section: 'Oscillator 1 menu', label: 'Oscillator 1 density detune', shortLabel: 'Dense detune', min: 0, max: 127, defaultValue: 64, address: { type: 'nrpn', msb: 0, lsb: 18 } },
  { id: 'osc1FixedNote', section: 'Oscillator 1 menu', label: 'Oscillator 1 fixed note', shortLabel: 'Fixed note', min: 0, max: 88, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 19 }, valueLabels: fixedNoteLabels },
  { id: 'osc1BendRange', section: 'Oscillator 1 menu', label: 'Oscillator 1 bend range', shortLabel: 'Bend range', min: 40, max: 88, defaultValue: 76, address: { type: 'nrpn', msb: 0, lsb: 20 }, displayOffset: 64 },
  { id: 'osc1Vsync', section: 'Oscillator 1 menu', label: 'Oscillator 1 virtual sync', shortLabel: 'Vsync', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 34 } },
  { id: 'osc2WaveMore', section: 'Oscillator 2 menu', label: 'Oscillator 2 wavetable', shortLabel: 'Wavetable', min: 4, max: 63, defaultValue: 4, address: { type: 'nrpn', msb: 0, lsb: 24 }, valueLabels: wavetableNames },
  { id: 'osc2SawDense', section: 'Oscillator 2 menu', label: 'Oscillator 2 saw density', shortLabel: 'Density', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 26 } },
  { id: 'osc2SawDetune', section: 'Oscillator 2 menu', label: 'Oscillator 2 density detune', shortLabel: 'Dense detune', min: 0, max: 127, defaultValue: 64, address: { type: 'nrpn', msb: 0, lsb: 27 } },
  { id: 'osc2FixedNote', section: 'Oscillator 2 menu', label: 'Oscillator 2 fixed note', shortLabel: 'Fixed note', min: 0, max: 88, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 28 }, valueLabels: fixedNoteLabels },
  { id: 'osc2BendRange', section: 'Oscillator 2 menu', label: 'Oscillator 2 bend range', shortLabel: 'Bend range', min: 40, max: 88, defaultValue: 76, address: { type: 'nrpn', msb: 0, lsb: 29 }, displayOffset: 64 },
  { id: 'osc2Vsync', section: 'Oscillator 2 menu', label: 'Oscillator 2 virtual sync', shortLabel: 'Vsync', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 42 } },
  { id: 'osc3WaveMore', section: 'Oscillator 3 menu', label: 'Oscillator 3 wavetable', shortLabel: 'Wavetable', min: 4, max: 63, defaultValue: 4, address: { type: 'nrpn', msb: 0, lsb: 33 }, valueLabels: wavetableNames },
  { id: 'osc3SawDense', section: 'Oscillator 3 menu', label: 'Oscillator 3 saw density', shortLabel: 'Density', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 35 } },
  { id: 'osc3SawDetune', section: 'Oscillator 3 menu', label: 'Oscillator 3 density detune', shortLabel: 'Dense detune', min: 0, max: 127, defaultValue: 64, address: { type: 'nrpn', msb: 0, lsb: 36 } },
  { id: 'osc3FixedNote', section: 'Oscillator 3 menu', label: 'Oscillator 3 fixed note', shortLabel: 'Fixed note', min: 0, max: 88, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 37 }, valueLabels: fixedNoteLabels },
  { id: 'osc3BendRange', section: 'Oscillator 3 menu', label: 'Oscillator 3 bend range', shortLabel: 'Bend range', min: 40, max: 88, defaultValue: 76, address: { type: 'nrpn', msb: 0, lsb: 38 }, displayOffset: 64 },
  { id: 'osc3Vsync', section: 'Oscillator 3 menu', label: 'Oscillator 3 virtual sync', shortLabel: 'Vsync', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 44 } },
  { id: 'noiseLowPass', section: 'Noise menu', label: 'Noise low-pass filter', shortLabel: 'Noise LPF', min: 0, max: 127, defaultValue: 127, address: { type: 'nrpn', msb: 0, lsb: 11 } },
  { id: 'noiseHighPass', section: 'Noise menu', label: 'Noise high-pass filter', shortLabel: 'Noise HPF', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 12 }, unverifiedEncoding: true },
  { id: 'ampAttack', section: 'Envelope', label: 'Amplifier envelope attack', shortLabel: 'Attack', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 86 }, fader: true },
  { id: 'ampDecay', section: 'Envelope', label: 'Amplifier envelope decay', shortLabel: 'Decay', min: 0, max: 127, defaultValue: 90, address: { type: 'cc', controller: 87 }, fader: true },
  { id: 'ampSustain', section: 'Envelope', label: 'Amplifier envelope sustain', shortLabel: 'Sustain', min: 0, max: 127, defaultValue: 127, address: { type: 'cc', controller: 88 }, fader: true },
  { id: 'ampRelease', section: 'Envelope', label: 'Amplifier envelope release', shortLabel: 'Release', min: 0, max: 127, defaultValue: 40, address: { type: 'cc', controller: 89 }, fader: true },
  { id: 'ampVelocity', section: 'Envelope', label: 'Amplifier envelope velocity', shortLabel: 'Velocity', min: 0, max: 127, defaultValue: 64, address: { type: 'nrpn', msb: 0, lsb: 55 }, displayOffset: 64 },
  { id: 'ampTrigger', section: 'Envelope', label: 'Amplifier envelope mono trigger', shortLabel: 'MonoTrig', min: 0, max: 1, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 56 }, valueLabels: triggerLabels },
  { id: 'modEnv1Attack', section: 'Mod envelope 1', label: 'Mod envelope 1 attack', shortLabel: 'Attack', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 90 }, fader: true },
  { id: 'modEnv1Decay', section: 'Mod envelope 1', label: 'Mod envelope 1 decay', shortLabel: 'Decay', min: 0, max: 127, defaultValue: 75, address: { type: 'cc', controller: 91 }, fader: true },
  { id: 'modEnv1Sustain', section: 'Mod envelope 1', label: 'Mod envelope 1 sustain', shortLabel: 'Sustain', min: 0, max: 127, defaultValue: 35, address: { type: 'cc', controller: 92 }, fader: true },
  { id: 'modEnv1Release', section: 'Mod envelope 1', label: 'Mod envelope 1 release', shortLabel: 'Release', min: 0, max: 127, defaultValue: 45, address: { type: 'cc', controller: 93 }, fader: true },
  { id: 'modEnv1Velocity', section: 'Mod envelope 1', label: 'Mod envelope 1 velocity', shortLabel: 'Velocity', min: 0, max: 127, defaultValue: 64, address: { type: 'nrpn', msb: 0, lsb: 60 }, displayOffset: 64 },
  { id: 'modEnv1Trigger', section: 'Mod envelope 1', label: 'Mod envelope 1 mono trigger', shortLabel: 'MonoTrig', min: 0, max: 1, defaultValue: 1, address: { type: 'nrpn', msb: 0, lsb: 61 }, valueLabels: triggerLabels },
  { id: 'modEnv2Attack', section: 'Mod envelope 2', label: 'Mod envelope 2 attack', shortLabel: 'Attack', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 94 }, fader: true },
  { id: 'modEnv2Decay', section: 'Mod envelope 2', label: 'Mod envelope 2 decay', shortLabel: 'Decay', min: 0, max: 127, defaultValue: 75, address: { type: 'cc', controller: 95 }, fader: true },
  { id: 'modEnv2Sustain', section: 'Mod envelope 2', label: 'Mod envelope 2 sustain', shortLabel: 'Sustain', min: 0, max: 127, defaultValue: 35, address: { type: 'cc', controller: 117 }, fader: true },
  { id: 'modEnv2Release', section: 'Mod envelope 2', label: 'Mod envelope 2 release', shortLabel: 'Release', min: 0, max: 127, defaultValue: 45, address: { type: 'cc', controller: 103 }, fader: true },
  { id: 'modEnv2Velocity', section: 'Mod envelope 2', label: 'Mod envelope 2 velocity', shortLabel: 'Velocity', min: 0, max: 127, defaultValue: 64, address: { type: 'nrpn', msb: 0, lsb: 64 }, displayOffset: 64 },
  { id: 'modEnv2Trigger', section: 'Mod envelope 2', label: 'Mod envelope 2 mono trigger', shortLabel: 'MonoTrig', min: 0, max: 1, defaultValue: 1, address: { type: 'nrpn', msb: 0, lsb: 65 }, valueLabels: triggerLabels },
  { id: 'lfo1Range', section: 'LFO', label: 'LFO 1 range', shortLabel: 'Range', min: 0, max: 2, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 68 }, valueLabels: lfoRangeLabels },
  { id: 'lfo1Rate', section: 'LFO', label: 'LFO 1 rate', shortLabel: 'Rate', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 30 } },
  { id: 'lfo1SyncRate', section: 'LFO', label: 'LFO 1 sync rate', shortLabel: 'Sync rate', min: 0, max: 34, defaultValue: 16, address: { type: 'cc', controller: 81 }, valueLabels: lfoSyncRateLabels },
  { id: 'lfo1Wave', section: 'LFO', label: 'LFO 1 wave', shortLabel: 'Wave', min: 0, max: 3, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 69 }, valueLabels: lfoWaveLabels },
  { id: 'lfo1Phase', section: 'LFO', label: 'LFO 1 phase', shortLabel: 'Phase', min: 0, max: 120, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 70 }, valueLabels: lfoPhaseLabels },
  { id: 'lfo1Slew', section: 'LFO', label: 'LFO 1 slew', shortLabel: 'Slew', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 71 } },
  { id: 'lfo1FadeTime', section: 'LFO', label: 'LFO 1 fade time', shortLabel: 'Fade time', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 82 } },
  { id: 'lfo1FadeMode', section: 'LFO', label: 'LFO 1 fade mode', shortLabel: 'Fade mode', min: 0, max: 3, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 72 }, valueLabels: lfoFadeModeLabels },
  { id: 'lfo1OneShot', section: 'LFO', label: 'LFO 1 one shot', shortLabel: 'One shot', min: 0, max: 1, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 75 }, valueLabels: offOn },
  { id: 'lfo1Common', section: 'LFO', label: 'LFO 1 common sync', shortLabel: 'Common', min: 0, max: 1, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 76 }, valueLabels: offOn },
  { id: 'lfo2Range', section: 'LFO', label: 'LFO 2 range', shortLabel: 'Range', min: 0, max: 2, defaultValue: 0, address: { type: 'cc', controller: 83 }, valueLabels: lfoRangeLabels },
  { id: 'lfo2Rate', section: 'LFO', label: 'LFO 2 rate', shortLabel: 'Rate', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 31 } },
  { id: 'lfo2SyncRate', section: 'LFO', label: 'LFO 2 sync rate', shortLabel: 'Sync rate', min: 0, max: 34, defaultValue: 12, address: { type: 'cc', controller: 84 }, valueLabels: lfoSyncRateLabels },
  { id: 'lfo2Wave', section: 'LFO', label: 'LFO 2 wave', shortLabel: 'Wave', min: 0, max: 3, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 78 }, valueLabels: lfoWaveLabels },
  { id: 'lfo2Phase', section: 'LFO', label: 'LFO 2 phase', shortLabel: 'Phase', min: 0, max: 120, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 79 }, valueLabels: lfoPhaseLabels },
  { id: 'lfo2Slew', section: 'LFO', label: 'LFO 2 slew', shortLabel: 'Slew', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 80 } },
  { id: 'lfo2FadeTime', section: 'LFO', label: 'LFO 2 fade time', shortLabel: 'Fade time', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 85 } },
  { id: 'lfo2FadeMode', section: 'LFO', label: 'LFO 2 fade mode', shortLabel: 'Fade mode', min: 0, max: 3, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 81 }, valueLabels: lfoFadeModeLabels },
  { id: 'lfo2OneShot', section: 'LFO', label: 'LFO 2 one shot', shortLabel: 'One shot', min: 0, max: 1, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 84 }, valueLabels: offOn },
  { id: 'lfo2Common', section: 'LFO', label: 'LFO 2 common sync', shortLabel: 'Common', min: 0, max: 1, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 85 }, valueLabels: offOn },
  { id: 'lfo3Phase', section: 'LFO', label: 'LFO 3 phase', shortLabel: 'Phase', min: 0, max: 120, defaultValue: 0, address: { type: 'nrpn', msb: 25, lsb: 38 }, valueLabels: lfoPhaseLabels },
  { id: 'lfo3Slew', section: 'LFO', label: 'LFO 3 slew', shortLabel: 'Slew', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 25, lsb: 39 } },
  { id: 'lfo3FadeTime', section: 'LFO', label: 'LFO 3 fade time', shortLabel: 'Fade time', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 25, lsb: 40 } },
  { id: 'lfo4Phase', section: 'LFO', label: 'LFO 4 phase', shortLabel: 'Phase', min: 0, max: 120, defaultValue: 0, address: { type: 'nrpn', msb: 25, lsb: 41 }, valueLabels: lfoPhaseLabels },
  { id: 'lfo4Slew', section: 'LFO', label: 'LFO 4 slew', shortLabel: 'Slew', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 25, lsb: 42 } },
  { id: 'lfo4FadeTime', section: 'LFO', label: 'LFO 4 fade time', shortLabel: 'Fade time', min: 0, max: 127, defaultValue: 0, address: { type: 'nrpn', msb: 25, lsb: 43 } },
  { id: 'glideTime', section: 'Glide', label: 'Glide time', shortLabel: 'Time', min: 0, max: 127, defaultValue: 60, address: { type: 'cc', controller: 5 } },
  { id: 'glideOn', section: 'Glide', label: 'Glide on', shortLabel: 'Glide', min: 0, max: 1, defaultValue: 0, address: { type: 'cc', controller: 35 }, valueLabels: offOn },
  { id: 'distortionLevel', section: 'Effects', label: 'Distortion level', shortLabel: 'Distortion', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 104 } },
  { id: 'chorusLevel', section: 'Effects', label: 'Chorus level', shortLabel: 'Chorus', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 105 } },
  { id: 'delayLevel', section: 'Effects', label: 'Delay level', shortLabel: 'Delay', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 108 } },
  { id: 'reverbLevel', section: 'Effects', label: 'Reverb level', shortLabel: 'Reverb', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 112 } },
] as const satisfies readonly ParameterDefinition[]

export type ParameterId = (typeof summitParameters)[number]['id']

export const parameterById = new Map<ParameterId, ParameterDefinition>(
  summitParameters.map((parameter) => [parameter.id, parameter]),
)

export const defaultPatchValues = Object.fromEntries(
  summitParameters.map((parameter) => [parameter.id, parameter.defaultValue]),
) as Record<ParameterId, number>

export function getParameterValueLabel(parameter: ParameterDefinition, value: number) {
  const label = parameter.valueLabels?.[value - parameter.min]
  if (label !== undefined) return label
  if (parameter.displayOffset !== undefined) {
    const signed = value - parameter.displayOffset
    return signed > 0 ? `+${signed}` : String(signed)
  }
  return String(value)
}