export interface SendRequestInput {
  receiver_id: string
}

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'
