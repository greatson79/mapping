import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/constants/env";
import type { Database } from "./types";

export const createSupabaseServerClient = async (): Promise<
  SupabaseClient<Database>
> => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Next.js 15에서는 Server Component에서 쿠키 설정이 불가능합니다.
          // Server Action이나 Route Handler에서만 가능하므로,
          // Server Component에서는 읽기 전용으로 동작합니다.
          // 쿠키 설정은 클라이언트 측이나 API Route에서 처리됩니다.
        },
      },
    }
  );
};
