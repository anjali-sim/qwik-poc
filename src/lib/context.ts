import { createContextId } from "@builder.io/qwik";
import type { User, Room } from "./types";

// createContextId — share the logged-in user & rooms to all child components
// without prop drilling
export const ChatContext = createContextId<{
  currentUser: User | null;
  rooms: Room[];
}>("chat.context");
