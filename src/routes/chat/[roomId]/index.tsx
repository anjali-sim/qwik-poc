/**
 * /chat/[roomId] — Individual chat room page
 * Qwik concepts demonstrated:
 *  • routeLoader$ — SSR load of room + message history
 *  • routeAction$ — send a message, delete a message, clear chat
 *  • server$ — mark messages as read server-side
 *  • useSignal / useStore — local reactive state
 *  • useComputed$ — derived values (char count, send enabled, filtered msgs)
 *  • useTask$ — debounce search input
 *  • useVisibleTask$ — SSE / polling for real-time messages + auto-scroll
 *  • useContext — read current user from ChatContext (no prop drilling)
 *  • useResource$ + Resource — live typing indicator (async streaming)
 *  • Error boundary (onGet fallback in routeLoader$)
 *  • Lazy loading — EmojiPicker only loads JS when user clicks
 *  • component$
 */
import {
  component$,
  useSignal,
  useStore,
  useComputed$,
  useTask$,
  useVisibleTask$,
  useContext,
  useResource$,
  Resource,
  $,
} from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  server$,
  zod$,
  z,
  Link,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { connectDB, Room, Message } from "~/lib/db";
import { ChatContext } from "~/lib/context";
import MessageItem from "~/components/chat/MessageItem";
import type { Message as MessageType, Room as RoomType } from "~/lib/types";
import EmojiPicker from "~/components/chat/EmojiPicker";

// ─── EmojiPicker import ────────────────────────────────────────────────────
// Resumability & lazy loading: In Qwik, every component$ boundary is
// automatically lazy — EmojiPicker's JS only loads when rendered.
// import EmojiPicker from "~/components/chat/EmojiPicker";

// ─── routeLoader$ ─────────────────────────────────────────────────────────────
// Loads chat history & room info before page renders (SSR)
export const useRoomData = routeLoader$(async ({ params, cookie, status }) => {
  try {
    await connectDB();
    const room = await Room.findById(params.roomId).lean();
    if (!room) {
      status(404);
      return { room: null, messages: [], currentUser: null };
    }

    const messages = await Message.find({ roomId: params.roomId })
      .sort({ createdAt: "asc" })
      .limit(100)
      .lean();

    const userCookie = cookie.get("chat_user")?.value;
    const currentUser = userCookie ? JSON.parse(userCookie) : null;

    return {
      room: {
        _id: (room as any)._id.toString(),
        name: (room as any).name,
        description: (room as any).description,
        createdBy: (room as any).createdBy,
        members: (room as any).members,
        createdAt: (room as any).createdAt?.toISOString(),
      } as RoomType,
      messages: messages.map((m: any) => ({
        _id: m._id.toString(),
        text: m.text,
        username: m.username,
        avatar: m.avatar,
        roomId: m.roomId,
        read: m.read,
        createdAt: m.createdAt?.toISOString(),
      })) as MessageType[],
      currentUser,
    };
  } catch {
    // Error boundary: fallback data if routeLoader$ fails
    status(500);
    return { room: null, messages: [], currentUser: null };
  }
});

// ─── routeAction$ — Send Message ─────────────────────────────────────────────
export const useSendMessage = routeAction$(
  async (data, { cookie }) => {
    await connectDB();
    const userCookie = cookie.get("chat_user")?.value;
    const sessionUser = userCookie ? JSON.parse(userCookie) : null;
    if (!sessionUser) return { success: false };

    const msg = await Message.create({
      text: data.text,
      username: sessionUser.username,
      avatar: sessionUser.avatar || "",
      roomId: data.roomId,
    });

    // Add user to room members if not already there
    await Room.findByIdAndUpdate(data.roomId, {
      $addToSet: { members: sessionUser.username },
    });

    return {
      success: true,
      message: {
        _id: msg._id.toString(),
        text: msg.text,
        username: msg.username,
        avatar: msg.avatar,
        roomId: msg.roomId,
        read: msg.read,
        createdAt: msg.createdAt?.toISOString(),
      },
    };
  },
  zod$({
    text: z.string().min(1).max(1000),
    roomId: z.string(),
  }),
);

// ─── routeAction$ — Delete Message ───────────────────────────────────────────
export const useDeleteMessage = routeAction$(
  async (data, { cookie }) => {
    await connectDB();
    const userCookie = cookie.get("chat_user")?.value;
    const sessionUser = userCookie ? JSON.parse(userCookie) : null;
    const msg = await Message.findById(data.messageId);
    if (msg && msg.username === sessionUser?.username) {
      await msg.deleteOne();
    }
    return { success: true };
  },
  zod$({ messageId: z.string() }),
);

// ─── routeAction$ — Clear Chat ────────────────────────────────────────────────
export const useClearChat = routeAction$(
  async (data) => {
    await connectDB();
    await Message.deleteMany({ roomId: data.roomId });
    return { success: true };
  },
  zod$({ roomId: z.string() }),
);

// ─── server$ — Mark messages as read (runs server-side on demand) ─────────────
export const markAsRead = server$(async function (roomId: string) {
  await connectDB();
  await Message.updateMany({ roomId, read: false }, { $set: { read: true } });
  return { ok: true };
});

// ─── server$ — Fetch updated messages (used for polling) ─────────────────────
export const fetchMessages = server$(async function (
  roomId: string,
  after: string,
) {
  await connectDB();
  const query: any = { roomId };
  // Strictly after the last known message — avoids re-fetching already shown msgs
  if (after) query.createdAt = { $gt: new Date(after) };
  const msgs = await Message.find(query).sort({ createdAt: "asc" }).lean();
  return msgs.map((m: any) => ({
    _id: m._id.toString(),
    text: m.text,
    username: m.username,
    avatar: m.avatar,
    roomId: m.roomId,
    read: m.read,
    createdAt: m.createdAt?.toISOString(),
  }));
});

// ─── Component ────────────────────────────────────────────────────────────────
export default component$(() => {
  const data = useRoomData();
  const ctx = useContext(ChatContext);
  const sendAction = useSendMessage(); // registered — used via fetch optimistically
  void sendAction;
  const deleteAction = useDeleteMessage(); // registered for SSR form fallback
  void deleteAction;
  const clearAction = useClearChat(); // registered for SSR form fallback
  void clearAction;

  // useStore — reactive object for multiple values
  const store = useStore({
    messages: data.value.messages as MessageType[],
    typingUsers: [] as string[],
    isConnected: false,
    showEmojiPicker: false,
    deletingId: "",
  });

  // useSignal — typed message, search query, loading
  const input = useSignal("");
  const searchQuery = useSignal("");
  const lastMessageTime = useSignal(
    data.value.messages.at(-1)?.createdAt ?? new Date(0).toISOString(),
  );
  const currentRoomId = useSignal(data.value.room?._id ?? "");
  const messagesEndRef = useSignal<Element>();
  const inputRef = useSignal<Element>();
  const charLimit = 500;

  // useComputed$ — derived: send button enabled, char count, filtered messages
  const canSend = useComputed$(
    () => input.value.trim().length > 0 && input.value.length <= charLimit,
  );
  const charCount = useComputed$(() => input.value.length);
  const filteredMessages = useComputed$(() => {
    if (!searchQuery.value.trim()) return store.messages;
    const q = searchQuery.value.toLowerCase();
    return store.messages.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q),
    );
  });

  // useTask$ — reset messages when room changes
  useTask$(({ track }) => {
    track(() => data.value.room?._id);
    // Reset messages and state when navigating to a different room
    if (data.value.room && data.value.room._id !== currentRoomId.value) {
      currentRoomId.value = data.value.room._id;
      store.messages = data.value.messages;
      lastMessageTime.value =
        data.value.messages.at(-1)?.createdAt ?? new Date(0).toISOString();
      searchQuery.value = "";
      input.value = "";
      store.showEmojiPicker = false;
    }
  });

  // useTask$ — debounce search input (runs on server + client)
  useTask$(({ track, cleanup }) => {
    track(() => searchQuery.value);
    // Debounce: only log/process after 300ms pause
    const t = setTimeout(() => {
      // Could trigger server filter here; for now just reactive
    }, 300);
    cleanup(() => clearTimeout(t));
  });

  // useVisibleTask$ — runs only in browser
  // 1. Poll for new messages every 2s (real-time feel without WebSocket)
  // 2. Auto-scroll to bottom when new messages arrive
  // 3. Mark messages as read when room is visible
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => currentRoomId.value);

    if (!data.value.room) return;
    const roomId = data.value.room._id;

    // Mark as read on mount
    markAsRead(roomId).catch(() => {});

    // Polling for new messages
    const poll = setInterval(async () => {
      try {
        const newMsgs = await fetchMessages(roomId, lastMessageTime.value);
        if (newMsgs.length > 0) {
          // Get current IDs already in state (including real IDs of sent messages)
          const existingIds = new Set(store.messages.map((m) => m._id));
          const truly_new = newMsgs.filter((m) => !existingIds.has(m._id));
          if (truly_new.length > 0) {
            store.messages = [...store.messages, ...truly_new];
            lastMessageTime.value = newMsgs.at(-1)!.createdAt;
            messagesEndRef.value?.scrollIntoView({ behavior: "smooth" });
          } else {
            // Still advance the cursor so we don't re-fetch same window
            lastMessageTime.value = newMsgs.at(-1)!.createdAt;
          }
        }
      } catch {
        /* network error — skip */
      }
    }, 2000);

    store.isConnected = true;
    cleanup(() => {
      clearInterval(poll);
      store.isConnected = false;
    });
  });

  // useVisibleTask$ — auto scroll on initial load
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: "instant" });
  });

  // ─── Send message handler ─────────────────────────────────────────────────
  const sendMessage = $(async () => {
    if (!canSend.value || !data.value.room) return;
    const text = input.value.trim();
    input.value = "";
    store.showEmojiPicker = false;

    // Optimistic update — show message immediately before server confirms
    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageType = {
      _id: tempId,
      text,
      username: ctx.currentUser?.username ?? "You",
      avatar: ctx.currentUser?.avatar ?? "",
      roomId: data.value.room._id,
      read: false,
      createdAt: new Date().toISOString(),
    };
    store.messages = [...store.messages, optimistic];
    messagesEndRef.value?.scrollIntoView({ behavior: "smooth" });

    // POST to server
    const res = await fetch("/api/rooms/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, roomId: data.value.room._id }),
    });
    const json = await res.json();
    if (json.message) {
      // Replace optimistic bubble with real server message
      store.messages = store.messages.map((m) =>
        m._id === tempId ? json.message : m,
      );
      // Advance cursor to the real createdAt — poller uses $gt so this ID
      // won't be returned again (it's already in state with the real _id)
      lastMessageTime.value = json.message.createdAt;
    }
  });

  if (!data.value.room) {
    // Error boundary fallback
    return (
      <div class="flex flex-1 flex-col items-center justify-center gap-4">
        <div class="text-6xl">😕</div>
        <h2 class="text-2xl font-bold">Couldn't load this room</h2>
        <p class="text-gray-400">
          The room may not exist or there was a server error.
        </p>
        <Link
          href="/chat"
          class="rounded-lg bg-purple-600 px-4 py-2 hover:bg-purple-700"
        >
          ← Back to Lobby
        </Link>
      </div>
    );
  }

  // useResource$ — live typing indicator (polls for typing users)
  const typingResource = useResource$<string[]>(async ({ track, cleanup }) => {
    track(() => input.value);
    const roomId = data.value.room!._id;
    const ctrl = new AbortController();
    cleanup(() => ctrl.abort());
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/typing?user=${ctx.currentUser?.username ?? ""}`,
        { signal: ctrl.signal },
      );
      const json = await res.json();
      return (json.typing ?? []) as string[];
    } catch {
      return [];
    }
  });

  return (
    <div class="flex flex-1 flex-col overflow-hidden">
      {/* Room header */}
      <div class="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-lg font-bold">
            {data.value.room.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 class="font-semibold">{data.value.room.name}</h2>
            <p class="text-xs text-gray-400">
              {data.value.room.description || "No description"} ·{" "}
              {data.value.room.members.length} members
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          {/* Live connection indicator */}
          <span class="flex items-center gap-1 text-xs text-green-400">
            <span class="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            {store.isConnected ? "Live" : "Connecting…"}
          </span>
          {/* Clear chat */}
          {data.value.room.createdBy === ctx.currentUser?.username && (
            <button
              class="rounded-lg bg-red-900/50 px-3 py-1 text-xs text-red-300 hover:bg-red-800"
              onClick$={async () => {
                if (!confirm("Clear all messages?")) return;
                const res = await fetch("/api/rooms/messages/clear", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ roomId: data.value.room!._id }),
                });
                if ((await res.json()).success) store.messages = [];
              }}
            >
              Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div class="border-b border-gray-800 bg-gray-900/50 px-4 py-2">
        <input
          value={searchQuery.value}
          onInput$={(e) =>
            (searchQuery.value = (e.target as HTMLInputElement).value)
          }
          placeholder="🔍 Search messages..."
          class="w-full rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {/* Message list — scrollable */}
      <div class="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {filteredMessages.value.length === 0 ? (
          <div class="flex flex-col items-center justify-center gap-2 py-20 text-gray-500">
            <span class="text-4xl">🗨️</span>
            <p>
              {searchQuery.value
                ? "No messages match your search"
                : "No messages yet. Say hello!"}
            </p>
          </div>
        ) : (
          filteredMessages.value.map((msg) => (
            <MessageItem
              key={msg._id}
              message={msg}
              isOwn={msg.username === ctx.currentUser?.username}
              onDelete$={async (id: string) => {
                store.deletingId = id;
                await fetch(`/api/rooms/messages/${id}`, {
                  method: "DELETE",
                });
                store.messages = store.messages.filter((m) => m._id !== id);
                store.deletingId = "";
              }}
            />
          ))
        )}
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator — useResource$ + Resource */}
      <div class="h-5 px-4 py-1 text-xs text-purple-300">
        <Resource
          value={typingResource}
          onPending={() => <span />}
          onResolved={(users) =>
            users.length > 0 ? (
              <span>{users.join(", ")} is typing…</span>
            ) : (
              <span />
            )
          }
        />
      </div>

      {/* Emoji picker — lazy loaded (resumability) */}
      {store.showEmojiPicker && (
        <div class="border-t border-gray-700 bg-gray-900 px-4 py-2">
          <EmojiPicker
            onPick$={(emoji: string) => {
              input.value += emoji;
              store.showEmojiPicker = false;
            }}
          />
        </div>
      )}

      {/* Input bar */}
      <div class="border-t border-gray-700 bg-gray-900 px-4 py-3">
        <div class="flex items-end gap-2">
          {/* Emoji toggle */}
          <button
            class="rounded-lg p-2 text-xl text-gray-400 hover:bg-gray-800 hover:text-white"
            onClick$={() => (store.showEmojiPicker = !store.showEmojiPicker)}
            title="Emoji"
          >
            😊
          </button>

          {/* Message textarea */}
          <div class="relative flex-1">
            <textarea
              ref={inputRef}
              value={input.value}
              onInput$={(e) =>
                (input.value = (e.target as HTMLTextAreaElement).value)
              }
              onKeyDown$={async (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  await sendMessage();
                }
              }}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={1}
              class="w-full resize-none rounded-xl bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
            />
            {/* Char counter — useComputed$ */}
            <span
              class={`absolute right-2 bottom-1.5 text-xs ${charCount.value > charLimit * 0.9 ? "text-red-400" : "text-gray-600"}`}
            >
              {charCount.value}/{charLimit}
            </span>
          </div>

          {/* Send button — disabled via useComputed$ */}
          <button
            class={`rounded-xl px-4 py-2.5 font-semibold transition ${canSend.value ? "bg-purple-600 text-white hover:bg-purple-700" : "cursor-not-allowed bg-gray-700 text-gray-500"}`}
            onClick$={sendMessage}
            disabled={!canSend.value}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useRoomData);
  return {
    title: data.room ? `#${data.room.name} — QwikChat` : "QwikChat",
  };
};
