export const MAX_SYSEX_BYTES = 1024 * 1024

export const SUMMIT_EDIT_BUFFER_REQUEST = new Uint8Array([
  0xf0, 0x00, 0x20, 0x29, 0x01, 0x11, 0x01, 0x33, 0x40, 0x00, 0x00, 0x00,
  0x00, 0x00, 0xf7,
])

export function validateSysex(data: Uint8Array) {
  if (data.length < 2) return { valid: false, reason: 'The file does not contain a MIDI message.' }
  if (data.length > MAX_SYSEX_BYTES) return { valid: false, reason: 'The SysEx message exceeds the 1 MB limit.' }
  if (data[0] !== 0xf0 || data[data.length - 1] !== 0xf7) {
    return { valid: false, reason: 'A SysEx message must start with F0 and end with F7.' }
  }
  return { valid: true, reason: null }
}