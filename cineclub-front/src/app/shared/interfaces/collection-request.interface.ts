export type CollectionRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface CollectionRequestInterface {
  id: string;
  senderName: string;
  senderId: string;
  senderEmail: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName?: string;
  receiverEmail?: string;
  receiverAvatar?: string;
  createdAt: string;
  status: CollectionRequestStatus;
}

export interface CollectionRequestResponse {
  status: number;
  message?: string;
  error?: string;
  data: CollectionRequestInterface[];
}
