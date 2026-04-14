/**
 * DELETE /api/rooms/messages/clear — Clear all messages in a room
 */
import type { RequestHandler } from "@builder.io/qwik-city";
import { connectDB, Message, Room } from "~/lib/db";

export const onDelete: RequestHandler = async ({ json, cookie, parseBody }) => {
  try {
    await connectDB();
    const userCookie = cookie.get("chat_user")?.value;
    const sessionUser = userCookie ? JSON.parse(userCookie) : null;
    if (!sessionUser) {
      json(401, { error: "Unauthorized" });
      return;
    }

    const raw = await parseBody();
    if (!raw) {
      json(400, { error: "Request body is empty" });
      return;
    }
    let data: any;
    try {
      if (typeof raw === "string") {
        data = JSON.parse(raw);
      } else if (raw instanceof Uint8Array || Buffer.isBuffer(raw)) {
        data = JSON.parse(Buffer.from(raw).toString("utf-8"));
      } else if (typeof raw === "object") {
        data = raw;
      } else {
        data = JSON.parse(String(raw));
      }
    } catch {
      json(400, { error: "Invalid JSON body" });
      return;
    }

    const { roomId } = data;
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
  } catch (err: any) {
    console.error("Error clearing messages:", err);
    json(500, { error: "Failed to clear messages" });
  }
};
