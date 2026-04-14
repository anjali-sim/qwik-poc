/**
 * /chat/layout.tsx — Nested layout (Qwik City)
 * Qwik concepts:
 *  • Nested layouts — sidebar persists while chat area swaps per room
 *  • routeLoader$ — load rooms + current user before page renders (SSR)
 *  • createContextId + useContextProvider — share user/rooms to all children
 *  • server$ — mark user as active server-side
 *  • component$
 */
import {
  component$,
  useContextProvider,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { Slot } from "@builder.io/qwik";
import { connectDB, Room, User } from "~/lib/db";
import { ChatContext } from "~/lib/context";
import type { Room as RoomType, User as UserType } from "~/lib/types";
import RoomSidebar from "~/components/sidebar/RoomSidebar";

// ─── routeLoader$ ─────────────────────────────────────────────────────────────
export const useChatLayout = routeLoader$(async ({ cookie }) => {
  await connectDB();

  const userCookie = cookie.get("chat_user")?.value;
  const sessionUser = userCookie ? JSON.parse(userCookie) : null;

  const rooms = await Room.find().sort({ createdAt: -1 }).lean();
  let currentUser = null;
  if (sessionUser?.username) {
    currentUser = await User.findOne({ username: sessionUser.username }).lean();
  }

  return {
    rooms: rooms.map((r: any) => ({
      _id: r._id.toString(),
      name: r.name,
      description: r.description,
      createdBy: r.createdBy,
      members: r.members,
      createdAt: r.createdAt?.toISOString(),
    })) as RoomType[],
    currentUser: currentUser
      ? {
          _id: (currentUser as any)._id.toString(),
          username: (currentUser as any).username,
          avatar: (currentUser as any).avatar,
          createdAt: (currentUser as any).createdAt?.toISOString(),
        }
      : (sessionUser as UserType | null),
  };
});

// ─── Component ────────────────────────────────────────────────────────────────
export default component$(() => {
  const data = useChatLayout();

  // useContextProvider — provide context to all child components (no prop drilling)
  const chatStore = useStore({
    currentUser: data.value.currentUser,
    rooms: data.value.rooms,
  });
  useContextProvider(ChatContext, chatStore);

  // useVisibleTask$ — runs only in browser (after hydration)
  // Here we periodically refresh rooms list for real-time feel
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/rooms");
        const json = await res.json();
        if (json.rooms) chatStore.rooms = json.rooms;
      } catch {
        /* ignore */
      }
    }, 3000);
    cleanup(() => clearInterval(interval));
  });

  return (
    <div class="flex h-screen overflow-hidden bg-gray-950 text-white">
      {/* Sidebar — persists across chat rooms (nested layout) */}
      <RoomSidebar />

      {/* Main area — changes per route */}
      <main class="flex flex-1 flex-col overflow-hidden">
        <Slot />
      </main>
    </div>
  );
});
