import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Admin Login | Riversmag", robots: { index: false } };

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin/dashboard");
  return <LoginForm />;
}