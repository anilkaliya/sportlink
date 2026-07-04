import { Platform, AppState } from 'react-native'
import { useAuthStore } from '../stores/authStore'
import type { WsClientEvent, WsServerEvent } from '../types/messaging'

// Production WebSocket (Caddy terminates TLS and proxies /ws/messaging).
const PROD_WS_BASE = 'wss://sportlink.theplanetzed.com'

// In dev (Metro), hit the local backend; release builds use the domain.
const WS_BASE = __DEV__
  ? (Platform.OS === 'android'
      ? 'ws://192.168.0.106:3000'
      : 'ws://localhost:3000')
  : PROD_WS_BASE

type EventHandler = (event: WsServerEvent) => void

class WebSocketManager {
  private ws: WebSocket | null = null
  private handlers = new Set<EventHandler>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private isConnecting = false
  private intentionalClose = false

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return

    const token = useAuthStore.getState().accessToken
    if (!token) return

    this.isConnecting = true
    this.intentionalClose = false

    try {
      this.ws = new WebSocket(`${WS_BASE}/ws/messaging?token=${token}`)

      this.ws.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.startPing()
      }

      this.ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as WsServerEvent
          this.handlers.forEach(handler => handler(event))
        } catch {}
      }

      this.ws.onerror = () => {
        this.isConnecting = false
      }

      this.ws.onclose = () => {
        this.isConnecting = false
        this.stopPing()
        if (!this.intentionalClose) {
          this.scheduleReconnect()
        }
      }
    } catch {
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  disconnect() {
    this.intentionalClose = true
    this.stopPing()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectAttempts = 0
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(event: WsClientEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event))
    }
  }

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler)
    return () => { this.handlers.delete(handler) }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 25000)
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }
}

export const wsManager = new WebSocketManager()

// Reconnect on app foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    const token = useAuthStore.getState().accessToken
    if (token && !wsManager.isConnected) {
      wsManager.connect()
    }
  }
})
