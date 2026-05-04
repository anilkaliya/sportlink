import { useQueryClient } from '@tanstack/react-query'
import type { ConnectionRequest } from '../../types/athlete'
import { useConnectionActions } from '../../hooks/useConnectionActions'
import styles from './RequestCard.module.css'

interface Props {
  request: ConnectionRequest
}

export function RequestCard({ request }: Props) {
  const queryClient = useQueryClient()

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ['requests', 'incoming'] })
    queryClient.invalidateQueries({ queryKey: ['connection-status', request.sender_id] })
  }

  const { acceptRequest, rejectRequest, isMutating } = useConnectionActions('pending_incoming', refetch)

  return (
    <div className={styles.card}>
      <div className={styles.avatar}>
        <span className={styles.avatarEmoji}>🏃</span>
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{request.sender_id}</span>
        <span className={styles.meta}>
          {new Date(request.created_at).toLocaleDateString()}
        </span>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.btnAccept}
          onClick={() => acceptRequest(request.request_id)}
          disabled={isMutating}
        >
          Accept
        </button>
        <button
          className={styles.btnReject}
          onClick={() => rejectRequest(request.request_id)}
          disabled={isMutating}
        >
          Reject
        </button>
      </div>
    </div>
  )
}
