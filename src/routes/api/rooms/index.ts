/**
 * GET /api/rooms — List all rooms
 * POST /api/rooms — Create a room
 */
import type { RequestHandler } from "@builder.io/qwik-city";
import { connectDB, Room } from "~/lib/db";

export const onGet: RequestHandler = async ({ json }) => {
  await connectDB();
  const rooms = await Room.find().sort({ createdAt: -1 }).lean();
  json(200, {
    rooms: rooms.map((r: any) => ({
      _id: r._id.toString(),
      name: r.name,
      description: r.description || "",
      createdBy: r.createdBy,
      members: r.members,
      createdAt: r.createdAt?.toISOString(),
    })),
  });
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
      data = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      json(400, { error: "Invalid JSON body" });
      return;
    }
    const { name, description } = data;
    if (!name?.trim()) {
      json(400, { error: "Room name required" });
      return;
    }

    const room = await Room.create({
      name: name.trim(),
      description: description?.trim() || "",
      createdBy: sessionUser.username,
      members: [sessionUser.username],
    });

    json(201, {
      room: {
        _id: room._id.toString(),
        name: room.name,
        description: room.description,
        createdBy: room.createdBy,
        members: room.members,
        createdAt: room.createdAt?.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Error creating room:", err);
    json(500, { error: "Failed to create room" });
  }
};
