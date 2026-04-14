/**
 * /create — Redirect to /chat (room creation is now in /chat)
 */
import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = ({ redirect }) => {
  throw redirect(302, "/chat");
};
