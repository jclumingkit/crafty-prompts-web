"use server";

import { baseUrl } from "@/utils/constant";
import { createErrorLog } from "@/utils/supabase/api/post";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { headers as NextHeaders } from "next/headers";
import { redirect } from "next/navigation";

export type GenericAuthSignInResponse = {
  error: string | null;
  redirectUrl: string | null;
};

export async function login(formData: FormData) {
  const headers = await NextHeaders();
  const response: GenericAuthSignInResponse = {
    error: null,
    redirectUrl: null,
  };
  const supabase = await createSupabaseServerClient();

  try {
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) throw error;

    response.redirectUrl = "/dashboard";
    return response;
  } catch (error) {
    createErrorLog(supabase, {
      url_path: headers.get("x-pathname") ?? "/",
      function_name: "login",
      error_message: JSON.stringify(error),
    });
    response.error = "Failed to login";
  }

  return response;
}

export async function signup(formData: FormData) {
  const headers = await NextHeaders();
  const response: GenericAuthSignInResponse = {
    error: null,
    redirectUrl: null,
  };
  const supabase = await createSupabaseServerClient();

  try {
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signUp(data);

    if (error) throw error;

    response.redirectUrl = "/auth/signup-confirmation";
    return response;
  } catch (error) {
    createErrorLog(supabase, {
      url_path: headers.get("x-pathname") ?? "/",
      function_name: "signup",
      error_message: JSON.stringify(error),
    });
    response.error = "Failed to signup";
  }

  return response;
}

export async function signInWithGoogle() {
  const headers = await NextHeaders();
  const response: GenericAuthSignInResponse = {
    error: null,
    redirectUrl: null,
  };
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
      },
    });

    if (error) throw error;

    if (data.url) {
      response.redirectUrl = data.url;
    }
  } catch (error) {
    createErrorLog(supabase, {
      url_path: headers.get("x-pathname") ?? "/",
      function_name: "signInWithGoogle",
      error_message: JSON.stringify(error),
    });
    response.error = "Failed to sign in with google";
  }

  if (response.redirectUrl) {
    redirect(response.redirectUrl);
  }

  return response;
}
