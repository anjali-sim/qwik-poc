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

export const onPost: RequestHandler = async ({ request, json, cookie }) => {
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
        data = {
          name: params.get("name"),
          description: params.get("description"),
        };
      } else if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        data = {
          name: formData.get("name"),
          description: formData.get("description"),
        };
      }
    } catch (parseErr) {
      console.error("Error parsing request body:", parseErr);
      json(400, { error: "Invalid request body" });
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
