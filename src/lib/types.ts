export type Message = {
  _id: string;
  text: string;
  username: string;
  avatar: string;
  roomId: string;
  read: boolean;
  createdAt: string;
};

export type Room = {
  _id: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[];
  createdAt: string;
};

export type User = {
  _id: string;
  username: string;
  avatar: string;
  createdAt: string;
};

export type ChatContextType = {
  currentUser: User | null;
  rooms: Room[];
};