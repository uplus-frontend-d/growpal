import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

if (typeof window !== "undefined") {
  const originalDebug = console.debug;
  const originalLog = console.log;

  const blockIfGoTrue = (args: any[]) =>
    typeof args[0] === "string" && args[0].includes("GoTrueClient");

  console.debug = (...args) => {
    if (blockIfGoTrue(args)) return;
    originalDebug(...args);
  };

  console.log = (...args) => {
    if (blockIfGoTrue(args)) return;
    originalLog(...args);
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    debug: process.env.NODE_ENV === "development",
  },
  global: {
    headers: {
      "X-Client-Info": "growpal-web",
    },
  },
});
