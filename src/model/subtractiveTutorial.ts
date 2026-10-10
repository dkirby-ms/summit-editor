import { webSynthDefaultValues, type WebSynthParameterId } from './webSynthProfile'

export const tutorialDismissedStorageKey = 'zinth.web-synth-tutorial-dismissed.v1'

/** A self-paced lesson with an illustrative diagram, actions, and an unchanged patch target. */
export type TutorialLesson = {
  title: string
  shortTitle: string
  takeaway: string
  concept: string
  challenge: readonly string[]
  listen: string
  visual: 'harmonics' | 'blend' | 'filter' | 'amplitude' | 'brightness' | 'vibrato' | 'preset'
  visualCaption: string
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

export const subtractiveLessons: readonly TutorialLesson[] = [
  {
    title: 'Start with harmonics',
    shortTitle: 'Wave',
    takeaway: 'A richer waveform gives you more tone to sculpt.',
    concept: 'An oscillator repeats a waveform to make sound. Sine contains one frequency: the fundamental. Sawtooth and square add harmonics, higher frequencies that make the same note sound brighter.',
    challenge: [
      'Start audio above, then play a note on the keyboard below with Sine selected.',
      'In Oscillator 1, choose Sawtooth. Play the same note, then compare it with Square.',
      'Leave Sawtooth or Square selected to reach the target.',
    ],
    listen: 'Sine sounds smooth and pure. Sawtooth sounds buzzy; Square has a hollow edge. The pitch stays the same, but the tone changes.',
    visual: 'harmonics',
    visualCaption: 'Each bar is a frequency in the sound. Sine has just the fundamental; a sawtooth adds higher harmonics. These are the ingredients a filter can subtract.',
    reward: 'Wave explorer',
    parameters: ['osc1Wave'],
    complete: (v) => v.osc1Wave === 2 || v.osc1Wave === 3,
  },
  {
    title: 'Blend a second oscillator',
    shortTitle: 'Blend',
    takeaway: 'Two nearly matching pitches can make one fuller sound.',
    concept: 'The mixer combines the oscillators. Detune shifts pitch by cents (100 cents is one semitone). A small difference makes the waves move in and out of alignment, creating a slow pulse called beating. This is not FM.',
    challenge: [
      'Keep Oscillator 1 level above 0%. In Mixer, set Oscillator 2 level to 15-60%; try 30%.',
      'Set Oscillator 2 detune 3-15 cents above or below Oscillator 1. Try 0 cents on Oscillator 1 and +7 on Oscillator 2.',
      'Hold a note. Compare the blend with Oscillator 2 level at 0%, then bring it back into the target range.',
    ],
    listen: 'Listen for a gentle pulsing or thicker tone, rather than two separate notes. More detune makes the beating faster.',
    visual: 'blend',
    visualCaption: 'Two waves with slightly different frequencies gradually slip out of alignment. Their sum gets stronger and weaker, producing beating.',
    reward: 'Sound blender',
    parameters: ['osc1Detune', 'osc1Shape', 'osc2Wave', 'osc2Detune', 'osc2Shape', 'osc1Level', 'osc2Level'],
    complete: (v) => v.osc1Level > 0 && v.osc2Level >= 15 && v.osc2Level <= 60
      && Math.abs(v.osc2Detune - v.osc1Detune) >= 3 && Math.abs(v.osc2Detune - v.osc1Detune) <= 15,
  },
  {
    title: 'Subtract with a filter',
    shortTitle: 'Filter',
    takeaway: 'Lower the cutoff to take brightness away.',
    concept: 'A low-pass (LP) filter lets lower frequencies through and reduces higher ones above the cutoff. Resonance emphasizes the area around the cutoff. In this synth, each oscillator has its own filter before the sounds mix.',
    challenge: [
      'In Filter, choose LP for both oscillator filters.',
      'Set both cutoffs to 500-2500 Hz; try 1500 Hz. Set both resonances to 10-40%; try 20%.',
      'Play a note while lowering and raising cutoff. Finish with both filters inside the target ranges.',
    ],
    listen: 'Lower cutoff should make the sound darker or softer in tone. Resonance adds a more focused, sometimes whistling edge near the cutoff.',
    visual: 'filter',
    visualCaption: 'The solid curve is a low-pass response: low frequencies pass, while higher harmonics are reduced. The small bump near cutoff represents resonance.',
    reward: 'Tone sculptor',
    parameters: ['filterType', 'filterCutoff', 'filterResonance', 'filter2Type', 'filter2Cutoff', 'filter2Resonance'],
    complete: (v) => v.filterType === 0 && v.filter2Type === 0
      && v.filterCutoff >= 500 && v.filterCutoff <= 2500 && v.filter2Cutoff >= 500 && v.filter2Cutoff <= 2500
      && v.filterResonance >= 10 && v.filterResonance <= 40 && v.filter2Resonance >= 10 && v.filter2Resonance <= 40,
  },
  {
    title: 'Give the note a shape',
    shortTitle: 'Shape',
    takeaway: 'An envelope turns a steady tone into a gesture.',
    concept: 'The amplifier envelope changes loudness over the life of a note. Attack rises to a peak; decay falls to the sustain level while you hold the key. Release fades to silence after you let go. Sustain is a level, not a duration.',
    challenge: [
      'In Amp envelope, set attack to 0-50 ms and decay to 200-1000 ms. Try 15 ms and 350 ms.',
      'Set sustain to 0-40% and release to 200-1200 ms. Try 30% and 500 ms.',
      'Tap a key, then hold one. Watch the envelope curve below as you change the controls.',
    ],
    listen: 'Hear the quick start, the drop to a quieter held note, and the tail after key-up. A short attack and low sustain give a plucky feel.',
    visual: 'amplitude',
    visualCaption: 'Read left to right: loudness rises during attack, falls during decay, stays at sustain while held, and fades during release after key-up. The control graph below responds to your settings.',
    reward: 'Envelope crafter',
    parameters: ['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease'],
    complete: (v) => v.ampAttack <= 50 && v.ampDecay >= 200 && v.ampDecay <= 1000
      && v.ampSustain <= 40 && v.ampRelease >= 200 && v.ampRelease <= 1200,
  },
  {
    title: 'Animate the brightness',
    shortTitle: 'Brightness',
    takeaway: 'The same envelope idea can shape tone instead of volume.',
    concept: 'The filter envelope moves both cutoffs above their base settings each time a note starts. Amount controls how far they move. The amp envelope still shapes loudness; the filter envelope shapes brightness.',
    challenge: [
      'In Filter envelope, set amount to 30-70%; try 40%.',
      'Set attack to 0-50 ms, decay to 200-1200 ms, and sustain to 0-30%. Try 10 ms, 600 ms, and 20%.',
      'Play repeated notes. Compare amount at 0% with your chosen amount, then return it to 30-70%.',
    ],
    listen: 'Listen for a bright opening that mellows as the note continues. Each new note restarts that change, even when the base cutoffs stay still.',
    visual: 'brightness',
    visualCaption: 'This curve represents cutoff movement, not volume. A note starts at base cutoff, opens the filter, then settles. Amount controls the height of that movement.',
    reward: 'Motion maker',
    parameters: ['filterEnvelopeAmount', 'filterAttack', 'filterDecay', 'filterSustain', 'filterRelease'],
    complete: (v) => v.filterEnvelopeAmount >= 30 && v.filterEnvelopeAmount <= 70
      && v.filterAttack <= 50 && v.filterDecay >= 200 && v.filterDecay <= 1200 && v.filterSustain <= 30,
  },
  {
    title: 'Add a little vibrato',
    shortTitle: 'Vibrato',
    takeaway: 'An LFO repeats a movement instead of making a one-off shape.',
    concept: 'A low-frequency oscillator (LFO) cycles slowly to move another control. Rate is the number of cycles per second, in Hz. Pitch depth is how far the pitch moves, in cents. Small pitch movements are called vibrato.',
    challenge: [
      'In LFO, set rate to 2-8 Hz; try 4 Hz.',
      'Set pitch depth to 5-40 cents; try 10 cents. Cutoff and resonance depth can stay at 0%.',
      'Hold a note and compare a slow rate with a faster one. Finish inside the target ranges.',
    ],
    listen: 'The note gently sways above and below its pitch. Rate changes the speed; depth changes the width. Unlike an envelope, the movement keeps repeating.',
    visual: 'vibrato',
    visualCaption: 'The wave repeats around the original pitch (dashed line). Rate controls cycles per second; depth controls the distance above and below that pitch.',
    reward: 'Modulation explorer',
    parameters: ['lfoRate', 'lfoPitchDepth', 'lfoFilterDepth', 'lfoResonanceDepth'],
    complete: (v) => v.lfoRate >= 2 && v.lfoRate <= 8 && v.lfoPitchDepth >= 5 && v.lfoPitchDepth <= 40,
  },
]

/** The save step uses the same explainer structure but completes through a successful preset save. */
export const tutorialSaveLesson = {
  title: 'Save your sound',
  shortTitle: 'Save',
  takeaway: 'Your patch is a recipe you can return to.',
  concept: 'A preset stores your oscillator, mixer, filter, envelope, and LFO settings together. It remembers how to make the sound, not a recording of the notes you played.',
  challenge: [
    'Play your patch once more. Notice how the waveform, filter, envelopes, and vibrato work together.',
    'Enter a descriptive preset name below, such as "Warm moving pluck".',
    'Choose Save preset to finish, earn your Patch builder badge, and unlock the full editor.',
  ],
  listen: 'Listen for the bright start, softer tail, and gentle pitch movement you built. Once saved, your sound appears under Your browser presets.',
  visual: 'preset',
  visualCaption: 'One preset keeps the whole sound recipe together. Presets are saved only in this browser and site; clearing site data removes them.',
} satisfies Omit<TutorialLesson, 'parameters' | 'complete' | 'reward'>

export function tutorialParameters(step: number) {
  return new Set(subtractiveLessons.slice(0, step + 1).flatMap((lesson) => lesson.parameters))
}
