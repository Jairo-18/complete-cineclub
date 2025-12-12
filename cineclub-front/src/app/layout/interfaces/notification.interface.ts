export interface Notification {
  id: string;
  senderId: string;
  receiverId: string;
  sender: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  type: NotificationType;
  createdAt: string;
  entityId: string;
  read: boolean;
}

export enum NotificationType {
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',
  COLLECTION_REQUEST = 'COLLECTION_REQUEST',
  COLLECTION_ACCEPTED = 'COLLECTION_ACCEPTED',
}
