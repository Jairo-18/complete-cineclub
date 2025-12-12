import { PaginationInterface } from '../../shared/interfaces/pagination.interface';

export interface FriendUserInterface {
  id?: string;
  fullName?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
}

export interface FriendInterface {
  id?: string;
  userId?: string;
  friend?: FriendUserInterface;
  createdAt: string;
}

export interface FriendsResponseInterface extends PaginationInterface {
  data: FriendInterface[];
}
