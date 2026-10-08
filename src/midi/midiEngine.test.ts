import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultModMatrix } from '../model/modMatrix'
import { defaultPatchValues } from '../model/parameters'
import { usePatchStore } from '../model/patchStore'
import { SummitMidiEngine, type MidiAccessLike, type MidiInputLike, type MidiOutputLike } from './midiEngine'

function makePorts() {
  const input: MidiInputLike = {
    id: 'summit-in', name: 'Summit MIDI In', manufacturer: 'Novation', state: 'connected', onmidimessage: null,
  }
  const send = vi.fn()
  const output: MidiOutputLike = {
    id: 'summit-out', name: 'Summit MIDI Out', manufacturer: 'Novation', state: 'connected', send,
  }
  const access: MidiAccessLike = {
    inputs: new Map([[input.id, input]]), outputs: new Map([[output.id, output]]), onstatechange: null,
  }
  return { input, output, send, access }
}

describe('Summit MIDI engine', () => {
  beforeEach(() => usePatchStore.setState({
    values: { ...defaultPatchValues },
    modMatrix: defaultModMatrix.map((slot) => ({ ...slot })),
    rawPatch: null,
    rawPatchSource: null,
  }))

  it('connects, selects ports, and sends documented CC and NRPN messages', async () => {
    const { access, send } = makePorts()
    const engine = new SummitMidiEngine(async () => access, true)
    await engine.connect()
    engine.selectInput('summit-in')
    engine.selectOutput('summit-out')
    engine.setChannel(2)

    expect(engine.getSnapshot()).toMatchObject({ status: 'ready', selectedInputId: 'summit-in', selectedOutputId: 'summit-out', channel: 2 })
    expect(engine.sendParameter('filterResonance', 45)).toBe(true)
    expect(send).toHaveBeenCalledWith([0xb1, 79, 45])
    engine.sendParameter('osc1Wave', 3)
    expect(send).toHaveBeenNthCalledWith(2, [0xb1, 99, 0])
    expect(send).toHaveBeenNthCalledWith(3, [0xb1, 98, 14])
    engine.sendParameter('osc2Mix', 44)
    expect(send).toHaveBeenCalledWith([0xb1, 24, 44])
    engine.sendParameter('vcaLevel', 100)
    expect(send).toHaveBeenCalledWith([0xb1, 98, 42])
    engine.sendParameter('filterDualType', 5)
    expect(send).toHaveBeenCalledWith([0xb1, 99, 25])
    expect(send).toHaveBeenCalledWith([0xb1, 98, 9])
    engine.sendParameter('osc3BendRange', 12)
    expect(send).toHaveBeenCalledWith([0xb1, 98, 38])
  })

  it('reflects inbound CC and captures valid SysEx without echoing', async () => {
    const { access, input, send } = makePorts()
    const engine = new SummitMidiEngine(async () => access, true)
    await engine.connect()
    engine.selectInput('summit-in')
    engine.selectOutput('summit-out')
    input.onmidimessage?.({ data: new Uint8Array([0xb0, 86, 72]) })
    expect(usePatchStore.getState().values.ampAttack).toBe(72)
    input.onmidimessage?.({ data: new Uint8Array([0xb0, 24, 73]) })
    expect(usePatchStore.getState().values.osc2Mix).toBe(73)
    expect(send).not.toHaveBeenCalled()

    const patch = new Uint8Array([0xf0, 0x00, 0x20, 0x29, 0x01, 0xf7])
    input.onmidimessage?.({ data: patch })
    expect(Array.from(usePatchStore.getState().rawPatch!)).toEqual(Array.from(patch))
    expect(usePatchStore.getState().rawPatchSource).toBe('device')
  })

  it('assembles inbound NRPN messages and reflects the registered parameter without echoing', async () => {
    const { access, input, send } = makePorts()
    const engine = new SummitMidiEngine(async () => access, true)
    await engine.connect()
    engine.selectInput('summit-in')
    engine.selectOutput('summit-out')

    input.onmidimessage?.({ data: new Uint8Array([0xb0, 99, 0]) })
    input.onmidimessage?.({ data: new Uint8Array([0xb0, 98, 14]) })
    input.onmidimessage?.({ data: new Uint8Array([0xb0, 6, 4]) })

    expect(usePatchStore.getState().values.osc1Wave).toBe(4)
    expect(send).not.toHaveBeenCalled()
  })

  it('sends selected modulation-matrix NRPN fields and reflects inbound values without echoing', async () => {
    const { access, input, send } = makePorts()
    const engine = new SummitMidiEngine(async () => access, true)
    await engine.connect()
    engine.selectInput('summit-in')
    engine.selectOutput('summit-out')
    engine.setChannel(2)

    expect(engine.sendModMatrixValue(2, 'destination', 18)).toBe(true)
    expect(send).toHaveBeenNthCalledWith(1, [0xb1, 99, 0])
    expect(send).toHaveBeenNthCalledWith(2, [0xb1, 98, 125])
    expect(send).toHaveBeenNthCalledWith(3, [0xb1, 6, 2])
    expect(send).toHaveBeenNthCalledWith(4, [0xb1, 99, 3])
    expect(send).toHaveBeenNthCalledWith(5, [0xb1, 98, 3])
    expect(send).toHaveBeenNthCalledWith(6, [0xb1, 6, 18])

    send.mockClear()
    for (const [controller, value] of [[99, 0], [98, 125], [6, 2], [99, 3], [98, 0], [6, 8]]) {
      input.onmidimessage?.({ data: new Uint8Array([0xb1, controller, value]) })
    }
    expect(usePatchStore.getState().modMatrix[2].sourceA).toBe(8)
    expect(send).not.toHaveBeenCalled()
  })

  it('treats CC 38 as Osc 2 ModEnv2 pitch unless it follows NRPN data entry', async () => {
    const { access, input } = makePorts()
    const engine = new SummitMidiEngine(async () => access, true)
    await engine.connect()
    engine.selectInput('summit-in')

    input.onmidimessage?.({ data: new Uint8Array([0xb0, 38, 90]) })
    expect(usePatchStore.getState().values.osc2ModEnv2Pitch).toBe(90)

    input.onmidimessage?.({ data: new Uint8Array([0xb0, 99, 0]) })
    input.onmidimessage?.({ data: new Uint8Array([0xb0, 98, 14]) })
    input.onmidimessage?.({ data: new Uint8Array([0xb0, 6, 2]) })
    input.onmidimessage?.({ data: new Uint8Array([0xb0, 38, 0]) })
    expect(usePatchStore.getState().values.osc1Wave).toBe(2)
    expect(usePatchStore.getState().values.osc2ModEnv2Pitch).toBe(90)
  })

  it('sends channel-aware note on, note off, and all-notes-off messages', async () => {
    const { access, send } = makePorts()
    const engine = new SummitMidiEngine(async () => access, true)
    await engine.connect()
    engine.selectOutput('summit-out')
    engine.setChannel(3)

    expect(engine.sendNoteOn(60, 96)).toBe(true)
    expect(engine.sendNoteOff(60)).toBe(true)
    expect(engine.allNotesOff()).toBe(true)
    expect(send).toHaveBeenNthCalledWith(1, [0x92, 60, 96])
    expect(send).toHaveBeenNthCalledWith(2, [0x82, 60, 0])
    expect(send).toHaveBeenNthCalledWith(3, [0xb2, 123, 0])
  })

  it('rejects malformed SysEx, cleans listeners, and reports access errors', async () => {
    const { access, input } = makePorts()
    const engine = new SummitMidiEngine(async () => access, true)
    await engine.connect()
    engine.selectInput('summit-in')
    input.onmidimessage?.({ data: new Uint8Array([0xf0, 0x01]) })
    expect(usePatchStore.getState().rawPatch).toBeNull()
    engine.selectInput('')
    expect(input.onmidimessage).toBeNull()

    const denied = new SummitMidiEngine(async () => { throw new Error('Permission denied') }, true)
    await denied.connect()
    expect(denied.getSnapshot()).toMatchObject({ status: 'error', error: 'Permission denied' })
  })

  it('sends registered defaults once per encoded message only while connected', async () => {
    const { access, send } = makePorts()
    const engine = new SummitMidiEngine(async () => access, true)
    expect(engine.resetHardwareToDefaults()).toBe(false)
    await engine.connect()
    engine.selectOutput('summit-out')
    expect(engine.resetHardwareToDefaults()).toBe(true)
    expect(send).toHaveBeenCalled()
    expect(send.mock.calls.filter(([message]) => message[1] === 86)).toHaveLength(1)
    const calls = send.mock.calls.map(([message]) => message as number[])
    const nrpns = calls.flatMap((message, index) => (message[1] === 98 ? [`${calls[index - 1][2]}:${message[2]}`] : []))
    expect(nrpns).toContain('0:46')
    expect(nrpns).toContain('0:2')
    expect(nrpns).toContain('0:9')
    expect(nrpns).not.toContain('25:9')
    expect(nrpns).not.toContain('25:10')
    expect(nrpns).not.toContain('0:12')
    expect(calls.filter((message) => message[1] === 38)).toHaveLength(1)
    expect(send).toHaveBeenCalledWith([0xb0, 34, 0])
  })
})