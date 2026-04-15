/**
 * RoomSidebar — persists across all /chat/* routes (nested layout)
 * Qwik concepts:
 *  • component$
 *  • useContext (reads ChatContext — no prop drilling)
 *  • useSignal (search filter)
 *  • useComputed$ (filtered rooms)
 *  • useLocation (highlight active room)
 *  • useStyles$ — inject global styles once for this component tree.
 *    Unlike useStylesScoped$, these rules are NOT scoped — they apply
 *    globally but are injected lazily only when this component is used.
 *    Perfect for sidebar-wide typography and scrollbar overrides.
 */
import {
  component$,
  useContext,
  useSignal,
  useComputed$,
  useStyles$,
} from "@builder.io/qwik";
import { useLocation, Link } from "@builder.io/qwik-city";
import { ChatContext } from "~/lib/context";

// ─── Global styles injected once when sidebar mounts ─────────────────────────
// useStyles$ — loaded once, not duplicated even if component renders many times.
const SIDEBAR_STYLES = `
  .sidebar-room-list {
    scrollbar-width: thin;
    scrollbar-color: #4c1d95 transparent;
  }
  .sidebar-room-list::-webkit-scrollbar {
    width: 4px;
  }
  .sidebar-room-list::-webkit-scrollbar-thumb {
    background: #4c1d95;
    border-radius: 4px;
  }
  .room-link {
    transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
  }
  .room-link:hover {
    transform: translateX(2px);
  }
  .room-link.active {
    box-shadow: inset 3px 0 0 #a855f7;
  }
  .online-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: onlinePulse 2.5s ease-in-out infinite;
  }
  @keyframes onlinePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
    50%       { box-shadow: 0 0 0 4px rgba(34,197,94,0);  }
  }
`;

export default component$(() => {
  // useStyles$ — inject sidebar global styles (once, not scoped)
  useStyles$(SIDEBAR_STYLES);

  const ctx = useContext(ChatContext);
  const loc = useLocation();
  const search = useSignal("");

  const filteredRooms = useComputed$(() => {
    if (!search.value.trim()) return ctx.rooms;
    const q = search.value.toLowerCase();
    return ctx.rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  });

  return (
    <aside class="flex w-64 flex-col border-r border-gray-700 bg-gray-900">
      {/* App header */}
      <div class="flex items-center justify-between border-b border-gray-700 px-4 py-4">
        <div class="flex items-center gap-2">
          <span class="text-xl">💬</span>
          <span class="font-bold text-purple-300">QwikChat</span>
        </div>
        <Link
          href="/profile"
          title="Profile"
          class="text-xl text-gray-400 hover:text-white"
        >
          👤
        </Link>
      </div>

      {/* Current user */}
      {ctx.currentUser && (
        <div class="flex items-center gap-2 border-b border-gray-700 px-4 py-3">
          <img
            src={
              ctx.currentUser.avatar ||
              `https://api.dicebear.com/7.x/thumbs/svg?seed=${ctx.currentUser.username}`
            }
            alt={ctx.currentUser.username}
            width={32}
            height={32}
            class="h-8 w-8 rounded-full"
          />
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">
              {ctx.currentUser.username}
            </p>
            {/* online-dot uses the pulsing animation injected by useStyles$ */}
            <span class="flex items-center gap-1 text-xs text-green-400">
              <span class="online-dot" /> Online
            </span>
          </div>
        </div>
      )}

      {/* Room search */}
      <div class="px-3 py-2">
        <input
          value={search.value}
          onInput$={(e) =>
            (search.value = (e.target as HTMLInputElement).value)
          }
          placeholder="Search rooms…"
          class="w-full rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {/* Room list — sidebar-room-list applies custom scrollbar from useStyles$ */}
      <div class="sidebar-room-list flex-1 overflow-y-auto px-2 py-1">
        <p class="mb-1 px-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
          Rooms ({filteredRooms.value.length})
        </p>
        {filteredRooms.value.length === 0 ? (
          <p class="px-2 text-xs text-gray-600">No rooms found</p>
        ) : (
          filteredRooms.value.map((room) => {
            const isActive = loc.url.pathname === `/chat/${room._id}`;
            return (
              <Link
                key={room._id}
                href={`/chat/${room._id}`}
                class={`room-link flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "active bg-purple-700 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <div
                  class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isActive ? "bg-purple-500" : "bg-gray-700"}`}
                >
                  {room.name.charAt(0).toUpperCase()}
                </div>
                <div class="min-w-0">
                  <p class="truncate font-medium"># {room.name}</p>
                  {room.description && (
                    <p class="truncate text-xs text-gray-500">
                      {room.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Create room link */}
      <div class="space-y-2 border-t border-gray-700 px-3 py-3">
        <Link
          href="/chat"
          class="room-link flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <span class="text-lg">＋</span> New Room
        </Link>
        <Link
          href="/users"
          class="room-link flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <span class="text-lg">👥</span> Users list
        </Link>
        <Link
          href="/analytics"
          class="room-link flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <span class="text-lg">📊</span> Analytics
        </Link>
      </div>
    </aside>
  );
});
