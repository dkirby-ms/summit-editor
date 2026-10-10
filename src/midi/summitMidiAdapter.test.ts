import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultModMatrix } from '../model/modMatrix'
import { defaultPatchValues } from '../model/parameters'
import { usePatchStore } from '../model/patchStore'
import { SummitMidiAdapter } from './summitMidiAdapter'

describe('Summit MIDI adapter', () => {
  beforeEach(() => usePatchStore.setState({
    activeProfileId: 'summit',
    profileValues: { summit: { ...defaultPatchValues } },
    values: { ...defaultPatchValues },
    summitState: {
      modMatrix: defaultModMatrix.map((slot) => ({ ...slot })),
      rawPatch: null,
      rawPatchSource: null,
    },
  }))

  it('owns Summit parameter encodings and identifies the Summit profile', () => {
    const sendMessage = vi.fn(() => true)
    const adapter = new SummitMidiAdapter(sendMessage, () => true, vi.fn(), () => 2)

    expect(adapter.profileId).toBe('summit')
    expect(adapter.sendParameter('osc1Wave', 3)).toBe(true)
    expect(sendMessage).toHaveBeenNthCalledWith(1, [0xb1, 99, 0])
    expect(sendMessage).toHaveBeenNthCalledWith(2, [0xb1, 98, 14])
    expect(sendMessage).toHaveBeenNthCalledWith(3, [0xb1, 6, 3])
  })

  it('reflects Summit input and handles Summit-specific modulation and SysEx', () => {
    const update = vi.fn()
    const adapter = new SummitMidiAdapter(vi.fn(() => true), () => true, update, () => 1)

    adapter.handleMessage({ data: new Uint8Array([0xb0, 86, 70]) }, 1)
    expect(usePatchStore.getState().values.ampAttack).toBe(70)

    const patch = new Uint8Array([0xf0, 0x00, 0x20, 0x29, 0x01, 0xf7])
    adapter.handleMessage({ data: patch }, 1)
    expect(Array.from(usePatchStore.getState().summitState.rawPatch!)).toEqual(Array.from(patch))
    expect(adapter.sendSysex(patch)).toBe(true)
  })

  it('reflects Summit controller input into Summit state without changing active Web Synth values', () => {
    const adapter = new SummitMidiAdapter(vi.fn(() => true), () => true, vi.fn(), () => 1)
    usePatchStore.getState().setActiveProfile('web-synth')
    const webAttack = usePatchStore.getState().values.ampAttack

    adapter.handleMessage({ data: new Uint8Array([0xb0, 86, 70]) }, 1)

    expect(usePatchStore.getState().values.ampAttack).toBe(webAttack)
    expect(usePatchStore.getState().profileValues.summit.ampAttack).toBe(70)
  })

  it('does not reset Summit defaults or send matrix data when no output is selected', () => {
    const sendMessage = vi.fn(() => false)
    const adapter = new SummitMidiAdapter(sendMessage, () => false, vi.fn(), () => 1)

    expect(adapter.resetHardwareToDefaults()).toBe(false)
    expect(adapter.sendModMatrixValue(0, 'depth', 50)).toBe(false)
    expect(sendMessage).not.toHaveBeenCalled()
  })
})
