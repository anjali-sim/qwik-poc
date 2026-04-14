/**
 * DELETE /api/rooms/messages/[messageId] — Delete a single message
 */
import type { RequestHandler } from "@builder.io/qwik-city";
import { connectDB, Message } from "~/lib/db";

export const onDelete: RequestHandler = async ({ params, json, cookie }) => {
  await connectDB();
  const userCookie = cookie.get("chat_user")?.value;
  const sessionUser = userCookie ? JSON.parse(userCookie) : null;
  if (!sessionUser) {
    json(401, { error: "Unauthorized" });
    return;
  }

  const msg = await Message.findById(params.messageId);
  if (!msg) {
    json(404, { error: "Message not found" });
    return;
  }
  if (msg.username !== sessionUser.username) {
    json(403, { error: "Cannot delete another user's message" });
    return;
  }

  await msg.deleteOne();
  json(200, { success: true });
};
