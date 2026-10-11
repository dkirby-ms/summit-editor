import { SummitMidiAdapter } from './summitMidiAdapter'
import { UltraNovaMidiAdapter } from './ultranovaMidiAdapter'
import type { ModMatrixField } from '../model/modMatrix'
import { usePatchStore } from '../model/patchStore'
import { synthProfileById } from '../model/profiles'

export type MidiStatus =
  | 'unsupported'
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'error'

export type MidiPortInfo = {
  id: string
  name: string
  manufacturer: string
  state: string
}

export type MidiMessageEventLike = { data: Uint8Array }

export type MidiInputLike = MidiPortInfo & {
  onmidimessage: ((event: MidiMessageEventLike) => void) | null
}

export type MidiOutputLike = MidiPortInfo & {
  send: (data: number[] | Uint8Array) => void
}

export type MidiAccessLike = {
  inputs: { values: () => IterableIterator<MidiInputLike> }
  outputs: { values: () => IterableIterator<MidiOutputLike> }
  onstatechange: (() => void) | null
}

type RequestMidiAccess = (options: { sysex: boolean }) => Promise<MidiAccessLike>

export type MidiSnapshot = {
  status: MidiStatus
  inputs: MidiPortInfo[]
  outputs: MidiPortInfo[]
  selectedInputId: string
  selectedOutputId: string
  channel: number
  error: string | null
  activity: string
}

export type MidiInputNoteEvent =
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'allNotesOff' }

const unsupportedSnapshot: MidiSnapshot = {
  status: 'unsupported',
  inputs: [],
  outputs: [],
  selectedInputId: '',
  selectedOutputId: '',
  channel: 1,
  error: null,
  activity: 'Web MIDI is not available in this browser.',
}

function browserRequestAccess(options: { sysex: boolean }): Promise<MidiAccessLike> {
  const midiNavigator = navigator as Navigator & {
    requestMIDIAccess?: (options: { sysex: boolean }) => Promise<MidiAccessLike>
  }

  if (!midiNavigator.requestMIDIAccess) {
    return Promise.reject(new Error('Web MIDI is not available in this browser.'))
  }

  return midiNavigator.requestMIDIAccess(options) as unknown as Promise<MidiAccessLike>
}

export class SummitMidiEngine {
  private access: MidiAccessLike | null = null
  private readonly requestAccess: RequestMidiAccess
  private selectedInput: MidiInputLike | null = null
  private selectedOutput: MidiOutputLike | null = null
  private readonly listeners = new Set<() => void>()
  private readonly inputNoteListeners = new Set<(event: MidiInputNoteEvent) => void>()
  private snapshot: MidiSnapshot
  private readonly adapter: SummitMidiAdapter
  private readonly ultranovaAdapter: UltraNovaMidiAdapter
  private readonly unsubscribeProfile: () => void

  constructor(
    requestAccess: RequestMidiAccess = browserRequestAccess,
    supported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
  ) {
    this.requestAccess = requestAccess
    this.snapshot = supported
      ? { ...unsupportedSnapshot, status: 'idle', activity: 'MIDI access has not been requested.' }
      : unsupportedSnapshot
    this.adapter = new SummitMidiAdapter(
      this.sendMessage,
      () => this.selectedOutput !== null,
      (next) => this.update(next),
      () => this.snapshot.channel,
    )
    this.ultranovaAdapter = new UltraNovaMidiAdapter(
      this.sendMessage,
      () => this.selectedOutput !== null,
      (next) => this.update(next),
      () => this.snapshot.channel,
    )
    this.unsubscribeProfile = usePatchStore.subscribe((state, previous) => {
      if (state.activeProfileId !== previous.activeProfileId) this.resetInputState()
    })
  }

  private resetInputState() {
    this.adapter.resetInputState()
    this.ultranovaAdapter.resetInputState()
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  subscribeToInputNotes = (listener: (event: MidiInputNoteEvent) => void) => {
    this.inputNoteListeners.add(listener)
    return () => this.inputNoteListeners.delete(listener)
  }

  private update(next: Partial<MidiSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next }
    this.listeners.forEach((listener) => listener())
  }

  async connect() {
    if (this.snapshot.status === 'unsupported') return
    this.update({ status: 'requesting', error: null, activity: 'Requesting MIDI and SysEx access...' })

    try {
      this.access = await this.requestAccess({ sysex: synthProfileById.get(usePatchStore.getState().activeProfileId)?.capabilities.sysex ?? false })
      this.access.onstatechange = () => this.refreshPorts()
      this.refreshPorts()
      this.update({ status: 'ready', activity: 'MIDI access granted.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MIDI access was denied.'
      this.update({ status: 'error', error: message, activity: message })
    }
  }

  refreshPorts() {
    if (!this.access) return
    const inputs = Array.from(this.access.inputs.values())
    const outputs = Array.from(this.access.outputs.values())

    if (this.selectedInput && !inputs.some((input) => input.id === this.selectedInput?.id)) {
      this.selectInput('')
    }
    if (this.selectedOutput && !outputs.some((output) => output.id === this.selectedOutput?.id)) {
      this.selectOutput('')
    }

    this.update({ inputs: inputs.map(this.toPortInfo), outputs: outputs.map(this.toPortInfo) })
  }

  private toPortInfo(port: MidiPortInfo): MidiPortInfo {
    return {
      id: port.id,
      name: port.name || 'Unnamed MIDI port',
      manufacturer: port.manufacturer || 'Unknown maker',
      state: port.state,
    }
  }

  selectInput(id: string) {
    if (this.selectedInput && this.selectedInput.id !== id) this.notifyInputNotes({ type: 'allNotesOff' })
    if (this.selectedInput) this.selectedInput.onmidimessage = null
    this.resetInputState()
    this.selectedInput = this.access
      ? Array.from(this.access.inputs.values()).find((input) => input.id === id) ?? null
      : null
    if (this.selectedInput) {
      this.selectedInput.onmidimessage = (event) => {
        this.handleInputNote(event)
        const profileId = usePatchStore.getState().activeProfileId
        if (profileId === 'summit') this.adapter.handleMessage(event, this.snapshot.channel)
        if (profileId === 'ultranova') this.ultranovaAdapter.handleMessage(event, this.snapshot.channel)
      }
    }
    this.update({
      selectedInputId: this.selectedInput?.id ?? '',
      activity: this.selectedInput ? `Listening to ${this.selectedInput.name}.` : 'No MIDI input selected.',
    })
  }

  selectOutput(id: string) {
    const nextOutput = this.access
      ? Array.from(this.access.outputs.values()).find((output) => output.id === id) ?? null
      : null
    if (this.selectedOutput && this.selectedOutput.id !== nextOutput?.id) {
      this.notifyInputNotes({ type: 'allNotesOff' })
      this.allNotesOff()
    }
    this.selectedOutput = nextOutput
    this.update({
      selectedOutputId: this.selectedOutput?.id ?? '',
      activity: this.selectedOutput ? `Sending to ${this.selectedOutput.name}.` : 'No MIDI output selected.',
    })
  }

  setChannel(channel: number) {
    const nextChannel = Math.min(16, Math.max(1, Math.round(channel)))
    if (nextChannel !== this.snapshot.channel) {
      this.notifyInputNotes({ type: 'allNotesOff' })
      this.resetInputState()
    }
    this.update({ channel: nextChannel })
  }

  sendParameter(id: string, value: number) {
    const profileId = usePatchStore.getState().activeProfileId
    if (profileId === 'ultranova') return this.ultranovaAdapter.sendParameter(id, value)
    if (profileId === 'summit') return this.adapter.sendParameter(id, value)
    return this.unsupportedOperation('Hardware parameter editing')
  }

  sendModMatrixValue(slotIndex: number, field: ModMatrixField, value: number) {
    if (usePatchStore.getState().activeProfileId !== 'summit') return this.unsupportedOperation('Modulation matrix editing')
    return this.adapter.sendModMatrixValue(slotIndex, field, value)
  }

  sendNoteOn(note: number, velocity = 100) {
    if (!this.selectedOutput) return false
    const midiNote = Math.min(127, Math.max(0, Math.round(note)))
    const midiVelocity = Math.min(127, Math.max(1, Math.round(velocity)))
    this.selectedOutput.send([0x90 | (this.snapshot.channel - 1), midiNote, midiVelocity])
    this.update({ activity: `Note on: ${midiNote}.` })
    return true
  }

  sendNoteOff(note: number) {
    if (!this.selectedOutput) return false
    const midiNote = Math.min(127, Math.max(0, Math.round(note)))
    this.selectedOutput.send([0x80 | (this.snapshot.channel - 1), midiNote, 0])
    this.update({ activity: `Note off: ${midiNote}.` })
    return true
  }

  /** Sends sustain-off, explicit note-offs, and panic controllers on the selected channel only. */
  allNotesOff() {
    if (!this.selectedOutput) return false
    const channel = this.snapshot.channel - 1
    this.selectedOutput.send([0xb0 | channel, 64, 0])
    for (let note = 0; note < 128; note += 1) {
      this.selectedOutput.send([0x80 | channel, note, 0])
    }
    this.selectedOutput.send([0xb0 | channel, 120, 0])
    this.selectedOutput.send([0xb0 | channel, 123, 0])
    this.update({ activity: 'All notes off.' })
    return true
  }

  resetHardwareToDefaults() {
    const profileId = usePatchStore.getState().activeProfileId
    if (profileId === 'ultranova') return this.ultranovaAdapter.resetHardwareToDefaults()
    if (profileId === 'summit') return this.adapter.resetHardwareToDefaults()
    return this.unsupportedOperation('Hardware reset')
  }

  sendSysex(data: Uint8Array) {
    if (usePatchStore.getState().activeProfileId !== 'summit') return this.unsupportedOperation('SysEx transfer')
    return this.adapter.sendSysex(data)
  }

  requestEditBuffer() {
    if (usePatchStore.getState().activeProfileId !== 'summit') return this.unsupportedOperation('Edit-buffer requests')
    return this.adapter.requestEditBuffer()
  }

  private unsupportedOperation(operation: string) {
    const name = synthProfileById.get(usePatchStore.getState().activeProfileId)?.name
    const message = `${operation} is not supported for ${name}.`
    this.update({ status: 'error', error: message, activity: message })
    return false
  }

  private sendMessage = (data: number[] | Uint8Array) => {
    if (!this.selectedOutput) return false
    this.selectedOutput.send(data)
    return true
  }

  private handleInputNote(event: MidiMessageEventLike) {
    const data = event.data
    if (data.length < 3 || (data[0] & 0x0f) + 1 !== this.snapshot.channel) return
    const status = data[0] & 0xf0
    if (status === 0x90 && data[2] > 0) {
      this.notifyInputNotes({ type: 'noteOn', note: data[1], velocity: data[2] })
    } else if (status === 0x80 || status === 0x90) {
      this.notifyInputNotes({ type: 'noteOff', note: data[1] })
    } else if (status === 0xb0 && (data[1] === 120 || data[1] === 123)) {
      this.notifyInputNotes({ type: 'allNotesOff' })
    }
  }

  private notifyInputNotes(event: MidiInputNoteEvent) {
    this.inputNoteListeners.forEach((listener) => listener(event))
  }

  destroy() {
    this.unsubscribeProfile()
    this.notifyInputNotes({ type: 'allNotesOff' })
    if (this.selectedInput) this.selectedInput.onmidimessage = null
    if (this.access) this.access.onstatechange = null
    this.selectedInput = null
    this.selectedOutput = null
    this.listeners.clear()
    this.inputNoteListeners.clear()
  }
}

export const midiEngine = new SummitMidiEngine()