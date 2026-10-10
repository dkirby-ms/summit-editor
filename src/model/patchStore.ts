import { create } from 'zustand'
import {
  clampModMatrixValue,
  defaultModMatrix,
  type ModMatrixField,
} from './modMatrix'
import type { SynthProfile, SynthProfileId } from './profiles'
import { summitProfile, synthProfiles } from './profiles'

type PatchState = {
  activeProfileId: SynthProfileId
  profileValues: Record<string, Record<string, number>>
  values: Record<string, number>
  summitState: {
    modMatrix: typeof defaultModMatrix
    rawPatch: Uint8Array | null
    rawPatchSource: 'device' | 'file' | null
  }
  setActiveProfile: (id: SynthProfileId) => void
  setValue: (id: string, value: number) => void
  setProfileValue: (profileId: SynthProfileId, id: string, value: number) => void
  applyProfileValues: (id: SynthProfileId, values: Readonly<Record<string, number>>) => void
  setModMatrixValue: (slotIndex: number, field: ModMatrixField, value: number) => void
  resetValues: () => void
  setRawPatch: (rawPatch: Uint8Array | null, source?: 'device' | 'file' | null) => void
}

function copyDefaults(profile: SynthProfile) {
  return { ...profile.defaultValues }
}

function createSummitState(): PatchState['summitState'] {
  return {
    modMatrix: defaultModMatrix.map((slot) => ({ ...slot })),
    rawPatch: null,
    rawPatchSource: null,
  }
}

export function createPatchStore(profiles: readonly SynthProfile[] = synthProfiles) {
  if (profiles.length === 0) throw new Error('At least one synth profile is required.')
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  const initialProfile = profiles[0]
  const initialValues = copyDefaults(initialProfile)

  return create<PatchState>((set, get) => ({
    activeProfileId: initialProfile.id,
    profileValues: { [initialProfile.id]: initialValues },
    values: initialValues,
    summitState: createSummitState(),
    setActiveProfile: (id) => {
      const profile = profilesById.get(id)
      if (!profile) throw new RangeError(`Unknown synth profile: ${id}`)
      set((state) => {
        const values = state.profileValues[id] ?? copyDefaults(profile)
        return {
          activeProfileId: id,
          profileValues: state.profileValues[id] ? state.profileValues : { ...state.profileValues, [id]: values },
          values,
        }
      })
    },
    setValue: (id, value) => {
      const profile = profilesById.get(get().activeProfileId)
      const parameter = profile?.parameters.find((item) => item.id === id)
      if (!parameter) return
      if (!Number.isFinite(value)) throw new RangeError(`Parameter ${id} must be a finite number.`)
      const clamped = Math.min(parameter.max, Math.max(parameter.min, value))
      set((state) => {
        const values = { ...state.values, [id]: clamped }
        return {
          values,
          profileValues: { ...state.profileValues, [state.activeProfileId]: values },
        }
      })
    },
    setProfileValue: (profileId, id, value) => {
      const profile = profilesById.get(profileId)
      const parameter = profile?.parameters.find((item) => item.id === id)
      if (!profile || !parameter) return
      if (!Number.isFinite(value)) throw new RangeError(`Parameter ${id} must be a finite number.`)
      const clamped = Math.min(parameter.max, Math.max(parameter.min, value))
      set((state) => {
        const values = { ...(state.profileValues[profileId] ?? copyDefaults(profile)), [id]: clamped }
        return {
          profileValues: { ...state.profileValues, [profileId]: values },
          ...(state.activeProfileId === profileId ? { values } : {}),
        }
      })
    },
    applyProfileValues: (id, nextValues) => {
      const profile = profilesById.get(id)
      if (!profile) throw new RangeError(`Unknown synth profile: ${id}`)
      const parameterIds = profile.parameters.map((parameter) => parameter.id)
      if (
        Object.keys(nextValues).length !== parameterIds.length
        || parameterIds.some((parameterId) => !Object.hasOwn(nextValues, parameterId) || !Number.isFinite(nextValues[parameterId]))
      ) {
        throw new RangeError(`Values for profile ${id} must include one finite value for every parameter.`)
      }
      const values = Object.fromEntries(profile.parameters.map((parameter) => [
        parameter.id,
        Math.min(parameter.max, Math.max(parameter.min, nextValues[parameter.id])),
      ]))
      set((state) => ({
        profileValues: { ...state.profileValues, [id]: values },
        ...(state.activeProfileId === id ? { values } : {}),
      }))
    },
    setModMatrixValue: (slotIndex, field, value) => {
      if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= defaultModMatrix.length) return
      const clamped = clampModMatrixValue(field, value)
      set((state) => ({
        summitState: {
          ...state.summitState,
          modMatrix: state.summitState.modMatrix.map((slot, index) => index === slotIndex ? { ...slot, [field]: clamped } : slot),
        },
      }))
    },
    resetValues: () => set((state) => {
      const profile = profilesById.get(state.activeProfileId)
      if (!profile) throw new RangeError(`Unknown synth profile: ${state.activeProfileId}`)
      const values = copyDefaults(profile)
      return {
        values,
        profileValues: { ...state.profileValues, [state.activeProfileId]: values },
        ...(state.activeProfileId === summitProfile.id
          ? { summitState: { ...state.summitState, modMatrix: createSummitState().modMatrix } }
          : {}),
      }
    }),
    setRawPatch: (rawPatch, source = null) => set((state) => ({
      summitState: {
        ...state.summitState,
        rawPatch: rawPatch ? new Uint8Array(rawPatch) : null,
        rawPatchSource: rawPatch ? source : null,
      },
    })),
  }))
}

export const usePatchStore = createPatchStore(synthProfiles)