import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function AdminIndex() {
  const user = await getSessionUser();
  redirect(user ? "/admin/dashboard" : "/admin/login");
}