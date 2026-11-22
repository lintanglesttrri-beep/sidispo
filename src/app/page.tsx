import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin");
  }
  redirect("/login");
}
