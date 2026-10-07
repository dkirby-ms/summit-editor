import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { defaultPatchValues } from './model/parameters'
import { usePatchStore } from './model/patchStore'

describe('Summit Patch Lab', () => {
  beforeEach(() => usePatchStore.setState({ values: { ...defaultPatchValues }, rawPatch: null, rawPatchSource: null }))
  afterEach(cleanup)

  it('renders an offline editor with grouped documented controls', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /summit patch lab/i })).toBeInTheDocument()
    expect(screen.getByText('Offline editor')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter resonance')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /amplifier envelope/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /connect midi/i })).toBeDisabled()
  })

  it('edits and resets values without hardware', async () => {
    const user = userEvent.setup()
    render(<App />)
    const attack = screen.getByLabelText('Amplifier envelope attack')
    const initialAttack = defaultPatchValues.ampAttack
    fireEvent.change(attack, { target: { value: initialAttack + 2 } })
    expect(usePatchStore.getState().values.ampAttack).toBe(initialAttack + 2)
    const resetButton = screen.getByRole('button', { name: /reset defaults/i })
    resetButton.focus()
    await user.keyboard('{Enter}')
    expect(usePatchStore.getState().values).toEqual(defaultPatchValues)
    expect(screen.getByText('Defaults restored locally.')).toBeInTheDocument()
  })

  it('keeps raw patch actions unavailable until data exists', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^send$/i })).toBeDisabled()
    expect(screen.getByText(/fetch framing is experimental/i)).toBeInTheDocument()
  })

  it('renders an offline virtual keyboard with octave and velocity controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: /virtual keyboard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play C 4' })).toBeDisabled()
    expect(screen.getByText('Select a MIDI output to play.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /increase octave/i }))
    expect(screen.getByText('Octave 5')).toBeInTheDocument()
    expect(screen.getByLabelText('Velocity')).toHaveValue('100')
  })
})
