import { decodeCcMessage, encodeParameter } from './codec'
import { SUMMIT_EDIT_BUFFER_REQUEST, validateSysex } from './sysex'
import {
  parameterById,
  summitParameters,
  type ParameterId,
  type SummitParameterDefinition,
} from '../model/parameters'
import { usePatchStore } from '../model/patchStore'
import type { ModMatrixField } from '../model/modMatrix'
import { synthProfileIds } from '../model/profiles'
import type { MidiMessageEventLike, MidiSnapshot } from './midiEngine'

export class SummitMidiAdapter {
  readonly profileId = synthProfileIds.summit
  private inboundNrpn: { msb: number | null; lsb: number | null } = { msb: null, lsb: null }
  private lastWasNrpnDataEntry = false
  private inboundModMatrixSlot: number | null = null
  private readonly sendMessage: (data: number[] | Uint8Array) => boolean
  private readonly hasOutput: () => boolean
  private readonly update: (next: Partial<MidiSnapshot>) => void
  private readonly getChannel: () => number

  constructor(
    sendMessage: (data: number[] | Uint8Array) => boolean,
    hasOutput: () => boolean,
    update: (next: Partial<MidiSnapshot>) => void,
    getChannel: () => number,
  ) {
    this.sendMessage = sendMessage
    this.hasOutput = hasOutput
    this.update = update
    this.getChannel = getChannel
  }

  resetInputState() {
    this.inboundNrpn = { msb: null, lsb: null }
    this.lastWasNrpnDataEntry = false
    this.inboundModMatrixSlot = null
  }

  sendParameter(id: ParameterId, value: number) {
    const parameter = parameterById.get(id)
    if (!parameter) return false
    const messages = encodeParameter(this.getChannel(), parameter, value)
    if (!messages.every((message) => this.sendMessage(message))) return false
    this.update({ activity: `Sent ${parameter.shortLabel}: ${value}.` })
    return true
  }

  sendModMatrixValue(slotIndex: number, field: ModMatrixField, value: number) {
    if (!this.hasOutput() || !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= 16) return false
    const fieldIndex = { sourceA: 0, sourceB: 1, depth: 2, destination: 3 }[field]
    if (!this.sendNrpnMessages(0, 125, slotIndex) || !this.sendNrpnMessages(slotIndex + 1, fieldIndex, value)) return false
    this.update({ activity: `Sent mod matrix slot ${slotIndex + 1} ${field}.` })
    return true
  }

  resetHardwareToDefaults() {
    if (!this.hasOutput()) return false
    summitParameters.forEach((parameter: SummitParameterDefinition) => {
      if (!parameter.unverifiedEncoding) {
        this.sendParameter(parameter.id as ParameterId, parameter.defaultValue)
      }
    })
    usePatchStore.getState().summitState.modMatrix.forEach((slot, slotIndex) => {
      this.sendModMatrixValue(slotIndex, 'sourceA', slot.sourceA)
      this.sendModMatrixValue(slotIndex, 'sourceB', slot.sourceB)
      this.sendModMatrixValue(slotIndex, 'depth', slot.depth)
      this.sendModMatrixValue(slotIndex, 'destination', slot.destination)
    })
    this.update({ activity: 'Sent registered and community-mapped matrix defaults to Summit.' })
    return true
  }

  sendSysex(data: Uint8Array) {
    const validation = validateSysex(data)
    if (!validation.valid) {
      const message = validation.reason ?? 'Invalid SysEx.'
      this.update({ status: 'error', error: message, activity: message })
      return false
    }
    if (!this.sendMessage(data)) return false
    this.update({ error: null, activity: `Sent ${data.length} SysEx bytes.` })
    return true
  }

  requestEditBuffer() {
    const sent = this.sendSysex(SUMMIT_EDIT_BUFFER_REQUEST)
    if (sent) this.update({ activity: 'Experimental edit-buffer request sent.' })
    return sent
  }

  handleMessage = (event: MidiMessageEventLike, channel: number) => {
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
    if (!message || message.channel !== channel) return

    const followsDataEntry = this.lastWasNrpnDataEntry
    this.lastWasNrpnDataEntry = false
    if (message.controller === 38 && followsDataEntry) return

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
      this.inboundModMatrixSlot = null
      return
    }
    if (message.controller === 6 && this.inboundNrpn.msb !== null && this.inboundNrpn.lsb !== null) {
      this.lastWasNrpnDataEntry = true
      if (this.inboundNrpn.msb === 0 && this.inboundNrpn.lsb === 125) {
        this.inboundModMatrixSlot = message.value < 16 ? message.value : null
        return
      }
      const parameter = summitParameters.find(
        (candidate) => candidate.address.type === 'nrpn'
          && candidate.address.msb === this.inboundNrpn.msb
          && candidate.address.lsb === this.inboundNrpn.lsb,
      )
      if (parameter) {
        usePatchStore.getState().setProfileValue(this.profileId, parameter.id, message.value)
        this.update({ activity: `Received ${parameter.shortLabel}: ${message.value}.` })
        this.inboundModMatrixSlot = null
        return
      }
      const field = this.inboundNrpn.lsb < 4
        ? (['sourceA', 'sourceB', 'depth', 'destination'] as const)[this.inboundNrpn.lsb]
        : undefined
      const slotIndex = this.inboundNrpn.msb - 1
      if (field && this.inboundModMatrixSlot !== null && slotIndex === this.inboundModMatrixSlot) {
        usePatchStore.getState().setModMatrixValue(slotIndex, field, message.value)
        this.update({ activity: `Received mod matrix slot ${slotIndex + 1} ${field}.` })
      }
      this.inboundModMatrixSlot = null
      return
    }

    const parameter = summitParameters.find(
      (candidate) => candidate.address.type === 'cc' && candidate.address.controller === message.controller,
    )
    if (!parameter) return
    usePatchStore.getState().setProfileValue(this.profileId, parameter.id, message.value)
    this.update({ activity: `Received ${parameter.shortLabel}: ${message.value}.` })
  }

  private sendNrpnMessages(msb: number, lsb: number, value: number) {
    const channelStatus = 0xb0 | (this.getChannel() - 1)
    return [
      this.sendMessage([channelStatus, 99, msb]),
      this.sendMessage([channelStatus, 98, lsb]),
      this.sendMessage([channelStatus, 6, value]),
    ].every(Boolean)
  }
}
