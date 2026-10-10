export const waveformTypes: OscillatorType[] = ['sine', 'triangle', 'sawtooth', 'square']

export function oscillatorShapeCoefficients(waveform: number, shape: number) {
  const real = new Float32Array(129)
  const imag = new Float32Array(129)
  const phase = (shape - 50) / 100 * 2 * Math.PI
  for (let harmonic = 1; harmonic < real.length; harmonic += 1) {
    if (waveform === 3) {
      const angle = 2 * Math.PI * harmonic * shape / 100
      real[harmonic] = 2 * Math.sin(angle) / (Math.PI * harmonic)
      imag[harmonic] = 2 * (1 - Math.cos(angle)) / (Math.PI * harmonic)
    } else {
      const amplitude = waveform === 0
        ? (harmonic === 1 ? 1 : 0)
        : waveform === 1
          ? (harmonic % 2 === 1 ? 8 * (-1) ** ((harmonic - 1) / 2) / (Math.PI * harmonic) ** 2 : 0)
          : 2 * (-1) ** (harmonic + 1) / (Math.PI * harmonic)
      real[harmonic] = amplitude * Math.sin(harmonic * phase)
      imag[harmonic] = amplitude * Math.cos(harmonic * phase)
    }
  }
  return { real, imag }
}

export function applyOscillatorShape(context: BaseAudioContext, oscillators: readonly OscillatorNode[], waveform: number, shape: number) {
  if (shape === 50) {
    for (const oscillator of oscillators) oscillator.type = waveformTypes[waveform]
    return
  }
  const { real, imag } = oscillatorShapeCoefficients(waveform, shape)
  const wave = context.createPeriodicWave(real, imag)
  for (const oscillator of oscillators) oscillator.setPeriodicWave(wave)
}
