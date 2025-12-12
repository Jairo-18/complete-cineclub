export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface FriendRequestInterface {
  id: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  status: FriendRequestStatus;
}

export interface SendFriendRequestDto {
  receiverId: string;
}

export interface FriendRequestResponse {
  status: number;
  message?: string;
  error?: string;
  data: FriendRequestInterface[];
}
