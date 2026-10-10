import type { HardwareParameterDefinition } from './parameters'

const waveformLabels = [
  'Sine', 'Triangle', 'Sawtooth',
  ...Array.from({ length: 9 }, (_, index) => `Saw${9 - index}:${index + 1}PW`),
  'Pulse width', 'Square', 'BassCamp', 'Bass FM', 'EP Dull', 'EP Bell', 'Clav',
  'Double reed', 'Retro', 'String machine 1', 'String machine 2', 'Organ 1', 'Organ 2',
  'Evil organ', 'HiStuff', 'Bell FM 1', 'Bell FM 2',
  'Digital bell 1', 'Digital bell 2', 'Digital bell 3', 'Digital bell 4', 'Digital pad',
  ...Array.from({ length: 36 }, (_, index) => `Wavetable ${index + 1}`),
  'Audio input L', 'Audio input R',
]

const filterLabels = [
  'LP 6 (no resonance)', 'LP 12', 'LP 18', 'LP 24',
  'BP 6/6', 'BP 12/12', 'BP 6/12', 'BP 12/6', 'BP 6/18', 'BP 18/6',
  'HP 6 (no resonance)', 'HP 12', 'HP 18', 'HP 24',
]

function cc(id: string, section: string, label: string, shortLabel: string, controller: number, defaultValue: number, options: Partial<HardwareParameterDefinition> = {}): HardwareParameterDefinition {
  return { id, section, label, shortLabel, min: 0, max: 127, defaultValue, ...options, address: { type: 'cc', controller } }
}

function nrpn(id: string, section: string, label: string, shortLabel: string, msb: number, lsb: number, defaultValue: number, options: Partial<HardwareParameterDefinition> = {}): HardwareParameterDefinition {
  return { id, section, label, shortLabel, min: 0, max: 127, defaultValue, ...options, address: { type: 'nrpn', msb, lsb } }
}

// Addresses follow Novation's UltraNova MIDI implementation, not the Summit table.
export const ultranovaParameters: readonly HardwareParameterDefinition[] = [
  ...[1, 2, 3].flatMap((oscillator) => {
    const section = `Oscillator ${oscillator}`
    const prefix = `osc${oscillator}`
    const wave = [19, 29, 41][oscillator - 1]
    const sync = [22, 33, 44][oscillator - 1]
    const coarse = [26, 37, 48][oscillator - 1]
    const fine = [27, 39, 49][oscillator - 1]
    return [
      cc(`${prefix}Wave`, section, `${section} wave`, 'Wave', wave, 2, { max: 71, valueLabels: waveformLabels }),
      cc(`${prefix}Coarse`, section, `${section} coarse tuning`, 'Coarse', coarse, 64, { displayOffset: 64 }),
      cc(`${prefix}Fine`, section, `${section} fine tuning`, 'Fine', fine, 64, { min: 14, max: 114, displayOffset: 64 }),
      cc(`${prefix}Shape`, section, `${section} pulse width / wavetable index`, 'PW / index', wave + 2, 64, { displayOffset: 64 }),
      cc(`${prefix}Sync`, section, `${section} virtual sync`, 'V-sync', sync, 0),
      cc(`${prefix}Hardness`, section, `${section} hardness`, 'Hardness', sync + 1, 127),
      cc(`${prefix}Density`, section, `${section} density`, 'Density', sync + 2, 0),
      cc(`${prefix}DensityDetune`, section, `${section} density detune`, 'Density detune', sync + 3, 0),
      cc(`${prefix}Interpolate`, section, `${section} wavetable interpolation`, 'WT interp', wave + 1, 127),
    ]
  }),
  cc('osc1Mix', 'Mixer', 'Oscillator 1 level', 'Osc 1', 51, 127),
  cc('osc2Mix', 'Mixer', 'Oscillator 2 level', 'Osc 2', 52, 0),
  cc('osc3Mix', 'Mixer', 'Oscillator 3 level', 'Osc 3', 53, 0),
  cc('ring13Mix', 'Mixer', 'Oscillator 1 × 3 ring modulation level', 'Ring 1 × 3', 54, 0),
  cc('ring23Mix', 'Mixer', 'Oscillator 2 × 3 ring modulation level', 'Ring 2 × 3', 55, 0),
  cc('noiseMix', 'Mixer', 'Noise level', 'Noise', 56, 0),
  ...[1, 2].flatMap((filter) => {
    const section = `Filter ${filter}`
    const prefix = `filter${filter}`
    return [
      cc(`${prefix}Cutoff`, section, `${section} cutoff`, 'Cutoff', filter === 1 ? 74 : 83, 127, { prominent: true }),
      cc(`${prefix}Resonance`, section, `${section} resonance`, 'Resonance', filter === 1 ? 71 : 85, 0),
      cc(`${prefix}Type`, section, `${section} type`, 'Type', filter === 1 ? 68 : 82, 3, { max: 13, valueLabels: filterLabels }),
      cc(`${prefix}Track`, section, `${section} key tracking`, 'Key track', filter === 1 ? 69 : 84, 127),
      cc(`${prefix}Drive`, section, `${section} drive`, 'Drive', filter === 1 ? 63 : 80, 0),
      cc(`${prefix}Envelope`, section, `${section} envelope depth`, 'Env > cutoff', filter === 1 ? 79 : 87, 64, { displayOffset: 64 }),
    ]
  }),
  cc('filterBalance', 'Filter routing', 'Filter balance', 'Balance', 61, 0, { displayOffset: 64 }),
  cc('filterRouting', 'Filter routing', 'Filter routing', 'Routing', 60, 3, { max: 5, valueLabels: ['Bypass', 'Single', 'Series', 'Parallel', 'Parallel 2', 'Drum'] }),
  ...(['Attack', 'Decay', 'Sustain', 'Release'] as const).map((stage, index) =>
    cc(`amp${stage}`, 'Amp envelope', `Amplifier envelope ${stage.toLowerCase()}`, stage, [73, 75, 70, 72][index], [2, 90, 127, 40][index], { fader: true })),
  ...[2, 3, 4, 5, 6].flatMap((envelope) =>
    (['Attack', 'Decay', 'Sustain', 'Release'] as const).map((stage, index) =>
      nrpn(`env${envelope}${stage}`, `Envelope ${envelope}`, `Envelope ${envelope} ${stage.toLowerCase()}`, stage, 0,
        envelope === 2 ? index + 1 : 15 + (envelope - 3) * 14 + index,
        (envelope === 2 ? [2, 75, 35, 45] : [10, 70, 64, 40])[index], { fader: true }))),
  ...[1, 2, 3].flatMap((lfo) => {
    const section = `LFO ${lfo}`
    const base = 70 + (lfo - 1) * 9
    return [
      nrpn(`lfo${lfo}Wave`, section, `${section} waveform`, 'Wave', 0, base, 0, {
        max: 36,
        valueLabels: ['Sine', 'Triangle', 'Sawtooth', 'Square', 'Random S/H', 'Time S/H', 'Piano envelope',
          ...Array.from({ length: 7 }, (_, index) => `Sequence ${index + 1}`),
          ...Array.from({ length: 8 }, (_, index) => `Alternating ${index + 1}`),
          'Chromatic', 'Major', 'Major 7', 'Minor 7', 'Minor arp 1', 'Minor arp 2',
          'Diminished', 'Descending minor', 'Minor 3rd', 'Pedal', '4ths', '4ths × 12',
          '1625 major', '1625 minor', '2511'],
      }),
      nrpn(`lfo${lfo}Rate`, section, `${section} rate`, 'Rate', 0, base + 6, 68),
      nrpn(`lfo${lfo}Slew`, section, `${section} slew`, 'Slew', 0, base + 2, 0),
      nrpn(`lfo${lfo}Delay`, section, `${section} delay`, 'Delay', 0, base + 4, 0),
    ]
  }),
  ...[1, 2, 3, 4, 5].flatMap((slot) => [
    nrpn(`fx${slot}Type`, 'Effects', `Effect slot ${slot} type`, `Slot ${slot} type`, 0, 98 + slot, 0, {
      max: 14, valueLabels: ['Bypass', 'EQ', 'Compressor 1', 'Compressor 2', 'Distortion 1', 'Distortion 2',
        'Delay 1', 'Delay 2', 'Reverb 1', 'Reverb 2', 'Chorus / phaser 1', 'Chorus / phaser 2',
        'Chorus / phaser 3', 'Chorus / phaser 4', 'Gator'],
    }),
    cc(`fx${slot}Level`, 'Effects', `Effect slot ${slot} level`, `Slot ${slot} level`, 90 + slot, 64),
  ]),
  cc('portamentoRate', 'Glide', 'Portamento rate', 'Time', 5, 0),
  cc('portamentoMode', 'Glide', 'Portamento mode', 'Mode', 12, 0, { max: 1, valueLabels: ['Exponential', 'Linear'] }),
  cc('polyphonyMode', 'Voice', 'Polyphony mode', 'Mode', 3, 2, { max: 4, valueLabels: ['Mono', 'Mono AG', 'Poly 1', 'Poly 2', 'Mono 2'] }),
  cc('unisonCount', 'Voice', 'Unison voices', 'Unison', 14, 0, { max: 3, valueLabels: ['Off', '2', '3', '4'] }),
  cc('unisonDetune', 'Voice', 'Unison detune', 'Detune', 15, 25),
  cc('oscDrift', 'Voice', 'Oscillator drift', 'Drift', 16, 0),
  nrpn('arpOctaves', 'Arp', 'Arpeggiator octaves', 'Octaves', 1, 62, 1, { min: 1, max: 8 }),
  nrpn('arpGate', 'Arp', 'Arpeggiator gate', 'Gate', 1, 64, 64),
]

export const ultranovaDefaultValues = Object.fromEntries(
  ultranovaParameters.map((parameter) => [parameter.id, parameter.defaultValue]),
)
