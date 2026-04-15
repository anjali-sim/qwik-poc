/**
 * EmojiPicker — lazily loaded component
 * This component's JS only downloads when the user clicks the emoji button.
 */
import { component$, type PropFunction } from "@builder.io/qwik";

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "😅",
  "👍",
  "🙏",
  "❤️",
  "🎉",
  "🔥",
  "✨",
  "👀",
  "🤣",
  "😭",
  "😊",
  "😘",
  "🥲",
  "😤",
  "🫡",
  "🤝",
  "💪",
  "🎯",
  "⚡",
  "🌟",
  "💯",
  "🚀",
  "👏",
  "🥳",
];

interface Props {
  onPick$: PropFunction<(emoji: string) => void>;
}

export default component$<Props>(({ onPick$ }) => {
  return (
    <div class="flex flex-wrap gap-1 rounded-xl bg-gray-800 p-3 shadow-xl">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          class="rounded-lg p-1.5 text-xl transition hover:bg-gray-700"
          onClick$={() => onPick$(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
});
