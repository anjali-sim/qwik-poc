/**
 * /analytics — Analytics dashboard showing chat statistics
 */
import { component$ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import { connectDB, Message, Room, User } from "~/lib/db";

// ─── routeLoader$ ─────────────────────────────────────────────────────────────
export const useAnalyticsData = routeLoader$(async ({ cookie }) => {
  await connectDB();

  const totalMessages = await Message.countDocuments();
  const totalRooms = await Room.countDocuments();

  const recentMessages = await Message.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Get current user from cookie
  const userCookie = cookie.get("chat_user")?.value;
  const sessionUser = userCookie ? JSON.parse(userCookie) : null;
  let currentUser = null;

  if (sessionUser?.username) {
    currentUser = await User.findOne({ username: sessionUser.username }).lean();
  }

  return {
    totalMessages,
    totalRooms,
    currentUser: currentUser
      ? {
          _id: (currentUser as any)._id.toString(),
          username: (currentUser as any).username,
          avatar: (currentUser as any).avatar,
          createdAt: (currentUser as any).createdAt?.toISOString(),
        }
      : sessionUser,
    recentMessages: recentMessages.map((m: any) => ({
      _id: m._id.toString(),
      content: m.text || m.content,
      author: m.username || m.author,
      room: m.roomId || m.room,
      createdAt: m.createdAt?.toISOString(),
    })),
  };
});

// ─── Component ────────────────────────────────────────────────────────────────
export default component$(() => {
  const data = useAnalyticsData();

  return (
    <div class="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div class="border-b border-gray-700 bg-gray-900/60 px-6 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-purple-300">
              Analytics Dashboard
            </h1>
            <p class="mt-1 text-sm text-gray-400">
              Chat statistics and insights
            </p>
          </div>
          <Link
            href="/chat"
            class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700"
          >
            ← Back to Chat
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div class="flex flex-col gap-6 p-6">
        {/* Stats Cards */}
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Total Messages */}
          <div class="rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-400">Total Messages</p>
                <p class="mt-2 text-3xl font-bold text-purple-400">
                  {data.value.totalMessages}
                </p>
              </div>
              <div class="text-4xl">💬</div>
            </div>
          </div>

          {/* Total Rooms */}
          <div class="rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-400">Total Rooms</p>
                <p class="mt-2 text-3xl font-bold text-blue-400">
                  {data.value.totalRooms}
                </p>
              </div>
              <div class="text-4xl">🏠</div>
            </div>
          </div>

          {/* Current User */}
          <div class="rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-400">Current User</p>
                <p class="mt-2 text-xl font-bold text-green-400">
                  {data.value.currentUser?.username ?? "Guest"}
                </p>
              </div>
              <div class="text-4xl">👤</div>
            </div>
          </div>
        </div>

        {/* Analytics Panel */}
        <div class="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
          <div class="border-b border-gray-700 px-6 py-4">
            <h2 class="text-xl font-bold">Quick Stats Summary</h2>
          </div>
          <div class="flex items-center gap-4 border-t border-gray-700 bg-gray-900/60 px-4 py-2 text-xs text-gray-400">
            <span>💬 {data.value.totalMessages} messages</span>
            <span>🏠 {data.value.totalRooms} rooms</span>
            <span>👤 {data.value.currentUser?.username ?? "—"}</span>
          </div>
        </div>

        {/* Recent Messages */}
        <div class="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
          <div class="border-b border-gray-700 px-6 py-4">
            <h2 class="text-xl font-bold">Recent Messages</h2>
          </div>
          <div class="divide-y divide-gray-700">
            {data.value.recentMessages.length === 0 ? (
              <p class="px-6 py-4 text-sm text-gray-500">No messages yet</p>
            ) : (
              data.value.recentMessages.map((msg) => (
                <div key={msg._id} class="px-6 py-4 text-sm">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <p class="font-medium text-purple-400">{msg.author}</p>
                      <p class="mt-1 text-gray-300">{msg.content}</p>
                    </div>
                    <p class="ml-4 text-xs text-gray-500">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
