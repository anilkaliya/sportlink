import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../ui/Card'
import { connectionsApi } from '../../../api/connections'
import type { ConnectionRequest } from '../../../types/athlete'
import styles from './ConnectionRequests.module.css'

interface Props {
  requests: ConnectionRequest[]
  isLoading: boolean
}

export function ConnectionRequests({ requests, isLoading }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['connection-requests'] })
    queryClient.invalidateQueries({ queryKey: ['requests', 'incoming'] })
    queryClient.invalidateQueries({ queryKey: ['pending-actions'] })
  }

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => connectionsApi.acceptRequest(requestId),
    onSuccess: invalidate,
  })

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => connectionsApi.rejectRequest(requestId),
    onSuccess: invalidate,
  })

  const isBusy = acceptMutation.isPending || rejectMutation.isPending

  return (
    <Card>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon}>🤝</span>
          CONNECTION REQUESTS
        </h2>
        <button className={styles.viewAll} onClick={() => navigate('/connections/requests')}>View All</button>
      </div>
      <div className={styles.list}>
        {isLoading && (
          <p className={styles.empty}>Loading…</p>
        )}
        {!isLoading && requests.length === 0 && (
          <p className={styles.empty}>No pending requests.</p>
        )}
        {requests.map(r => (
          <div key={r.request_id} className={styles.requestItem}>
            <div className={styles.avatar}>👤</div>
            <div className={styles.info}>
              <span className={styles.name}>Athlete</span>
              <span className={styles.detail}>Connection request</span>
            </div>
            <div className={styles.actions}>
              <button
                className={styles.acceptBtn}
                disabled={isBusy}
                onClick={() => acceptMutation.mutate(r.request_id)}
              >
                Accept
              </button>
              <button
                className={styles.ignoreBtn}
                disabled={isBusy}
                onClick={() => rejectMutation.mutate(r.request_id)}
              >
                Ignore
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
