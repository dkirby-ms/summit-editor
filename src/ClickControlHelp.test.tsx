import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClickControlHelp } from './ClickControlHelp'

afterEach(cleanup)

describe('click control help', () => {
  it('opens only on activation, exposes its description, and toggles closed', async () => {
    const user = userEvent.setup()
    render(<ClickControlHelp label="Cutoff" text="A low-pass filter removes higher harmonics." />)
    const help = screen.getByRole('button', { name: 'Cutoff help' })
    await user.hover(help)
    help.focus()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(help).toHaveAttribute('aria-expanded', 'true')
    expect(help).toHaveAccessibleDescription(/A low-pass filter/)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    await user.keyboard(' ')
    expect(help).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('dismisses with Escape, outside clicks, or focus leaving, but not tooltip clicks', async () => {
    const user = userEvent.setup()
    render(<><ClickControlHelp label="Cutoff" text="Filter explanation" /><button>Outside</button></>)
    const help = screen.getByRole('button', { name: 'Cutoff help' })
    await user.click(help)
    await user.click(screen.getByRole('tooltip'))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(help).toHaveFocus()
    await user.click(help)
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    await user.click(help)
    await user.tab()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('does not bubble reset gestures to the synth control', () => {
    const reset = vi.fn()
    render(<div onDoubleClick={reset} onKeyDown={reset}><ClickControlHelp label="Cutoff" text="Filter explanation" /></div>)
    const help = screen.getByRole('button', { name: 'Cutoff help' })
    fireEvent.doubleClick(help)
    fireEvent.keyDown(help, { key: 'Delete' })
    expect(reset).not.toHaveBeenCalled()
  })
})
