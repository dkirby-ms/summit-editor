import { beforeEach, describe, expect, it } from 'vitest'
import { defaultPatchValues } from './parameters'
import { usePatchStore } from './patchStore'

describe('patch store', () => {
  beforeEach(() => usePatchStore.setState({ values: { ...defaultPatchValues }, rawPatch: null, rawPatchSource: null }))

  it('clamps updates to the registered parameter range', () => {
    usePatchStore.getState().setValue('osc1Wave', 20)
    expect(usePatchStore.getState().values.osc1Wave).toBe(4)
  })

  it('resets values and copies raw patch bytes', () => {
    usePatchStore.getState().setValue('ampAttack', 99)
    const source = new Uint8Array([0xf0, 0x01, 0xf7])
    usePatchStore.getState().setRawPatch(source, 'device')
    source[1] = 0x02
    expect(Array.from(usePatchStore.getState().rawPatch!)).toEqual([0xf0, 0x01, 0xf7])
    expect(usePatchStore.getState().rawPatchSource).toBe('device')
    usePatchStore.getState().resetValues()
    expect(usePatchStore.getState().values).toEqual(defaultPatchValues)
  })
})