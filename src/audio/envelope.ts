export type EnvelopeStages = {
  attackEnd: number
  decayEnd: number
  sustainLevel: number
}

export function getEnvelopeStages(
  now: number,
  peak: number,
  attackMs: number,
  decayMs: number,
  sustainPercent: number,
): EnvelopeStages {
  const attackEnd = now + Math.max(0.005, attackMs / 1000)
  const decayEnd = attackEnd + Math.max(0.005, decayMs / 1000)
  return { attackEnd, decayEnd, sustainLevel: peak * Math.min(100, Math.max(0, sustainPercent)) / 100 }
}

export function scheduleSmoothedValue(param: AudioParam, value: number, now: number, timeConstant = 0.02) {
  param.cancelScheduledValues(now)
  param.setTargetAtTime(value, now, timeConstant)
}

/** Holds the current intrinsic value before a release ramp, including browsers without native hold support. */
export function holdAudioParamValue(param: AudioParam, now: number) {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(now)
  } else {
    const value = param.value
    param.cancelScheduledValues(now)
    param.setValueAtTime(value, now)
  }
}
