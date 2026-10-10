import { describe, expect, it } from 'vitest'
import { summitProfile, synthProfileById, synthProfileIds, synthProfiles, webSynthProfile } from './profiles'
import type { ParameterDefinition } from './parameters'
import { webSynthParameters, webSynthPresets } from './webSynthProfile'

describe('synth profiles', () => {
  it('uses stable profile identifiers independent of display names', () => {
    expect(summitProfile.id).toBe('summit')
    expect(synthProfileIds.webSynth).toBe('web-synth')
    expect(summitProfile.name).toBe('Novation Summit')
    expect(synthProfileById.get(synthProfileIds.summit)).toBe(summitProfile)
    expect(synthProfiles).toEqual([summitProfile, webSynthProfile])
  })

  it('allows profile parameter definitions without hardware addresses', () => {
    const parameter: ParameterDefinition = {
      id: 'oscillator-wave',
      section: 'Oscillator',
      label: 'Oscillator wave',
      shortLabel: 'Wave',
      min: 0,
      max: 1,
      defaultValue: 0,
    }

    expect(parameter.id).toBe('oscillator-wave')
    expect('address' in parameter).toBe(false)
  })

  it('declares Summit-only hardware capabilities on its profile', () => {
    expect(summitProfile.capabilities).toEqual({
      audioOutput: false,
      midiInput: true,
      midiOutput: true,
      modulationMatrix: true,
      sysex: true,
    })
  })

  it('defines independent Web Audio controls and complete profile presets', () => {
    expect(webSynthProfile.capabilities).toEqual({
      audioOutput: true,
      midiInput: true,
      midiOutput: false,
      modulationMatrix: false,
      sysex: false,
    })
    expect(webSynthParameters.every((parameter) => !('address' in parameter))).toBe(true)
    expect(webSynthProfile.presets).toBe(webSynthPresets)
    for (const preset of webSynthPresets) {
      expect(Object.keys(preset.values).sort()).toEqual(
        webSynthParameters.map((parameter) => parameter.id).sort(),
      )
    }
    expect(webSynthParameters.map((parameter) => parameter.id)).toEqual(expect.arrayContaining([
      'osc1Wave', 'osc2Wave', 'osc1Detune', 'osc2Detune', 'filterCutoff', 'filterResonance',
      'filterEnvelopeAmount', 'ampAttack', 'ampDecay', 'ampSustain', 'ampRelease',
      'filterAttack', 'filterDecay', 'filterSustain', 'filterRelease', 'lfoRate',
      'lfoPitchDepth', 'lfoFilterDepth',
    ]))
  })
})
