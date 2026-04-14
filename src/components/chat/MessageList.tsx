import { component$ } from "@builder.io/qwik";
import MessageItem from "./MessageItem";

export default component$(({ messages }: any) => {
  return (
    <div class="mb-4 flex-1 overflow-y-auto">
      {messages.value.map((msg: any) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isOwn={msg.isOwn}
          onDelete$={() => {}}
        />
      ))}
    </div>
  );
});
