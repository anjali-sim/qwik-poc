/**
 * DELETE /api/rooms/messages/clear — Clear all messages in a room
 */
import type { RequestHandler } from "@builder.io/qwik-city";
import { connectDB, Message, Room } from "~/lib/db";

export const onDelete: RequestHandler = async ({ request, json, cookie }) => {
  try {
    await connectDB();
    const userCookie = cookie.get("chat_user")?.value;
    const sessionUser = userCookie ? JSON.parse(userCookie) : null;
    if (!sessionUser) {
      json(401, { error: "Unauthorized" });
      return;
    }

    let data: any = {};
    const contentType = request.headers.get("content-type") || "";

    try {
      if (contentType.includes("application/json")) {
        data = await request.json();
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await request.text();
        const params = new URLSearchParams(text);
        data = { roomId: params.get("roomId") };
      } else if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        data = { roomId: formData.get("roomId") };
      }
    } catch (parseErr) {
      console.error("Error parsing request body:", parseErr);
      json(400, { error: "Invalid request body" });
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
