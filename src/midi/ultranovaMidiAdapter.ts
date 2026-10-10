import { decodeCcMessage, encodeParameter } from './codec'
import { ultranovaParameters } from '../model/ultranovaProfile'
import { usePatchStore } from '../model/patchStore'
import type { MidiMessageEventLike, MidiSnapshot } from './midiEngine'

export class UltraNovaMidiAdapter {
  private nrpnMsb = 0
  private nrpnLsb: number | null = null
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
    this.nrpnMsb = 0
    this.nrpnLsb = null
  }

  sendParameter(id: string, value: number) {
    const parameter = ultranovaParameters.find((candidate) => candidate.id === id)
    if (!parameter) {
      this.update({ status: 'error', error: `Unsupported UltraNova parameter: ${id}.` })
      return false
    }
    if (!encodeParameter(this.getChannel(), parameter, value).every(this.sendMessage)) return false
    this.update({ activity: `Sent ${parameter.shortLabel}: ${value}.` })
    return true
  }

  resetHardwareToDefaults() {
    if (!this.hasOutput()) return false
    if (!ultranovaParameters.every((parameter) => this.sendParameter(parameter.id, parameter.defaultValue))) return false
    this.update({ activity: 'Sent documented control defaults to UltraNova.' })
    return true
  }

  handleMessage(event: MidiMessageEventLike, channel: number) {
    const message = decodeCcMessage(event.data)
    if (!message || message.channel !== channel) return
    const { controller, value } = message
    if (controller === 99) {
      this.nrpnMsb = value
      this.nrpnLsb = null
      return
    }
    if (controller === 98) {
      this.nrpnLsb = value
      return
    }
    if (controller === 100 || controller === 101) {
      this.resetInputState()
      return
    }
    if (controller === 38) return
    const parameter = controller === 6
      ? ultranovaParameters.find((candidate) => candidate.address.type === 'nrpn'
        && candidate.address.msb === this.nrpnMsb && candidate.address.lsb === this.nrpnLsb)
      : ultranovaParameters.find((candidate) => candidate.address.type === 'cc'
        && candidate.address.controller === controller)
    // UltraNova omits MSB for bank 0 and resets it after each data-entry message.
    if (controller === 6) this.resetInputState()
    if (!parameter) return
    usePatchStore.getState().setProfileValue('ultranova', parameter.id, value)
    this.update({ activity: `Received ${parameter.shortLabel}: ${value}.` })
  }
}
