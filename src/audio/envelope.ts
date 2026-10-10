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
