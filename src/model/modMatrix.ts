export const modMatrixSources = [
  'Direct',
  'Mod wheel',
  'Aftertouch',
  'Expression pedal 1',
  'Breath pedal 2',
  'Velocity',
  'Keyboard',
  'LFO 1 +',
  'LFO 1 +/-',
  'LFO 2 +',
  'LFO 2 +/-',
  'Amp envelope',
  'Mod envelope 1',
  'Mod envelope 2',
  'Animate 1',
  'Animate 2',
  'CV +/-',
  'LFO 3 +',
  'LFO 3 +/-',
  'LFO 4 +',
  'LFO 4 +/-',
  'Bend wheel +',
  'Bend wheel -',
] as const

export const modMatrixDestinations = [
  'Osc 1+2+3 pitch',
  'Oscillator 1 pitch',
  'Oscillator 2 pitch',
  'Oscillator 3 pitch',
  'Oscillator 1 virtual sync',
  'Oscillator 2 virtual sync',
  'Oscillator 3 virtual sync',
  'Oscillator 1 shape',
  'Oscillator 2 shape',
  'Oscillator 3 shape',
  'Oscillator 1 level',
  'Oscillator 2 level',
  'Oscillator 3 level',
  'Noise level',
  'Ring mod level',
  'VCA level',
  'Filter drive',
  'Filter distortion',
  'Filter frequency',
  'Filter resonance',
  'LFO 1 rate',
  'LFO 2 rate',
  'Amp envelope attack',
  'Amp envelope decay',
  'Amp envelope release',
  'Mod envelope 1 attack',
  'Mod envelope 1 decay',
  'Mod envelope 1 release',
] as const

export type ModMatrixField = 'sourceA' | 'sourceB' | 'depth' | 'destination'

export type ModMatrixSlot = {
  sourceA: number
  sourceB: number
  depth: number
  destination: number
}

export const defaultModMatrix: ModMatrixSlot[] = Array.from({ length: 16 }, () => ({
  sourceA: 0,
  sourceB: 0,
  depth: 64,
  destination: 0,
}))

export function clampModMatrixValue(field: ModMatrixField, value: number) {
  const max = field === 'sourceA' || field === 'sourceB'
    ? modMatrixSources.length - 1
    : field === 'destination'
      ? modMatrixDestinations.length - 1
      : 127
  return Math.min(max, Math.max(0, Math.round(value)))
}
