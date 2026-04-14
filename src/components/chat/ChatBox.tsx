import { component$ } from "@builder.io/qwik";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default component$((props: any) => {
  return (
    <div class="flex flex-col flex-1 border p-4">
      <MessageList messages={props.messages} />
      <ChatInput {...props} />
    </div>
  );
});