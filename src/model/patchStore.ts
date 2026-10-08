import { create } from 'zustand'
import {
  clampModMatrixValue,
  defaultModMatrix,
  type ModMatrixField,
} from './modMatrix'
import { defaultPatchValues, parameterById, type ParameterId } from './parameters'

type PatchState = {
  values: Record<ParameterId, number>
  modMatrix: typeof defaultModMatrix
  rawPatch: Uint8Array | null
  rawPatchSource: 'device' | 'file' | null
  setValue: (id: ParameterId, value: number) => void
  setModMatrixValue: (slotIndex: number, field: ModMatrixField, value: number) => void
  resetValues: () => void
  setRawPatch: (rawPatch: Uint8Array | null, source?: 'device' | 'file' | null) => void
}

export const usePatchStore = create<PatchState>((set) => ({
  values: { ...defaultPatchValues },
  modMatrix: defaultModMatrix.map((slot) => ({ ...slot })),
  rawPatch: null,
  rawPatchSource: null,
  setValue: (id, value) => {
    const parameter = parameterById.get(id)
    if (!parameter) return
    const clamped = Math.min(parameter.max, Math.max(parameter.min, value))
    set((state) => ({ values: { ...state.values, [id]: clamped } }))
  },
  setModMatrixValue: (slotIndex, field, value) => {
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= defaultModMatrix.length) return
    const clamped = clampModMatrixValue(field, value)
    set((state) => ({
      modMatrix: state.modMatrix.map((slot, index) => index === slotIndex ? { ...slot, [field]: clamped } : slot),
    }))
  },
  resetValues: () => set({
    values: { ...defaultPatchValues },
    modMatrix: defaultModMatrix.map((slot) => ({ ...slot })),
  }),
  setRawPatch: (rawPatch, source = null) => set({
    rawPatch: rawPatch ? new Uint8Array(rawPatch) : null,
    rawPatchSource: rawPatch ? source : null,
  }),
}))