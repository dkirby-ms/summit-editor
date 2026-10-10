import { describe, expect, it } from 'vitest'
import { subtractiveLessons, tutorialInitialValues, tutorialParameters } from './subtractiveTutorial'
import { webSynthParameters, type WebSynthParameterId } from './webSynthProfile'

const targets = [
  { osc1Wave: 2 },
  { osc2Level: 30, osc2Detune: 7 },
  { filterType: 0, filter2Type: 0, filterCutoff: 1500, filter2Cutoff: 1500, filterResonance: 20, filter2Resonance: 20 },
  { ampAttack: 15, ampDecay: 350, ampSustain: 30, ampRelease: 500 },
  { filterEnvelopeAmount: 40, filterAttack: 10, filterDecay: 600, filterSustain: 30 },
  { lfoRate: 4, lfoPitchDepth: 10 },
]

describe('subtractive tutorial challenges', () => {
  it('begins with a complete pure, unmodulated patch and unlocks only cumulative controls', () => {
    expect(Object.keys(tutorialInitialValues)).toHaveLength(webSynthParameters.length)
    expect(tutorialInitialValues).toMatchObject({ osc1Wave: 0, osc2Level: 0, filterEnvelopeAmount: 0, lfoPitchDepth: 0 })
    let previous = new Set<WebSynthParameterId>()
    for (let step = 0; step < subtractiveLessons.length; step++) {
      const unlocked = tutorialParameters(step)
      for (const parameter of previous) expect(unlocked.has(parameter)).toBe(true)
      for (const parameter of subtractiveLessons[step].parameters) expect(unlocked.has(parameter)).toBe(true)
      if (step + 1 < subtractiveLessons.length) {
        for (const parameter of subtractiveLessons[step + 1].parameters) expect(unlocked.has(parameter)).toBe(false)
      }
      previous = unlocked
    }
  })

  it.each(targets.map((target, step) => ({ target, step })))('accepts the target for lesson $step', ({ target, step }) => {
    expect(subtractiveLessons[step].complete({ ...tutorialInitialValues, ...target })).toBe(true)
  })

  it.each([
    [0, { osc1Wave: 1 }],
    [1, { osc2Level: 14 }],
    [1, { osc2Level: 61 }],
    [1, { osc2Detune: 2 }],
    [1, { osc2Detune: 16 }],
    [1, { osc1Level: 0 }],
    [2, { filterCutoff: 499 }],
    [2, { filterCutoff: 2501 }],
    [2, { filter2Cutoff: 499 }],
    [2, { filter2Resonance: 41 }],
    [2, { filterResonance: 9 }],
    [2, { filter2Type: 1 }],
    [3, { ampAttack: 51 }],
    [3, { ampDecay: 199 }],
    [3, { ampDecay: 1001 }],
    [3, { ampSustain: 41 }],
    [3, { ampRelease: 199 }],
    [3, { ampRelease: 1201 }],
    [4, { filterEnvelopeAmount: 29 }],
    [4, { filterEnvelopeAmount: 71 }],
    [4, { filterAttack: 51 }],
    [4, { filterDecay: 199 }],
    [4, { filterDecay: 1201 }],
    [4, { filterSustain: 31 }],
    [5, { lfoRate: 1 }],
    [5, { lfoRate: 9 }],
    [5, { lfoPitchDepth: 4 }],
    [5, { lfoPitchDepth: 41 }],
  ] as const)('rejects out-of-target values in lesson %i: %o', (step, invalid) => {
    expect(subtractiveLessons[step].complete({ ...tutorialInitialValues, ...targets[step], ...invalid })).toBe(false)
  })

  it('accepts both inclusive edges and negative relative detune', () => {
    const lower = [
      { osc1Wave: 3 },
      { osc2Level: 15, osc1Detune: 10, osc2Detune: 7 },
      { filterCutoff: 500, filter2Cutoff: 500, filterResonance: 10, filter2Resonance: 10 },
      { ampAttack: 0, ampDecay: 200, ampSustain: 0, ampRelease: 200 },
      { filterEnvelopeAmount: 30, filterAttack: 0, filterDecay: 200, filterSustain: 0 },
      { lfoRate: 2, lfoPitchDepth: 5 },
    ]
    const upper = [
      { osc1Wave: 2 },
      { osc2Level: 60, osc2Detune: 15 },
      { filterCutoff: 2500, filter2Cutoff: 2500, filterResonance: 40, filter2Resonance: 40 },
      { ampAttack: 50, ampDecay: 1000, ampSustain: 40, ampRelease: 1200 },
      { filterEnvelopeAmount: 70, filterAttack: 50, filterDecay: 1200, filterSustain: 30 },
      { lfoRate: 8, lfoPitchDepth: 40 },
    ]
    for (const edges of [lower, upper]) {
      edges.forEach((target, step) => expect(subtractiveLessons[step].complete({ ...tutorialInitialValues, ...targets[step], ...target })).toBe(true))
    }
  })
})
