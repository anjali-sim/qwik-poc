/**
 * plugin@auth.ts — Global middleware for authentication
 */
import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = async ({
  cookie,
  redirect,
  url,
  next,
}) => {
  // Start timing
  const start = Date.now();
  console.log(`[Middleware] → ${url.pathname}`);

  // Check if route is protected
  const isProtected =
    url.pathname.startsWith("/chat") || url.pathname.startsWith("/analytics");

  if (isProtected) {
    const userCookie = cookie.get("chat_user");
    if (!userCookie?.value) {
      throw redirect(302, "/login");
    }
  }

  // Continue to next handler
  await next();

  // Log timing
  const elapsed = Date.now() - start;
  console.log(`[Middleware] ← ${url.pathname} (${elapsed}ms)`);
};
