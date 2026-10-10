import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { webSynthDefaultValues } from './webSynthProfile'
import { readWebSynthPresets, saveWebSynthPreset, webSynthPresetStorageKey } from './webSynthPresetStorage'

describe('Web Synth browser presets', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('saves a complete, independent patch and reloads it', () => {
    const values = { ...webSynthDefaultValues, filterCutoff: 1700 }
    const saved = saveWebSynthPreset('  My pluck  ', values)
    values.filterCutoff = 3000
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ name: 'My pluck', values: { filterCutoff: 1700 } })
    expect(saved[0].id).toMatch(/^user-/)
    expect(readWebSynthPresets()).toEqual(saved)
    expect(saveWebSynthPreset('Another', webSynthDefaultValues)).toHaveLength(2)
  })

  it('rejects blank names and incomplete or invalid parameter sets', () => {
    expect(() => saveWebSynthPreset(' ', webSynthDefaultValues)).toThrow(/name/)
    expect(() => saveWebSynthPreset('x'.repeat(65), webSynthDefaultValues)).toThrow(/name/)
    expect(() => saveWebSynthPreset('Bad', {})).toThrow(/invalid/)
    for (const value of [NaN, Infinity, -1, 20000]) {
      expect(() => saveWebSynthPreset('Bad', { ...webSynthDefaultValues, filterCutoff: value })).toThrow(/invalid/)
    }
    expect(() => saveWebSynthPreset('Bad', { ...webSynthDefaultValues, osc1Wave: 1.5 })).toThrow(/invalid/)
    expect(localStorage.getItem(webSynthPresetStorageKey)).toBeNull()
  })

  it.each([
    'not json',
    '{}',
    '[{"id":"user-1","name":"Missing values"}]',
    JSON.stringify([
      { id: 'user-1', name: 'One', values: webSynthDefaultValues },
      { id: 'user-1', name: 'Two', values: webSynthDefaultValues },
    ]),
  ])('does not overwrite corrupt browser data: %s', (raw) => {
    localStorage.setItem(webSynthPresetStorageKey, raw)
    expect(() => readWebSynthPresets()).toThrow()
    expect(() => saveWebSynthPreset('New', webSynthDefaultValues)).toThrow()
    expect(localStorage.getItem(webSynthPresetStorageKey)).toBe(raw)
  })

  it('propagates storage failures instead of claiming a save', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Storage full', 'QuotaExceededError') })
    expect(() => saveWebSynthPreset('Pluck', webSynthDefaultValues)).toThrow(/Storage full/)
    expect(readWebSynthPresets()).toEqual([])
  })
})
