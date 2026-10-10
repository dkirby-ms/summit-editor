import { beforeEach, describe, expect, it } from 'vitest'
import { defaultModMatrix } from './modMatrix'
import { defaultPatchValues } from './parameters'
import { createPatchStore, usePatchStore } from './patchStore'
import { summitProfile, webSynthProfile } from './profiles'
import { webSynthPresets } from './webSynthProfile'

describe('patch store', () => {
  beforeEach(() => usePatchStore.setState({
    activeProfileId: summitProfile.id,
    profileValues: { [summitProfile.id]: { ...defaultPatchValues } },
    values: { ...defaultPatchValues },
    summitState: {
      modMatrix: defaultModMatrix.map((slot) => ({ ...slot })),
      rawPatch: null,
      rawPatchSource: null,
    },
  }))

  it('defaults to the built-in Web Synth profile', () => {
    const store = createPatchStore()

    expect(store.getState().activeProfileId).toBe(webSynthProfile.id)
    expect(store.getState().values).toEqual(webSynthProfile.defaultValues)
  })

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
    expect(Array.from(usePatchStore.getState().summitState.rawPatch!)).toEqual([0xf0, 0x01, 0xf7])
    expect(usePatchStore.getState().summitState.rawPatchSource).toBe('device')
    usePatchStore.getState().resetValues()
    expect(usePatchStore.getState().values).toEqual(defaultPatchValues)
    expect(usePatchStore.getState().summitState.modMatrix).toEqual(defaultModMatrix)
  })

  it('clamps modulation matrix values to their control ranges', () => {
    const store = usePatchStore.getState()
    store.setModMatrixValue(15, 'sourceA', 99)
    store.setModMatrixValue(15, 'sourceB', -1)
    store.setModMatrixValue(15, 'destination', 99)
    store.setModMatrixValue(15, 'depth', 128)
    store.setModMatrixValue(-1, 'depth', 0)

    expect(usePatchStore.getState().summitState.modMatrix[15]).toEqual({
      sourceA: 22,
      sourceB: 0,
      destination: 27,
      depth: 127,
    })
    expect(usePatchStore.getState().summitState.modMatrix).toHaveLength(16)
  })

  it('isolates serializable parameter values by stable profile ID', () => {
    const store = createPatchStore([summitProfile, webSynthProfile])

    store.getState().setValue('osc1Wave', 4)
    store.getState().setActiveProfile(webSynthProfile.id)
    expect(store.getState().values).toEqual(webSynthProfile.defaultValues)
    store.getState().setValue('filterCutoff', 13000)
    expect(store.getState().values.filterCutoff).toBe(12000)

    store.getState().setActiveProfile(summitProfile.id)
    expect(store.getState().values.osc1Wave).toBe(4)
    store.getState().setActiveProfile(webSynthProfile.id)
    expect(store.getState().values.filterCutoff).toBe(12000)
    expect(JSON.parse(JSON.stringify(store.getState().profileValues))).toEqual({
      [summitProfile.id]: { ...defaultPatchValues, osc1Wave: 4 },
      [webSynthProfile.id]: { ...webSynthProfile.defaultValues, filterCutoff: 12000 },
    })
  })

  it('updates an inactive profile without mutating the active profile values', () => {
    const store = createPatchStore([summitProfile, webSynthProfile])
    store.getState().setActiveProfile(webSynthProfile.id)
    store.getState().setProfileValue(summitProfile.id, 'ampAttack', 70)

    expect(store.getState().activeProfileId).toBe(webSynthProfile.id)
    expect(store.getState().values.ampAttack).toBe(webSynthProfile.defaultValues.ampAttack)
    expect(store.getState().profileValues[summitProfile.id].ampAttack).toBe(70)
    store.getState().setActiveProfile(summitProfile.id)
    expect(store.getState().values.ampAttack).toBe(70)
  })

  it('resets only the active profile values and resets the Summit matrix only on Summit', () => {
    const store = createPatchStore([summitProfile, webSynthProfile])
    store.getState().setModMatrixValue(0, 'depth', 100)
    store.getState().setValue('osc1Wave', 4)
    store.getState().setActiveProfile(webSynthProfile.id)
    store.getState().setValue('filterCutoff', 9000)
    store.getState().resetValues()
    expect(store.getState().values).toEqual(webSynthProfile.defaultValues)
    expect(store.getState().summitState.modMatrix[0].depth).toBe(100)
    store.getState().setActiveProfile(summitProfile.id)
    store.getState().resetValues()
    expect(store.getState().values).toEqual(defaultPatchValues)
    expect(store.getState().summitState.modMatrix).toEqual(defaultModMatrix)
  })

  it('applies a complete preset only to the named profile and validates its shape', () => {
    const store = createPatchStore([summitProfile, webSynthProfile])
    const preset = webSynthPresets[0]

    store.getState().applyProfileValues(webSynthProfile.id, preset.values)
    expect(store.getState().activeProfileId).toBe(summitProfile.id)
    store.getState().setActiveProfile(webSynthProfile.id)
    expect(store.getState().values).toEqual(preset.values)

    expect(() => store.getState().applyProfileValues(webSynthProfile.id, { filterCutoff: 400 })).toThrow(/every parameter/)
  })
})