/**
 * /users/[userId] — User detail page (MongoDB)
 */
import { component$ } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import { connectDB, User } from "~/lib/db";

export const useGetUser = routeLoader$(async ({ params, status }) => {
  await connectDB();
  const user = await User.findById(params.userId).lean();
  if (!user) {
    status(404);
    return null;
  }
  return {
    _id: (user as any)._id.toString(),
    username: (user as any).username,
    avatar: (user as any).avatar,
    createdAt: (user as any).createdAt?.toISOString(),
  };
});

export default component$(() => {
  const user = useGetUser();
  return (
    <div class="min-h-screen bg-gray-950 p-8 text-white">
      {user.value ? (
        <div class="mx-auto max-w-sm rounded-2xl bg-gray-800 p-8 text-center">
          <img
            src={
              user.value.avatar ||
              `https://api.dicebear.com/7.x/thumbs/svg?seed=${user.value.username}`
            }
            alt={user.value.username}
            width={80}
            height={80}
            class="mx-auto mb-4 h-20 w-20 rounded-full"
          />
          <h1 class="text-2xl font-bold">{user.value.username}</h1>
          <p class="mt-1 text-gray-400">
            Joined {new Date(user.value.createdAt).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <p class="text-gray-400">User not found</p>
      )}
    </div>
  );
});

export const head: DocumentHead = { title: "User — QwikChat" };
