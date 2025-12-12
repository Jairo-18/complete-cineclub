export interface CollectionRequestInterface {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  status: string;
  createdAt: string;
}

export interface CollectionRequestResponse {
  status: number;
  message: string;
  error: string;
  data: CollectionRequestInterface[];
}
