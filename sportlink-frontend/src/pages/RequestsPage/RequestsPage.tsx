import { useIncomingRequests } from '../../hooks/useIncomingRequests'
import { RequestCard } from '../../components/RequestCard/RequestCard'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import styles from './RequestsPage.module.css'

export function RequestsPage() {
  const { requests, isLoading, isError, error } = useIncomingRequests()

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message={error?.message ?? 'Failed to load requests'} />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>CONNECTION REQUESTS</h1>
        <p className={styles.subtitle}>Athletes who want to connect with you</p>
      </div>

      {requests.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📭</span>
          <p className={styles.emptyTitle}>No pending requests</p>
          <p className={styles.emptyText}>When other athletes connect with you, they'll show up here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {requests.map(req => (
            <RequestCard key={req.request_id} request={req} />
          ))}
        </div>
      )}
    </div>
  )
}
