import { getVariables } from "@/utils/supabase/api/get";
import { createErrorLog } from "@/utils/supabase/api/post";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const variables = [];
    let continueFetch = true;

    while (continueFetch) {
      const currentBatch = await getVariables(supabase, {
        userId: user.id,
        limit: 20,
        search: "",
        cursor: undefined,
        direction: "next",
      });
      const { data, hasMore } = currentBatch;
      variables.push(...data);
      continueFetch = hasMore;
    }

    return NextResponse.json({ data: variables });
  } catch (error) {
    console.log(error);
    await createErrorLog(supabase, {
      url_path: "/api/extension/fetch-variables",
      function_name: "handler",
      error_message: JSON.stringify(error),
    });
    return NextResponse.json(
      { error: (error as TypeError).message },
      { status: 500 }
    );
  }
}
