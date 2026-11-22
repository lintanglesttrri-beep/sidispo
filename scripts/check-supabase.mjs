import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const sec = process.env.SUPABASE_SECRET_KEY || "";
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "surat";

console.log("1. ENV CHECK:", {
  hasUrl: url.startsWith("https://"),
  hasPublishable: pub.startsWith("sb_publishable_") || pub.length > 20,
  hasSecret: sec.length > 20 && !sec.includes("ISI_SECRET"),
  bucket,
});

if (!url || !sec || sec.includes("ISI_SECRET")) {
  console.log("STOP: SUPABASE_SECRET_KEY belum diisi dengan benar.");
  process.exit(0);
}

const admin = createClient(url, sec, { auth: { persistSession: false } });
const anon = createClient(url, pub, { auth: { persistSession: false } });

const [recAdmin, recAnon, bucketsRes, usersRes] = await Promise.all([
  admin.from("penerima").select("id", { count: "exact" }).limit(1),
  anon.from("penerima").select("id").limit(1),
  admin.storage.listBuckets(),
  admin.auth.admin.listUsers({ perPage: 10 }),
]);

console.log(
  "2. DB TABLES (Admin):",
  recAdmin.error
    ? "ERROR: " + recAdmin.error.message
    : "OK (penerima count = " + recAdmin.count + ")"
);
console.log(
  "3. RLS CHECK (Anon blocked?):",
  recAnon.error
    ? "OK BLOCKED (" + recAnon.error.code + ")"
    : "WARNING: anon returned count=" + recAnon.count
);
const suratBucket = bucketsRes.data?.find((b) => b.name === bucket);
console.log(
  "4. STORAGE BUCKET:",
  suratBucket
    ? "OK exists, public=" + suratBucket.public
    : "NOT FOUND (available: " +
        (bucketsRes.data?.map((b) => b.name).join(",") || "none") +
        ")"
);
console.log(
  "5. AUTH ADMIN USERS:",
  usersRes.error
    ? "ERROR: " + usersRes.error.message
    : "OK count=" + usersRes.data.users.length
);
