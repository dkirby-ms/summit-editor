import { create } from 'zustand'
import { defaultPatchValues, parameterById, type ParameterId } from './parameters'

type PatchState = {
  values: Record<ParameterId, number>
  rawPatch: Uint8Array | null
  rawPatchSource: 'device' | 'file' | null
  setValue: (id: ParameterId, value: number) => void
  resetValues: () => void
  setRawPatch: (rawPatch: Uint8Array | null, source?: 'device' | 'file' | null) => void
}

export const usePatchStore = create<PatchState>((set) => ({
  values: { ...defaultPatchValues },
  rawPatch: null,
  rawPatchSource: null,
  setValue: (id, value) => {
    const parameter = parameterById.get(id)
    if (!parameter) return
    const clamped = Math.min(parameter.max, Math.max(parameter.min, value))
    set((state) => ({ values: { ...state.values, [id]: clamped } }))
  },
  resetValues: () => set({ values: { ...defaultPatchValues } }),
  setRawPatch: (rawPatch, source = null) => set({
    rawPatch: rawPatch ? new Uint8Array(rawPatch) : null,
    rawPatchSource: rawPatch ? source : null,
  }),
}))