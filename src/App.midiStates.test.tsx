import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MidiSnapshot, MidiStatus } from './midi/midiEngine'

const mockedUseMidi = vi.hoisted(() => vi.fn())

vi.mock('./midi/useMidi', () => ({ useMidi: mockedUseMidi }))

import App from './App'
import { midiEngine } from './midi/midiEngine'
import { usePatchStore } from './model/patchStore'

const baseSnapshot: MidiSnapshot = {
  status: 'idle',
  inputs: [],
  outputs: [],
  selectedInputId: '',
  selectedOutputId: '',
  channel: 1,
  error: null,
  activity: 'MIDI access has not been requested.',
}

function renderStatus(status: MidiStatus, error: string | null = null) {
  mockedUseMidi.mockReturnValue({ ...baseSnapshot, status, error })
  render(<App />)
}

describe('MIDI capability states', () => {
  beforeEach(() => usePatchStore.getState().setActiveProfile('summit'))

  afterEach(() => {
    cleanup()
    mockedUseMidi.mockReset()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each([
    ['unsupported', 'Offline editor'],
    ['idle', 'idle'],
    ['ready', 'MIDI ready'],
    ['error', 'error'],
  ] as const)('renders the %s state', (status, label) => {
    renderStatus(status, status === 'error' ? 'Permission denied.' : null)
    expect(screen.getByText(label)).toBeInTheDocument()
    if (status === 'error') expect(screen.getByText('Permission denied.')).toBeInTheDocument()
  })

  it('plays notes across all five octaves and keeps the top octave within MIDI limits', async () => {
    const user = userEvent.setup()
    const noteOn = vi.spyOn(midiEngine, 'sendNoteOn').mockReturnValue(true)
    const noteOff = vi.spyOn(midiEngine, 'sendNoteOff').mockReturnValue(true)
    const allNotesOff = vi.spyOn(midiEngine, 'allNotesOff').mockReturnValue(true)
    mockedUseMidi.mockReturnValue({ ...baseSnapshot, status: 'ready', selectedOutputId: 'summit-out' })
    render(<App />)
    for (const [octave, note] of [[2, 36], [3, 48], [4, 60], [5, 72], [6, 84], [7, 96]]) {
      const key = screen.getByRole('button', { name: `Play C ${octave}` })
      key.setPointerCapture = vi.fn()
      fireEvent.pointerDown(key, { pointerId: 1 })
      expect(noteOn).toHaveBeenLastCalledWith(note, 100)
      expect(key).toHaveAttribute('aria-pressed', 'true')
      fireEvent.pointerUp(key, { pointerId: 1 })
      expect(noteOff).toHaveBeenLastCalledWith(note)
      expect(key).toHaveAttribute('aria-pressed', 'false')
    }
    await user.click(screen.getByRole('button', { name: 'Decrease octave' }))
    await user.click(screen.getByRole('button', { name: 'Increase octave' }))
    await user.click(screen.getByRole('button', { name: 'Increase octave' }))
    await user.click(screen.getByRole('button', { name: 'Increase octave' }))
    expect(allNotesOff).toHaveBeenCalledTimes(4)
    expect(screen.getByRole('button', { name: 'Increase octave' })).toBeDisabled()
    const highest = screen.getByRole('button', { name: 'Play C 9' })
    highest.setPointerCapture = vi.fn()
    fireEvent.pointerDown(highest, { pointerId: 2 })
    expect(noteOn).toHaveBeenLastCalledWith(120, 100)
    fireEvent.pointerCancel(highest, { pointerId: 2 })
    expect(noteOff).toHaveBeenLastCalledWith(120)
    fireEvent.pointerDown(highest, { pointerId: 3 })
    await user.click(screen.getByRole('button', { name: 'Virtual keyboard' }))
    expect(allNotesOff).toHaveBeenCalledTimes(5)
    expect(highest).not.toBeVisible()
    expect(highest).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: 'Virtual keyboard' }))
    expect(screen.getByText('Octave 4')).toBeVisible()
    expect(highest).toBeVisible()
  })

  it('stops held notes when resizing to fewer visible octaves', () => {
    let resize: ResizeObserverCallback | undefined
    class KeybedObserver {
      constructor(callback: ResizeObserverCallback) { resize = callback }
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
    vi.stubGlobal('ResizeObserver', KeybedObserver)
    vi.spyOn(midiEngine, 'sendNoteOn').mockReturnValue(true)
    const allNotesOff = vi.spyOn(midiEngine, 'allNotesOff').mockReturnValue(true)
    mockedUseMidi.mockReturnValue({ ...baseSnapshot, status: 'ready', selectedOutputId: 'summit-out' })
    const { container } = render(<App />)
    const highest = screen.getByRole('button', { name: 'Play C 7' })
    highest.setPointerCapture = vi.fn()
    fireEvent.pointerDown(highest, { pointerId: 1 })
    const bed = container.querySelector('.piano-bed')
    if (!bed || !resize) throw new Error('Keyboard resize observer was not initialized')
    const callback = resize
    act(() => callback([{
      target: bed,
      contentRect: new DOMRect(0, 0, 292, 98),
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    }], new KeybedObserver(callback)))
    expect(allNotesOff).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('button', { name: /^Play / })).toHaveLength(13)
    expect(screen.queryByRole('button', { name: 'Play C 7' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play C 2' })).toHaveAttribute('aria-pressed', 'false')
  })
})
