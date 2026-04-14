/**
 * Root index — redirects to /chat if logged in, else /login
 */
import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = ({ cookie, redirect }) => {
  const userCookie = cookie.get("chat_user")?.value;
  if (userCookie) {
    throw redirect(302, "/chat");
  } else {
    throw redirect(302, "/login");
  }
};
