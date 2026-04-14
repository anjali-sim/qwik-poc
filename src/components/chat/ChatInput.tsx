import { component$ } from "@builder.io/qwik";

export default component$((props: any) => {
  return (
    <div class="flex gap-2">
      <input
        class="flex-1 border p-2"
        value={props.input.value}
        onInput$={(e) =>
          (props.input.value = (e.target as HTMLInputElement).value)
        }
        onKeyDown$={async (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            await props.sendMessage();
          }
        }}
        placeholder="Type message..."
      />

      <button
        class="bg-blue-500 px-4 text-white"
        type="button"
        onClick$={props.sendMessage}
      >
        Send
      </button>

      {props.loading.value && <p>Typing...</p>}
    </div>
  );
});
