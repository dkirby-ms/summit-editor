import { useSyncExternalStore } from 'react'
import { midiEngine } from './midiEngine'

export function useMidi() {
  return useSyncExternalStore(midiEngine.subscribe, midiEngine.getSnapshot)
}