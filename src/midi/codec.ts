import type { ParameterDefinition } from '../model/parameters'

const MIDI_CC = 0xb0

function assertDataByte(value: number, name: string) {
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new RangeError(`${name} must be an integer from 0 to 127`)
  }
}

export function clampParameterValue(parameter: ParameterDefinition, value: number) {
  return Math.min(parameter.max, Math.max(parameter.min, Math.round(value)))
}

export function encodeCc(channel: number, controller: number, value: number) {
  assertDataByte(controller, 'Controller')
  assertDataByte(value, 'Value')
  if (!Number.isInteger(channel) || channel < 1 || channel > 16) {
    throw new RangeError('Channel must be an integer from 1 to 16')
  }

  return [MIDI_CC | (channel - 1), controller, value]
}

export function encodeNrpn(channel: number, parameterMsb: number, parameterLsb: number, value: number) {
  assertDataByte(parameterMsb, 'NRPN parameter MSB')
  assertDataByte(parameterLsb, 'NRPN parameter LSB')
  assertDataByte(value, 'NRPN value')
  const fourteenBitValue = value << 7

  return [
    encodeCc(channel, 99, parameterMsb),
    encodeCc(channel, 98, parameterLsb),
    encodeCc(channel, 6, (fourteenBitValue >> 7) & 0x7f),
    encodeCc(channel, 38, fourteenBitValue & 0x7f),
  ]
}

export function encodeParameter(channel: number, parameter: ParameterDefinition, value: number) {
  const clampedValue = clampParameterValue(parameter, value)
  if (parameter.address.type === 'cc') {
    return [encodeCc(channel, parameter.address.controller, clampedValue)]
  }

  return encodeNrpn(channel, parameter.address.msb, parameter.address.lsb, clampedValue)
}

export function decodeCcMessage(data: Uint8Array) {
  if (data.length !== 3 || (data[0] & 0xf0) !== MIDI_CC) return null
  return { channel: (data[0] & 0x0f) + 1, controller: data[1], value: data[2] }
}