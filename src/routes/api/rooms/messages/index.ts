/**
 * POST /api/rooms/messages — Send a message
 * GET  /api/rooms/messages?roomId=&after= — Poll new messages
 */
import type { RequestHandler } from "@builder.io/qwik-city";
import { connectDB, Message, Room } from "~/lib/db";

export const onGet: RequestHandler = async ({ url, json }) => {
  await connectDB();
  const roomId = url.searchParams.get("roomId");
  const after = url.searchParams.get("after");
  if (!roomId) {
    json(400, { error: "roomId required" });
    return;
  }
  const query: any = { roomId };
  if (after) query.createdAt = { $gt: new Date(after) };
  const msgs = await Message.find(query).sort({ createdAt: "asc" }).lean();
  json(
    200,
    msgs.map((m: any) => ({
      _id: m._id.toString(),
      text: m.text,
      username: m.username,
      avatar: m.avatar,
      roomId: m.roomId,
      read: m.read,
      createdAt: m.createdAt?.toISOString(),
    })),
  );
};

export const onPost: RequestHandler = async ({ json, cookie, parseBody }) => {
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

    const { text, roomId } = data;
    if (!text?.trim() || !roomId) {
      json(400, { error: "text and roomId required" });
      return;
    }

    const msg = await Message.create({
      text: text.trim(),
      username: sessionUser.username,
      avatar: sessionUser.avatar || "",
      roomId,
    });

    await Room.findByIdAndUpdate(roomId, {
      $addToSet: { members: sessionUser.username },
    });

    json(201, {
      message: {
        _id: msg._id.toString(),
        text: msg.text,
        username: msg.username,
        avatar: msg.avatar,
        roomId: msg.roomId,
        read: msg.read,
        createdAt: msg.createdAt?.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Error sending message:", err);
    json(500, { error: "Failed to send message" });
  }
};
