"use server";
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
    redirect: "/protected",
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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/protected`,
    },
  });
  if (error)
    return {
      error: error.message,
    };

  return {
    redirect: "/auth/sign-up-success",
  };
}
