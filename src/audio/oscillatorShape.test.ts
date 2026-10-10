import { describe, expect, it } from 'vitest'
import { oscillatorShapeCoefficients } from './oscillatorShape'

describe('oscillator shape', () => {
  it('changes pulse duty cycle, including even harmonics, without adding DC', () => {
    const square = oscillatorShapeCoefficients(3, 50)
    const pulse = oscillatorShapeCoefficients(3, 25)
    expect(square.real[0]).toBe(0)
    expect(square.imag[0]).toBe(0)
    expect(square.imag[2]).toBeCloseTo(0)
    expect(pulse.imag[2]).toBeCloseTo(2 / Math.PI)
    expect(pulse.real[1]).toBeCloseTo(2 / Math.PI)
    for (const shape of [1, 50, 99]) {
      const { real, imag } = oscillatorShapeCoefficients(3, shape)
      expect([...real, ...imag].every(Number.isFinite)).toBe(true)
    }
  })

  it.each([0, 1, 2])('rotates phase without changing harmonic magnitudes for waveform %i', (waveform) => {
    const neutral = oscillatorShapeCoefficients(waveform, 50)
    const shifted = oscillatorShapeCoefficients(waveform, 75)
    for (let harmonic = 1; harmonic < neutral.real.length; harmonic += 1) {
      expect(Math.hypot(shifted.real[harmonic], shifted.imag[harmonic]))
        .toBeCloseTo(Math.hypot(neutral.real[harmonic], neutral.imag[harmonic]), 6)
    }
    expect(shifted.real[1]).toBeCloseTo(neutral.imag[1])
    expect(shifted.imag[1]).toBeCloseTo(0)
  })
})
