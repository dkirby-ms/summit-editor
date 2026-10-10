import {
  defaultPatchValues,
  summitParameters,
  type ParameterDefinition,
} from './parameters'
import { webSynthDefaultValues, webSynthParameters, webSynthPresets } from './webSynthProfile'

export const synthProfileIds = {
  summit: 'summit',
  webSynth: 'web-synth',
} as const

export type SynthProfileId = (typeof synthProfileIds)[keyof typeof synthProfileIds]

export type SynthProfileCapabilities = {
  audioOutput: boolean
  midiInput: boolean
  midiOutput: boolean
  modulationMatrix: boolean
  sysex: boolean
}

export type SynthPreset = {
  id: string
  name: string
  values: Readonly<Record<string, number>>
}

export type SynthProfile<Parameters extends readonly ParameterDefinition[] = readonly ParameterDefinition[]> = {
  id: SynthProfileId
  name: string
  parameters: Parameters
  defaultValues: Readonly<Record<Parameters[number]['id'], number>>
  capabilities: Readonly<SynthProfileCapabilities>
  presets?: readonly SynthPreset[]
}

export const summitProfile = {
  id: synthProfileIds.summit,
  name: 'Novation Summit',
  parameters: summitParameters,
  defaultValues: defaultPatchValues,
  capabilities: {
    audioOutput: false,
    midiInput: true,
    midiOutput: true,
    modulationMatrix: true,
    sysex: true,
  },
} satisfies SynthProfile<typeof summitParameters>

export const webSynthProfile = {
  id: synthProfileIds.webSynth,
  name: 'Built-in Web Synth',
  parameters: webSynthParameters,
  defaultValues: webSynthDefaultValues,
  capabilities: {
    audioOutput: true,
    midiInput: true,
    midiOutput: false,
    modulationMatrix: false,
    sysex: false,
  },
  presets: webSynthPresets,
} satisfies SynthProfile<typeof webSynthParameters>

export const synthProfiles = [summitProfile, webSynthProfile] as const satisfies readonly SynthProfile[]

export const synthProfileById = new Map<SynthProfileId, SynthProfile>(
  synthProfiles.map((profile): [SynthProfileId, SynthProfile] => [profile.id, profile]),
)
