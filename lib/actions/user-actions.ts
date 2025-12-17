"use server";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";

interface FormState {
  error?: string;
  redirect?: string;
}

export async function authenticateUser(
  initialState: FormState,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return {
      error: error.message,
    };
  }

  // Update this route to redirect to an authenticated route. The user already has an active session.
  return {
    redirect: "/dashboard",
  };
}

export async function createUser(initialState: FormState, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const repeatPassword = formData.get("repeat-password") as string;

  if (password !== repeatPassword) {
    return {
      error: "Passwords do not match",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });
  if (error)
    return {
      error: error.message,
    };

  return {
    redirect: "/register/success",
  };
}

export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}