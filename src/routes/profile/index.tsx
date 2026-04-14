/**
 * /profile — User profile page
 * Qwik concepts:
 *  • routeLoader$ (SSR data)
 *  • server$ (fetch user profile server-side)
 *  • routeAction$ + Form (update username/avatar)
 *  • component$, useSignal
 */
import { component$, useSignal } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  server$,
  Form,
  Link,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { connectDB, User, Message } from "~/lib/db";

// ─── server$ — Fetch full user profile (runs server-side) ────────────────────
export const getUserProfile = server$(async function (username: string) {
  await connectDB();
  const user = await User.findOne({ username }).lean();
  const msgCount = await Message.countDocuments({ username });
  return {
    user: user
      ? {
          _id: (user as any)._id.toString(),
          username: (user as any).username,
          avatar: (user as any).avatar,
          createdAt: (user as any).createdAt?.toISOString(),
        }
      : null,
    messageCount: msgCount,
  };
});

// ─── routeLoader$ ─────────────────────────────────────────────────────────────
export const useProfileData = routeLoader$(async ({ cookie, status }) => {
  const userCookie = cookie.get("chat_user")?.value;
  if (!userCookie) {
    status(401);
    return { user: null, messageCount: 0 };
  }
  const sessionUser = JSON.parse(userCookie);
  return await getUserProfile(sessionUser.username);
});

// ─── routeAction$ — Logout ────────────────────────────────────────────────────
export const useLogout = routeAction$(async (_, { cookie, redirect }) => {
  cookie.delete("chat_user", { path: "/" });
  throw redirect(302, "/login");
});

// ─── Component ────────────────────────────────────────────────────────────────
export default component$(() => {
  const data = useProfileData();
  const logoutAction = useLogout();
  const showStats = useSignal(false);

  if (!data.value.user) {
    return (
      <div class="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p>
          Please{" "}
          <Link href="/login" class="text-purple-400 underline">
            login
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-950 text-white">
      <div class="mx-auto max-w-lg p-8">
        {/* Header */}
        <div class="mb-6 flex items-center gap-3">
          <Link href="/chat" class="text-gray-400 hover:text-white">
            ← Back to Chat
          </Link>
        </div>

        {/* Profile card */}
        <div class="rounded-2xl bg-gray-800 p-8 text-center shadow-xl">
          <img
            src={
              data.value.user.avatar ||
              `https://api.dicebear.com/7.x/thumbs/svg?seed=${data.value.user.username}`
            }
            alt="Avatar"
            width={96}
            height={96}
            class="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-purple-500"
          />
          <h1 class="text-2xl font-bold">{data.value.user.username}</h1>
          <p class="mt-1 text-gray-400">
            Member since{" "}
            {new Date(data.value.user.createdAt).toLocaleDateString()}
          </p>

          {/* Stats toggle — useSignal */}
          <button
            class="mt-4 text-sm text-purple-400 underline"
            onClick$={() => {
              showStats.value = !showStats.value;
            }}
          >
            {showStats.value ? "Hide Stats" : "View Stats"}
          </button>

          {/* Stats card - shown when showStats is true */}
          {showStats.value && (
            <div class="mt-4 flex justify-center gap-8">
              <div class="rounded-xl bg-gray-700 px-5 py-3">
                <p class="text-2xl font-bold text-purple-300">
                  {data.value.messageCount}
                </p>
                <p class="text-xs text-gray-400">Messages Sent</p>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div class="mt-6">
          <Form action={logoutAction}>
            <button
              type="submit"
              class="w-full rounded-xl bg-red-700 py-3 font-semibold hover:bg-red-600"
            >
              {logoutAction.isRunning ? "Logging out…" : "Logout"}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Profile — QwikChat",
};
