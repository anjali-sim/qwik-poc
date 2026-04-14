/**
 * AnalyticsPanel — shows room/message stats
 * Qwik concepts: component$, useComputed$ (passed as prop), useContext
 */
import { component$, type ReadonlySignal, useContext } from "@builder.io/qwik";
import { ChatContext } from "~/lib/context";

interface Props {
  count: ReadonlySignal<number>;
}

export default component$<Props>(({ count }) => {
  const ctx = useContext(ChatContext);

  return (
    <div class="flex items-center gap-4 border-t border-gray-700 bg-gray-900/60 px-4 py-2 text-xs text-gray-400">
      <span>💬 {count.value} messages</span>
      <span>🏠 {ctx.rooms.length} rooms</span>
      <span>👤 {ctx.currentUser?.username ?? "—"}</span>
    </div>
  );
});
