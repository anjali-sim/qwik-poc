/**
 * GET /api/rooms/[roomId]/typing — Typing indicator endpoint
 * Used by useResource$ in the chat room for live presence status
 *
 * In-memory store for typing users (resets after 3s of inactivity)
 * For production: use Redis or MongoDB TTL
 */
import type { RequestHandler } from "@builder.io/qwik-city";

// Simple in-memory map: roomId -> Map<username, lastTyped timestamp>
const typingStore = new Map<string, Map<string, number>>();

export const onGet: RequestHandler = ({ params, url, json }) => {
  const roomId = params.roomId;
  const user = url.searchParams.get("user") ?? "";

  const roomTypers = typingStore.get(roomId) ?? new Map<string, number>();

  // Update this user's timestamp
  if (user) {
    roomTypers.set(user, Date.now());
    typingStore.set(roomId, roomTypers);
  }

  // Return users who typed in the last 3 seconds (excluding current user)
  const now = Date.now();
  const activeTypers = [...roomTypers.entries()]
    .filter(([u, t]) => u !== user && now - t < 3000)
    .map(([u]) => u);

  json(200, { typing: activeTypers });
};

export const onPost: RequestHandler = async ({ params, request, json }) => {
  try {
    const roomId = params.roomId;
    let data: any = {};
    const contentType = request.headers.get("content-type") || "";

    try {
      const bodyText = await request.text();

      if (!bodyText) {
        json(400, { error: "Request body is empty" });
        return;
      }

      if (contentType.includes("application/json")) {
        data = JSON.parse(bodyText);
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams(bodyText);
        data = { username: params.get("username") };
      } else {
        // Default to JSON parsing
        data = JSON.parse(bodyText);
      }
    } catch (parseErr) {
      console.error("Error parsing request body:", parseErr);
      json(400, { error: "Invalid request body" });
      return;
    }

    const { username } = data;
    if (!username) {
      json(400, { error: "username required" });
      return;
    }
    const roomTypers = typingStore.get(roomId) ?? new Map<string, number>();
    roomTypers.set(username, Date.now());
    typingStore.set(roomId, roomTypers);
    json(200, { ok: true });
  } catch (err: any) {
    console.error("Error updating typing status:", err);
    json(500, { error: "Failed to update typing status" });
  }
};
