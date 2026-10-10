import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePatchStore } from '../model/patchStore'
import { ultranovaDefaultValues, ultranovaParameters } from '../model/ultranovaProfile'
import { synthProfileById, ultranovaProfile } from '../model/profiles'
import { SummitMidiEngine, type MidiAccessLike, type MidiInputLike } from './midiEngine'

describe('UltraNova MIDI integration', () => {
  const send = vi.fn()
  const input: MidiInputLike = {
    id: 'ultranova-in', name: 'UltraNova', manufacturer: 'Novation', state: 'connected', onmidimessage: null,
  }
  const access: MidiAccessLike = {
    inputs: new Map([[input.id, input]]),
    outputs: new Map([['ultranova-out', { ...input, id: 'ultranova-out', send }]]),
    onstatechange: null,
  }
  let engine: SummitMidiEngine
  const receive = (controller: number, value: number, channel = 1) =>
    input.onmidimessage?.({ data: new Uint8Array([0xb0 | (channel - 1), controller, value]) })

  beforeEach(async () => {
    usePatchStore.getState().setActiveProfile('ultranova')
    usePatchStore.getState().resetValues()
    send.mockClear()
    engine = new SummitMidiEngine(async () => access, true)
    await engine.connect()
    engine.selectInput(input.id)
    engine.selectOutput('ultranova-out')
  })
  afterEach(() => engine.destroy())

  it('registers complete, uniquely addressed controls with valid ranges and labels', () => {
    expect(synthProfileById.get('ultranova')).toBe(ultranovaProfile)
    expect(ultranovaProfile.capabilities).toMatchObject({ midiInput: true, midiOutput: true, sysex: false, modulationMatrix: false })
    expect(new Set(ultranovaParameters.map((parameter) => parameter.id)).size).toBe(ultranovaParameters.length)
    const addresses = ultranovaParameters.map((parameter) => parameter.address.type === 'cc'
      ? `cc:${parameter.address.controller}` : `nrpn:${parameter.address.msb}:${parameter.address.lsb}`)
    expect(new Set(addresses).size).toBe(addresses.length)
    for (const parameter of ultranovaParameters) {
      expect(parameter.defaultValue).toBeGreaterThanOrEqual(parameter.min)
      expect(parameter.defaultValue).toBeLessThanOrEqual(parameter.max)
      if (parameter.valueLabels) expect(parameter.valueLabels).toHaveLength(parameter.max - parameter.min + 1)
    }
    expect(ultranovaParameters.find((parameter) => parameter.id === 'osc1Wave')?.valueLabels).toHaveLength(72)
    expect(ultranovaDefaultValues.polyphonyMode).toBe(2)
    expect(ultranovaDefaultValues.filterRouting).toBe(3)
  })

  it('sends UltraNova CCs and full NRPN addresses on the selected channel', () => {
    engine.setChannel(3)
    expect(engine.sendParameter('osc1Wave', 13)).toBe(true)
    expect(send).toHaveBeenLastCalledWith([0xb2, 19, 13])
    engine.sendParameter('filter1Cutoff', 99)
    expect(send).toHaveBeenLastCalledWith([0xb2, 74, 99])
    send.mockClear()
    engine.sendParameter('lfo3Rate', 100)
    expect(send.mock.calls.map(([message]) => message)).toEqual([
      [0xb2, 99, 0], [0xb2, 98, 94], [0xb2, 6, 100],
    ])
    send.mockClear()
    engine.sendParameter('arpGate', 90)
    expect(send.mock.calls.map(([message]) => message)).toEqual([
      [0xb2, 99, 1], [0xb2, 98, 64], [0xb2, 6, 90],
    ])
  })

  it('receives CCs and abbreviated bank-zero NRPNs without echoing', () => {
    receive(74, 88)
    receive(98, 1)
    receive(6, 25)
    expect(usePatchStore.getState().values).toMatchObject({ filter1Cutoff: 88, env2Attack: 25 })
    receive(99, 1)
    receive(98, 64)
    receive(6, 100)
    receive(98, 76)
    receive(6, 90)
    expect(usePatchStore.getState().values).toMatchObject({ arpGate: 100, lfo1Rate: 90 })
    receive(38, 10)
    receive(74, 44, 2)
    expect(usePatchStore.getState().values.filter1Cutoff).toBe(88)
    expect(send).not.toHaveBeenCalled()
  })

  it('clears partial NRPN input when the channel or profile changes', () => {
    receive(99, 1)
    receive(98, 64)
    engine.setChannel(2)
    receive(6, 23, 2)
    expect(usePatchStore.getState().values.arpGate).toBe(64)
    receive(99, 1, 2)
    receive(98, 64, 2)
    usePatchStore.getState().setActiveProfile('summit')
    usePatchStore.getState().setActiveProfile('ultranova')
    receive(6, 23, 2)
    expect(usePatchStore.getState().values.arpGate).toBe(64)
    receive(98, 1, 2)
    receive(101, 0, 2)
    receive(6, 90, 2)
    expect(usePatchStore.getState().values.env2Attack).toBe(2)
  })

  it('isolates profile values and routes input only to the selected profile', () => {
    receive(51, 80)
    usePatchStore.getState().setActiveProfile('summit')
    usePatchStore.getState().resetValues()
    const summitValues = { ...usePatchStore.getState().values }
    usePatchStore.getState().setActiveProfile('ultranova')
    receive(51, 70)
    expect(usePatchStore.getState().profileValues.summit).toEqual(summitValues)
    usePatchStore.getState().setActiveProfile('web-synth')
    const webValues = { ...usePatchStore.getState().values }
    receive(51, 60)
    expect(usePatchStore.getState().values).toEqual(webValues)
    expect(usePatchStore.getState().profileValues.ultranova.osc1Mix).toBe(70)
    usePatchStore.getState().setActiveProfile('ultranova')
    expect(usePatchStore.getState().values.osc1Mix).toBe(70)
  })

  it('sends only UltraNova defaults and preserves standard performance MIDI', () => {
    expect(engine.resetHardwareToDefaults()).toBe(true)
    expect(send).toHaveBeenCalledWith([0xb0, 74, 127])
    expect(send).toHaveBeenCalledWith([0xb0, 73, 2])
    const expectedCount = ultranovaParameters.reduce((count, parameter) => count + (parameter.address.type === 'cc' ? 1 : 3), 0)
    expect(send).toHaveBeenCalledTimes(expectedCount)
    engine.sendNoteOn(60, 90)
    expect(send).toHaveBeenLastCalledWith([0x90, 60, 90])
    engine.sendNoteOff(60)
    expect(send).toHaveBeenLastCalledWith([0x80, 60, 0])
    engine.allNotesOff()
    expect(send).toHaveBeenLastCalledWith([0xb0, 123, 0])
  })

  it('blocks Summit-only operations and does not capture UltraNova SysEx as Summit data', async () => {
    expect(engine.requestEditBuffer()).toBe(false)
    expect(engine.sendModMatrixValue(0, 'depth', 80)).toBe(false)
    expect(engine.sendSysex(new Uint8Array([0xf0, 0, 0x20, 0x29, 1, 0xf7]))).toBe(false)
    expect(engine.getSnapshot().error).toContain('not supported for Novation UltraNova')
    expect(send).not.toHaveBeenCalled()
    usePatchStore.getState().setRawPatch(null)
    input.onmidimessage?.({ data: new Uint8Array([0xf0, 0, 0x20, 0x29, 1, 0xf7]) })
    expect(usePatchStore.getState().summitState.rawPatch).toBeNull()
    const request = vi.fn(async () => access)
    const permissionEngine = new SummitMidiEngine(request, true)
    await permissionEngine.connect()
    expect(request).toHaveBeenCalledWith({ sysex: false })
    permissionEngine.destroy()
  })
})
