import { describe, expect, it } from 'vitest'
import { parameterById } from '../model/parameters'
import { clampParameterValue, decodeCcMessage, encodeCc, encodeParameter } from './codec'
import { SUMMIT_EDIT_BUFFER_REQUEST, validateSysex } from './sysex'

describe('MIDI codec', () => {
  it('encodes CC messages on the requested one-based channel', () => {
    expect(encodeCc(3, 79, 64)).toEqual([0xb2, 79, 64])
  })

  it('encodes a Summit NRPN with select and 14-bit data entry messages', () => {
    expect(encodeParameter(1, parameterById.get('osc1Wave')!, 4)).toEqual([
      [0xb0, 99, 0], [0xb0, 98, 14], [0xb0, 6, 4], [0xb0, 38, 0],
    ])
    expect(encodeParameter(1, parameterById.get('osc2Wave')!, 3)).toEqual([
      [0xb0, 99, 0], [0xb0, 98, 23], [0xb0, 6, 3], [0xb0, 38, 0],
    ])
  })

  it('clamps registered parameter values before encoding', () => {
    const wave = parameterById.get('osc1Wave')!
    expect(clampParameterValue(wave, 12)).toBe(4)
    expect(encodeParameter(1, wave, 12)[2]).toEqual([0xb0, 6, 4])
  })

  it('decodes channel CC messages and ignores other MIDI messages', () => {
    expect(decodeCcMessage(new Uint8Array([0xb4, 86, 12]))).toEqual({ channel: 5, controller: 86, value: 12 })
    expect(decodeCcMessage(new Uint8Array([0x90, 60, 100]))).toBeNull()
  })

  it('validates complete SysEx and rejects incomplete data', () => {
    expect(validateSysex(SUMMIT_EDIT_BUFFER_REQUEST).valid).toBe(true)
    expect(validateSysex(new Uint8Array([0xf0, 0x01])).valid).toBe(false)
    expect(validateSysex(new Uint8Array([0x90, 60, 100])).valid).toBe(false)
  })

  it('uses the experimental Summit edit-buffer request framing', () => {
    expect(Array.from(SUMMIT_EDIT_BUFFER_REQUEST)).toEqual([
      0xf0, 0x00, 0x20, 0x29, 0x01, 0x11, 0x01, 0x33, 0x40, 0x00, 0x00,
      0x00, 0x00, 0x00, 0xf7,
    ])
  })
})