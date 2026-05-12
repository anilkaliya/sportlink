import { useEffect, useRef } from 'react'
import { wsManager } from '../lib/websocket'
import type { WsServerEvent } from '../types/messaging'

export function useWebSocket(handler: (event: WsServerEvent) => void) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    wsManager.connect()
    const unsub = wsManager.subscribe((event) => handlerRef.current(event))
    return unsub
  }, [])
}

export function useWsSend() {
  return wsManager.send.bind(wsManager)
}
