import { webSynthDefaultValues, type WebSynthParameterId } from './webSynthProfile'

type Lesson = {
  title: string
  concept: string
  challenge: string
  reward: string
  parameters: readonly WebSynthParameterId[]
  complete: (values: Readonly<Record<string, number>>) => boolean
}

export const tutorialInitialValues = {
  ...webSynthDefaultValues,
  osc1Wave: 0,
  osc2Wave: 2,
  osc2Level: 0,
  filterCutoff: 12000,
  filter2Cutoff: 12000,
  filterResonance: 0,
  filter2Resonance: 0,
  filterEnvelopeAmount: 0,
  lfoPitchDepth: 0,
  lfoFilterDepth: 0,
  lfoResonanceDepth: 0,
}

export const subtractiveLessons: readonly Lesson[] = [
  {
    title: 'Start with harmonics',
    concept: 'An oscillator repeats a waveform to make sound. A sine has only a fundamental pitch. Sawtooth and square waves add harmonics (overtones), giving us material to subtract later.',
    challenge: 'Choose Sawtooth or Square on oscillator 1. Start audio, then play the keyboard below to compare it with Sine.',
    reward: 'Wave explorer',
    parameters: ['osc1Wave'],
    complete: (v) => v.osc1Wave === 2 || v.osc1Wave === 3,
  },
  {
    title: 'Blend a second oscillator',
    concept: 'The mixer combines sound sources. A small detune between oscillators creates beating: a slow pulsing that thickens the tone. This is not frequency modulation.',
    challenge: 'Set oscillator 2 level to 15-60% and its detune 3-15 cents above or below oscillator 1. Play a held note and listen for beating.',
    reward: 'Sound blender',
    parameters: ['osc1Detune', 'osc1Shape', 'osc2Wave', 'osc2Detune', 'osc2Shape', 'osc1Level', 'osc2Level'],
    complete: (v) => v.osc1Level > 0 && v.osc2Level >= 15 && v.osc2Level <= 60
      && Math.abs(v.osc2Detune - v.osc1Detune) >= 3 && Math.abs(v.osc2Detune - v.osc1Detune) <= 15,
  },
  {
    title: 'Subtract with a filter',
    concept: 'A low-pass (LP) filter removes harmonics above its cutoff. Resonance emphasizes frequencies near that cutoff. Each oscillator has its own filter before the sounds reach the amplifier.',
    challenge: 'Keep both filters on LP. Set both cutoffs to 500-2500 Hz and both resonances to 10-40%. Play while moving cutoff to hear brightness change.',
    reward: 'Tone sculptor',
    parameters: ['filterType', 'filterCutoff', 'filterResonance', 'filter2Type', 'filter2Cutoff', 'filter2Resonance'],
    complete: (v) => v.filterType === 0 && v.filter2Type === 0
      && v.filterCutoff >= 500 && v.filterCutoff <= 2500 && v.filter2Cutoff >= 500 && v.filter2Cutoff <= 2500
      && v.filterResonance >= 10 && v.filterResonance <= 40 && v.filter2Resonance >= 10 && v.filter2Resonance <= 40,
  },
  {
    title: 'Give the note a shape',
    concept: 'The amplifier envelope controls loudness over time. Attack rises, decay falls to sustain while a key is held, and release fades after you let go. A quick attack and low sustain make a plucky sound.',
    challenge: 'Set amp attack to 0-50 ms, decay to 200-1000 ms, sustain to 0-40%, and release to 200-1200 ms. Tap a key, then hold one to compare.',
    reward: 'Envelope crafter',
    parameters: ['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease'],
    complete: (v) => v.ampAttack <= 50 && v.ampDecay >= 200 && v.ampDecay <= 1000
      && v.ampSustain <= 40 && v.ampRelease >= 200 && v.ampRelease <= 1200,
  },
  {
    title: 'Animate the brightness',
    concept: 'The filter envelope moves both filter cutoffs relative to their base settings each time you play a note. It shapes brightness, not loudness; the amp envelope still controls volume.',
    challenge: 'Set filter envelope amount to 30-70%, filter attack to 0-50 ms, decay to 200-1200 ms, and sustain to 0-30%. Listen for a bright start that mellows.',
    reward: 'Motion maker',
    parameters: ['filterEnvelopeAmount', 'filterAttack', 'filterDecay', 'filterSustain', 'filterRelease'],
    complete: (v) => v.filterEnvelopeAmount >= 30 && v.filterEnvelopeAmount <= 70
      && v.filterAttack <= 50 && v.filterDecay >= 200 && v.filterDecay <= 1200 && v.filterSustain <= 30,
  },
  {
    title: 'Add a little vibrato',
    concept: 'A low-frequency oscillator (LFO) repeats slowly to move another control. A small pitch depth adds vibrato. Unlike an envelope, the motion repeats while the note sounds.',
    challenge: 'Set LFO rate to 2-8 Hz and pitch depth to 5-40 cents. Hold a note to hear the pitch gently sway. Cutoff and resonance depth can stay at zero.',
    reward: 'Modulation explorer',
    parameters: ['lfoRate', 'lfoPitchDepth', 'lfoFilterDepth', 'lfoResonanceDepth'],
    complete: (v) => v.lfoRate >= 2 && v.lfoRate <= 8 && v.lfoPitchDepth >= 5 && v.lfoPitchDepth <= 40,
  },
]

export function tutorialParameters(step: number) {
  return new Set(subtractiveLessons.slice(0, step + 1).flatMap((lesson) => lesson.parameters))
}
