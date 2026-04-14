/**
 * /users — List all users (MongoDB)
 * Qwik concepts: routeLoader$, component$
 */
import { component$ } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import { connectDB, User } from "~/lib/db";

export const useGetUsers = routeLoader$(async () => {
  await connectDB();
  const users = await User.find().sort({ createdAt: -1 }).lean();
  return (users as any[]).map((u) => ({
    _id: u._id.toString(),
    username: u.username,
    avatar: u.avatar,
    createdAt: u.createdAt?.toISOString(),
  }));
});

export default component$(() => {
  const users = useGetUsers();
  return (
    <div class="min-h-screen bg-gray-950 p-8 text-white">
      <h1 class="mb-6 text-2xl font-bold">All Users</h1>
      <div class="grid gap-3">
        {users.value.map((user) => (
          <a
            key={user._id}
            href={`/users/${user._id}`}
            class="flex items-center gap-3 rounded-xl bg-gray-800 px-4 py-3 hover:bg-gray-700"
          >
            <img
              src={
                user.avatar ||
                `https://api.dicebear.com/7.x/thumbs/svg?seed=${user.username}`
              }
              alt={user.username}
              width={36}
              height={36}
              class="h-9 w-9 rounded-full"
            />
            <span class="font-medium">{user.username}</span>
          </a>
        ))}
      </div>
    </div>
  );
});

export const head: DocumentHead = { title: "Users — QwikChat" };
