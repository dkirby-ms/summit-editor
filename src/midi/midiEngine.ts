import { decodeCcMessage, encodeParameter } from './codec'
import { SUMMIT_EDIT_BUFFER_REQUEST, validateSysex } from './sysex'
import {
  parameterById,
  summitParameters,
  type ParameterDefinition,
  type ParameterId,
} from '../model/parameters'
import { usePatchStore } from '../model/patchStore'

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

type MidiMessageEventLike = { data: Uint8Array }

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

type RequestMidiAccess = () => Promise<MidiAccessLike>

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

function browserRequestAccess(): Promise<MidiAccessLike> {
  const midiNavigator = navigator as Navigator & {
    requestMIDIAccess?: (options: { sysex: boolean }) => Promise<MidiAccessLike>
  }

  if (!midiNavigator.requestMIDIAccess) {
    return Promise.reject(new Error('Web MIDI is not available in this browser.'))
  }

  return midiNavigator.requestMIDIAccess({ sysex: true }) as unknown as Promise<MidiAccessLike>
}

export class SummitMidiEngine {
  private access: MidiAccessLike | null = null
  private readonly requestAccess: RequestMidiAccess
  private inboundNrpn: { msb: number | null; lsb: number | null } = { msb: null, lsb: null }
  private selectedInput: MidiInputLike | null = null
  private selectedOutput: MidiOutputLike | null = null
  private readonly listeners = new Set<() => void>()
  private snapshot: MidiSnapshot

  constructor(
    requestAccess: RequestMidiAccess = browserRequestAccess,
    supported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
  ) {
    this.requestAccess = requestAccess
    this.snapshot = supported
      ? { ...unsupportedSnapshot, status: 'idle', activity: 'MIDI access has not been requested.' }
      : unsupportedSnapshot
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  private update(next: Partial<MidiSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next }
    this.listeners.forEach((listener) => listener())
  }

  async connect() {
    if (this.snapshot.status === 'unsupported') return
    this.update({ status: 'requesting', error: null, activity: 'Requesting MIDI and SysEx access...' })

    try {
      this.access = await this.requestAccess()
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
    if (this.selectedInput) this.selectedInput.onmidimessage = null
    this.inboundNrpn = { msb: null, lsb: null }
    this.selectedInput = this.access
      ? Array.from(this.access.inputs.values()).find((input) => input.id === id) ?? null
      : null
    if (this.selectedInput) this.selectedInput.onmidimessage = this.handleMessage
    this.update({
      selectedInputId: this.selectedInput?.id ?? '',
      activity: this.selectedInput ? `Listening to ${this.selectedInput.name}.` : 'No MIDI input selected.',
    })
  }

  selectOutput(id: string) {
    this.selectedOutput = this.access
      ? Array.from(this.access.outputs.values()).find((output) => output.id === id) ?? null
      : null
    this.update({
      selectedOutputId: this.selectedOutput?.id ?? '',
      activity: this.selectedOutput ? `Sending to ${this.selectedOutput.name}.` : 'No MIDI output selected.',
    })
  }

  setChannel(channel: number) {
    const nextChannel = Math.min(16, Math.max(1, Math.round(channel)))
    this.update({ channel: nextChannel })
  }

  sendParameter(id: ParameterId, value: number) {
    const parameter = parameterById.get(id)
    if (!parameter || !this.selectedOutput) return false
    encodeParameter(this.snapshot.channel, parameter, value).forEach((message) => this.selectedOutput?.send(message))
    this.update({ activity: `Sent ${parameter.shortLabel}: ${value}.` })
    return true
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

  allNotesOff() {
    if (!this.selectedOutput) return false
    this.selectedOutput.send([0xb0 | (this.snapshot.channel - 1), 123, 0])
    this.update({ activity: 'All notes off.' })
    return true
  }

  resetHardwareToDefaults() {
    if (!this.selectedOutput) return false
    summitParameters.forEach((parameter: ParameterDefinition) => {
      if (!parameter.unverifiedEncoding) this.sendParameter(parameter.id as ParameterId, parameter.defaultValue)
    })
    this.update({ activity: 'Sent registered defaults to Summit.' })
    return true
  }

  sendSysex(data: Uint8Array) {
    const validation = validateSysex(data)
    if (!validation.valid) {
      this.update({ status: 'error', error: validation.reason, activity: validation.reason ?? 'Invalid SysEx.' })
      return false
    }
    if (!this.selectedOutput) return false
    this.selectedOutput.send(data)
    this.update({ error: null, activity: `Sent ${data.length} SysEx bytes.` })
    return true
  }

  requestEditBuffer() {
    const sent = this.sendSysex(SUMMIT_EDIT_BUFFER_REQUEST)
    if (sent) this.update({ activity: 'Experimental edit-buffer request sent.' })
    return sent
  }

  private handleMessage = (event: MidiMessageEventLike) => {
    const data = new Uint8Array(event.data)
    if (data[0] === 0xf0) {
      const validation = validateSysex(data)
      if (validation.valid) {
        usePatchStore.getState().setRawPatch(data, 'device')
        this.update({ activity: `Captured ${data.length} SysEx bytes from Summit.` })
      }
      return
    }

    const message = decodeCcMessage(data)
    if (!message || message.channel !== this.snapshot.channel) return

    if (message.controller === 99) {
      this.inboundNrpn = { msb: message.value === 127 ? null : message.value, lsb: null }
      return
    }
    if (message.controller === 98) {
      this.inboundNrpn.lsb = message.value === 127 ? null : message.value
      return
    }
    if (message.controller === 101 || message.controller === 100) {
      this.inboundNrpn = { msb: null, lsb: null }
      return
    }
    if (message.controller === 6 && this.inboundNrpn.msb !== null && this.inboundNrpn.lsb !== null) {
      const parameter = summitParameters.find(
        (candidate) => candidate.address.type === 'nrpn'
          && candidate.address.msb === this.inboundNrpn.msb
          && candidate.address.lsb === this.inboundNrpn.lsb,
      )
      if (parameter) {
        usePatchStore.getState().setValue(parameter.id, message.value)
        this.update({ activity: `Received ${parameter.shortLabel}: ${message.value}.` })
      }
      return
    }

    const parameter = summitParameters.find(
      (candidate) => candidate.address.type === 'cc' && candidate.address.controller === message.controller,
    )
    if (!parameter) return
    usePatchStore.getState().setValue(parameter.id, message.value)
    this.update({ activity: `Received ${parameter.shortLabel}: ${message.value}.` })
  }

  destroy() {
    if (this.selectedInput) this.selectedInput.onmidimessage = null
    if (this.access) this.access.onstatechange = null
    this.selectedInput = null
    this.selectedOutput = null
    this.listeners.clear()
  }
}

export const midiEngine = new SummitMidiEngine()