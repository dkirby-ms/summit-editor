import { beforeEach, describe, expect, it } from 'vitest'
import { defaultModMatrix } from './modMatrix'
import { defaultPatchValues } from './parameters'
import { usePatchStore } from './patchStore'

describe('patch store', () => {
  beforeEach(() => usePatchStore.setState({
    values: { ...defaultPatchValues },
    modMatrix: defaultModMatrix.map((slot) => ({ ...slot })),
    rawPatch: null,
    rawPatchSource: null,
  }))

  it('clamps updates to the registered parameter range', () => {
    usePatchStore.getState().setValue('osc1Wave', 20)
    expect(usePatchStore.getState().values.osc1Wave).toBe(4)
  })

  it('resets values and copies raw patch bytes', () => {
    usePatchStore.getState().setValue('ampAttack', 99)
    usePatchStore.getState().setModMatrixValue(0, 'depth', 99)
    const source = new Uint8Array([0xf0, 0x01, 0xf7])
    usePatchStore.getState().setRawPatch(source, 'device')
    source[1] = 0x02
    expect(Array.from(usePatchStore.getState().rawPatch!)).toEqual([0xf0, 0x01, 0xf7])
    expect(usePatchStore.getState().rawPatchSource).toBe('device')
    usePatchStore.getState().resetValues()
    expect(usePatchStore.getState().values).toEqual(defaultPatchValues)
    expect(usePatchStore.getState().modMatrix).toEqual(defaultModMatrix)
  })

  it('clamps modulation matrix values to their control ranges', () => {
    const store = usePatchStore.getState()
    store.setModMatrixValue(15, 'sourceA', 99)
    store.setModMatrixValue(15, 'sourceB', -1)
    store.setModMatrixValue(15, 'destination', 99)
    store.setModMatrixValue(15, 'depth', 128)
    store.setModMatrixValue(-1, 'depth', 0)

    expect(usePatchStore.getState().modMatrix[15]).toEqual({
      sourceA: 22,
      sourceB: 0,
      destination: 27,
      depth: 127,
    })
    expect(usePatchStore.getState().modMatrix).toHaveLength(16)
  })
})