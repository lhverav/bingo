"use server";

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { findUserByCredentials } from "@/lib/services/userService";
import { redirect } from "next/navigation";



export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await findUserByCredentials(email, password);

  if (!user) {
    redirect("/?error=invalid");
  }

  const session = await getSession();
  //session.userId = user.userId;
  session.userId = user._id.toString();
  session.name = user.name;
  session.role = user.role;
  session.isLoggedIn = true;
  await session.save();

  //TODO: Set session/coocie here
  redirect("/host");
}

export async function logOut() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
