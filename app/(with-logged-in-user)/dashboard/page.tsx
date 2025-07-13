"use client";

import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useEffect } from "react";

export default function Page() {
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;

      if (session) {
        // Send session to extension via content script
        window.postMessage({ session }, window.origin);
      }
    });
  }, []);

  return <p>Welcome back, user.</p>;
}
