import { useConnectionStatus } from '../../hooks/useConnectionStatus'
import { useConnectionActions } from '../../hooks/useConnectionActions'
import styles from './ConnectionButton.module.css'

interface Props {
  targetUserId: string
  currentUserId: string
}

export function ConnectionButton({ targetUserId, currentUserId }: Props) {
  if (targetUserId === currentUserId) return null

  const { status: fetchedStatus, requestId, isLoading, refetch } = useConnectionStatus(targetUserId)
  const { optimisticStatus, isMutating, sendRequest, acceptRequest, rejectRequest, cancelRequest } =
    useConnectionActions(fetchedStatus, refetch)

  const status = optimisticStatus ?? fetchedStatus

  if (isLoading) {
    return <button className={styles.btnPending} disabled>···</button>
  }

  if (status === 'none') {
    return (
      <button
        className={styles.btnConnect}
        disabled={isMutating}
        onClick={() => sendRequest(targetUserId)}
      >
        Connect
      </button>
    )
  }

  if (status === 'pending_outgoing') {
    return (
      <button
        className={styles.btnPending}
        disabled={isMutating}
        onClick={() => requestId !== null && cancelRequest(requestId)}
        title="Click to cancel"
      >
        Pending
      </button>
    )
  }

  if (status === 'pending_incoming') {
    return (
      <>
        <button
          className={styles.btnAccept}
          disabled={isMutating}
          onClick={() => requestId !== null && acceptRequest(requestId)}
        >
          Accept
        </button>
        <button
          className={styles.btnOutline}
          disabled={isMutating}
          onClick={() => requestId !== null && rejectRequest(requestId)}
        >
          Reject
        </button>
      </>
    )
  }

  // connected
  return (
    <>
      <button className={styles.btnConnected} disabled>Connected</button>
      <button className={styles.btnOutline}>Message</button>
    </>
  )
}
