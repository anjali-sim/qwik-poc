/**
 * middleware.ts — Auth guard for all /chat/* routes
 * Qwik concept: Middleware
 * Redirects unauthenticated users to /login
 */
import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = ({ cookie, redirect, url }) => {
  // Only guard /chat routes
  if (url.pathname.startsWith("/chat")) {
    const userCookie = cookie.get("chat_user");
    if (!userCookie?.value) {
      throw redirect(302, "/login");
    }
  }
};
