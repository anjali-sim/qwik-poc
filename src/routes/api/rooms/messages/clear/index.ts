/**
 * DELETE /api/rooms/messages/clear — Clear all messages in a room
 */
import type { RequestHandler } from "@builder.io/qwik-city";
import { connectDB, Message, Room } from "~/lib/db";

export const onDelete: RequestHandler = async ({ request, json, cookie }) => {
  await connectDB();
  const userCookie = cookie.get("chat_user")?.value;
  const sessionUser = userCookie ? JSON.parse(userCookie) : null;
  if (!sessionUser) {
    json(401, { error: "Unauthorized" });
    return;
  }

  const { roomId } = await request.json();
  if (!roomId) {
    json(400, { error: "roomId required" });
    return;
  }

  const room = await Room.findById(roomId).lean();
  if (!room || (room as any).createdBy !== sessionUser.username) {
    json(403, { error: "Only room creator can clear chat" });
    return;
  }

  await Message.deleteMany({ roomId });
  json(200, { success: true });
};
