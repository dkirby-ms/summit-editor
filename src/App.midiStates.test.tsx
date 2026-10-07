import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MidiSnapshot, MidiStatus } from './midi/midiEngine'

const mockedUseMidi = vi.hoisted(() => vi.fn())

vi.mock('./midi/useMidi', () => ({ useMidi: mockedUseMidi }))

import App from './App'

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
  afterEach(() => {
    cleanup()
    mockedUseMidi.mockReset()
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
})
