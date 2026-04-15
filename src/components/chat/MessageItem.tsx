/**
 * MessageItem — individual chat bubble
 */
import {
  component$,
  useSignal,
  useStylesScoped$,
  type PropFunction,
} from "@builder.io/qwik";
import type { Message } from "~/lib/types";

// ─── Scoped styles — only apply to THIS component's DOM nodes ────────────────
const SCOPED_STYLES = `
  .bubble-enter {
    animation: bubbleIn 0.18s ease-out both;
  }
  @keyframes bubbleIn {
    from { opacity: 0; transform: translateY(6px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }
  .sending {
    animation: pulse 1s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1;   }
  }
  .delete-btn {
    opacity: 0;
    transition: opacity 0.15s;
  }
  .row:hover .delete-btn {
    opacity: 1;
  }
  .timestamp {
    font-size: 0.65rem;
    opacity: 0.55;
    margin-left: 6px;
    white-space: nowrap;
  }
`;

interface Props {
  message: Message;
  isOwn: boolean;
  onDelete$: PropFunction<(id: string) => void>;
}

export default component$<Props>(({ message, isOwn, onDelete$ }) => {
  useStylesScoped$(SCOPED_STYLES);

  const hovered = useSignal(false);
  const isSending = message._id.startsWith("temp-");

  const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      class={`row bubble-enter flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter$={() => (hovered.value = true)}
      onMouseLeave$={() => (hovered.value = false)}
    >
      {/* Avatar */}
      <img
        src={
          message.avatar ||
          `https://api.dicebear.com/7.x/thumbs/svg?seed=${message.username}`
        }
        alt={message.username}
        width={28}
        height={28}
        class="h-7 w-7 shrink-0 rounded-full"
      />

      {/* Bubble */}
      <div
        class={`flex max-w-[70%] flex-col ${isOwn ? "items-end" : "items-start"}`}
      >
        {!isOwn && (
          <span class="mb-0.5 text-xs text-gray-400">{message.username}</span>
        )}
        <div class="relative flex items-center gap-1">
          <div
            class={[
              "rounded-2xl px-3 py-2 text-sm",
              isOwn
                ? "rounded-br-sm bg-purple-600 text-white"
                : "rounded-bl-sm bg-gray-700 text-gray-100",
              isSending ? "sending" : "",
            ].join(" ")}
          >
            {message.text}
            <span class="timestamp">{isSending ? "sending…" : timeStr}</span>
          </div>

          {/* Delete button — scoped .delete-btn shows on .row:hover */}
          {isOwn && !isSending && (
            <button
              class="delete-btn shrink-0 text-xs text-gray-500 hover:text-red-400"
              onClick$={() => onDelete$(message._id)}
              title="Delete message"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
