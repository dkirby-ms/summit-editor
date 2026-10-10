import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export function ClickControlHelp({ label, text }: { label: string; text: string }) {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const tooltip = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })

  useLayoutEffect(() => {
    if (!open) return
    function place() {
      if (!trigger.current || !tooltip.current) return
      const anchor = trigger.current.getBoundingClientRect()
      const box = tooltip.current.getBoundingClientRect()
      const margin = 8
      const below = anchor.bottom + margin
      setPosition({
        left: Math.max(margin, Math.min(anchor.right - box.width, window.innerWidth - box.width - margin)),
        top: Math.max(margin, below + box.height <= window.innerHeight - margin ? below : anchor.top - box.height - margin),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function dismissOutside(event: Event) {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !tooltip.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    function dismissEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('focusin', dismissOutside)
    document.addEventListener('keydown', dismissEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('focusin', dismissOutside)
      document.removeEventListener('keydown', dismissEscape)
    }
  }, [open])

  return (
    <span className="click-help-container" onDoubleClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
      event.stopPropagation()
      if (event.key === 'Escape') setOpen(false)
    }}>
      <button
        ref={trigger}
        type="button"
        className="control-help click-control-help"
        aria-label={`${label} help`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((current) => !current)}
      >?</button>
      {open && createPortal(
        <div ref={tooltip} id={id} role="tooltip" className="click-control-tooltip" style={position}>
          <strong>{label}</strong>
          <p>{text}</p>
        </div>,
        document.body,
      )}
    </span>
  )
}
