import { component$, useSignal } from "@builder.io/qwik";
import {
  routeAction$,
  zod$,
  z,
  Form,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { connectDB, User } from "~/lib/db";

export const useLoginOrRegister = routeAction$(
  async (data, { cookie, redirect }) => {
    try {
      await connectDB();

      let user = await User.findOne({ username: data.username }).lean();

      if (!user) {
        // Auto-register: create user if not found
        const avatarSeed = encodeURIComponent(data.username);
        const newUser = await User.create({
          username: data.username,
          avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${avatarSeed}`,
        });
        user = newUser.toObject();
      }

      // Store session in cookie
      cookie.set(
        "chat_user",
        JSON.stringify({
          _id: (user as any)._id?.toString(),
          username: (user as any).username,
          avatar: (user as any).avatar,
        }),
        {
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: false,
          sameSite: "lax",
        },
      );

      throw redirect(302, "/chat");
    } catch (err: any) {
      // Example: Error handling on the server-side action
      // If an error occurs (e.g., database connection), we can catch it here
      // and either return a failure response or re-throw
      if (err?.status) {
        throw err;
      }
      // For other errors, you could return a failure response to show custom error UI
      // The Form component will then show this error state to the user
      console.error("Login error:", err);
      throw err;
    }
  },
  zod$({
    username: z
      .string()
      .min(2, "Username must be at least 2 characters")
      .max(20, "Username max 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
  }),
);

// ─── Component ───────────────────────────────────────────────────────────────
export default component$(() => {
  const action = useLoginOrRegister();
  const showTip = useSignal(false);

  return (
    <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div class="w-full max-w-md">
        {/* Logo / Header */}
        <div class="mb-8 text-center">
          <div class="mb-3 text-6xl">💬</div>
          <h1 class="text-4xl font-bold text-white">QwikChat</h1>
          <p class="mt-2 text-purple-200">Real-time group messaging</p>
        </div>

        {/* Card */}
        <div class="rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-md">
          <h2 class="mb-6 text-center text-xl font-semibold text-white">
            Enter your username to join
          </h2>

          <Form action={action} class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-purple-200">
                Username
              </label>
              <input
                name="username"
                type="text"
                placeholder="e.g. test_dev"
                class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30"
                autofocus
              />
              {/* Real-time validation feedback from validator$ */}
              {action.value?.fieldErrors?.username && (
                <p class="mt-1 text-sm text-red-400">
                  ✗ {action.value.fieldErrors.username}
                </p>
              )}
            </div>

            <button
              type="submit"
              class="w-full rounded-lg bg-linear-to-r from-purple-500 to-pink-500 py-3 font-semibold text-white shadow-lg transition hover:from-purple-600 hover:to-pink-600 active:scale-95"
            >
              {action.isRunning ? "Joining..." : "Join Chat →"}
            </button>
          </Form>

          {/* Tip toggle — useSignal */}
          <div class="mt-6 border-t border-white/10 pt-4 text-center">
            <button
              class="text-sm text-purple-300 hover:text-white"
              onClick$={() => (showTip.value = !showTip.value)}
            >
              {showTip.value ? "Hide" : "How does it work? "}
            </button>
            {showTip.value && (
              <p class="mt-2 text-xs text-purple-200">
                Enter any username. If it's new you'll be auto-registered.
                Return any time with the same username to continue chatting!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "QwikChat — Login",
};
