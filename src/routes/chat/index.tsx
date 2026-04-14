/**
 * /chat — Lobby page shown when no room is selected
 * Qwik concepts:
 *  • component$
 *  • useContext (reads ChatContext provided in layout)
 *  • useSignal / useStore
 *  • useNavigate (client-side navigation)
 */
import { component$, useContext, useSignal, $ } from "@builder.io/qwik";
import { useNavigate, type DocumentHead } from "@builder.io/qwik-city";
import { ChatContext } from "~/lib/context";
import type { Room } from "~/lib/types";

// ─── Component ────────────────────────────────────────────────────────────────
export default component$(() => {
  const ctx = useContext(ChatContext);
  const nav = useNavigate();

  const showForm = useSignal(false);
  const roomName = useSignal("");
  const roomDesc = useSignal("");
  const nameError = useSignal("");
  const isCreating = useSignal(false);

  const createRoom = $(async () => {
    const name = roomName.value.trim();
    if (name.length < 2) {
      nameError.value = "Room name must be at least 2 characters";
      return;
    }
    if (name.length > 40) {
      nameError.value = "Room name max 40 characters";
      return;
    }
    nameError.value = "";
    isCreating.value = true;

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: roomDesc.value.trim() }),
      });
      const json = await res.json();

      if (json.room) {
        // Instantly add room to sidebar context — no page reload needed
        ctx.rooms = [json.room as Room, ...ctx.rooms];
        // Reset form state BEFORE navigating so signals are clean when
        // the user returns to /chat (Qwik preserves signal values in layout)
        roomName.value = "";
        roomDesc.value = "";
        nameError.value = "";
        showForm.value = false;
        isCreating.value = false;
        // Navigate into the new room
        await nav(`/chat/${json.room._id}`);
        return;
      }
    } catch {
      nameError.value = "Failed to create room. Please try again.";
    } finally {
      isCreating.value = false;
    }
  });

  return (
    <div class="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div class="text-center">
        <div class="mb-4 text-7xl">💬</div>
        <h1 class="text-3xl font-bold">
          Welcome, {ctx.currentUser?.username}!
        </h1>
        <p class="mt-2 text-gray-400">
          Select a room from the sidebar or create a new one.
        </p>
      </div>

      {/* Stats */}
      <div class="flex gap-6">
        <div class="rounded-xl bg-purple-900/40 px-6 py-4 text-center">
          <p class="text-3xl font-bold text-purple-300">{ctx.rooms.length}</p>
          <p class="text-sm text-gray-400">Rooms</p>
        </div>
      </div>

      {/* Create room button */}
      <button
        class="rounded-full bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-700"
        onClick$={() => {
          showForm.value = !showForm.value;
          // Always reset form state when toggling
          roomName.value = "";
          roomDesc.value = "";
          nameError.value = "";
        }}
      >
        {showForm.value ? "✕ Cancel" : "+ Create New Room"}
      </button>

      {showForm.value && (
        <div class="w-full max-w-md rounded-2xl bg-gray-800 p-6 shadow-xl">
          <h2 class="mb-4 text-lg font-semibold">Create Chat Room</h2>
          <div class="space-y-3">
            <div>
              <input
                key={`room-name-${showForm.value}`}
                value={roomName.value}
                onInput$={(e) =>
                  (roomName.value = (e.target as HTMLInputElement).value)
                }
                onKeyDown$={async (e) => {
                  if (e.key === "Enter") await createRoom();
                }}
                placeholder="Room name"
                autofocus
                class="w-full rounded-lg bg-gray-700 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500"
              />
              {nameError.value && (
                <p class="mt-1 text-xs text-red-400">{nameError.value}</p>
              )}
            </div>
            <input
              key={`room-desc-${showForm.value}`}
              value={roomDesc.value}
              onInput$={(e) =>
                (roomDesc.value = (e.target as HTMLInputElement).value)
              }
              placeholder="Description (optional)"
              class="w-full rounded-lg bg-gray-700 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick$={createRoom}
              disabled={isCreating.value}
              class="w-full rounded-lg bg-purple-600 py-2 font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              {isCreating.value ? "Creating…" : "Create Room"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "QwikChat — Lobby",
};
