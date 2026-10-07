export type ParameterSection =
  | 'Oscillator'
  | 'Filter'
  | 'Envelope'
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
  valueLabels?: readonly string[]
}

export const summitParameters = [
  { id: 'osc1Wave', section: 'Oscillator', label: 'Oscillator 1 wave', shortLabel: 'Wave', min: 0, max: 4, defaultValue: 2, address: { type: 'nrpn', msb: 0, lsb: 14 }, valueLabels: ['Sine', 'Triangle', 'Saw', 'Square', 'Wavetable'] },
  { id: 'osc1Shape', section: 'Oscillator', label: 'Oscillator 1 manual shape', shortLabel: 'Shape', min: 0, max: 127, defaultValue: 64, address: { type: 'cc', controller: 12 } },
  { id: 'filterShape', section: 'Filter', label: 'Filter shape', shortLabel: 'Shape', min: 0, max: 2, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 46 }, valueLabels: ['Low-pass', 'Band-pass', 'High-pass'] },
  { id: 'filterOverdrive', section: 'Filter', label: 'Filter overdrive', shortLabel: 'Drive', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 80 } },
  { id: 'filterResonance', section: 'Filter', label: 'Filter resonance', shortLabel: 'Resonance', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 79 } },
  { id: 'ampAttack', section: 'Envelope', label: 'Amplifier envelope attack', shortLabel: 'Attack', min: 0, max: 127, defaultValue: 0, address: { type: 'cc', controller: 86 } },
  { id: 'ampDecay', section: 'Envelope', label: 'Amplifier envelope decay', shortLabel: 'Decay', min: 0, max: 127, defaultValue: 90, address: { type: 'cc', controller: 87 } },
  { id: 'ampSustain', section: 'Envelope', label: 'Amplifier envelope sustain', shortLabel: 'Sustain', min: 0, max: 127, defaultValue: 127, address: { type: 'cc', controller: 88 } },
  { id: 'ampRelease', section: 'Envelope', label: 'Amplifier envelope release', shortLabel: 'Release', min: 0, max: 127, defaultValue: 40, address: { type: 'cc', controller: 89 } },
  { id: 'lfo1Wave', section: 'LFO', label: 'LFO 1 wave', shortLabel: 'Wave', min: 0, max: 3, defaultValue: 0, address: { type: 'nrpn', msb: 0, lsb: 69 }, valueLabels: ['Triangle', 'Saw', 'Square', 'Sample & hold'] },
  { id: 'lfo1SyncRate', section: 'LFO', label: 'LFO 1 sync rate', shortLabel: 'Sync rate', min: 0, max: 34, defaultValue: 16, address: { type: 'cc', controller: 81 } },
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
  return parameter.valueLabels?.[value] ?? String(value)
}