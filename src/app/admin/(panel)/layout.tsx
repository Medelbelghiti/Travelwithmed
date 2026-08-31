import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={{ email: user.email, name: user.name, role: user.role }} />
      <div className="min-w-0 flex-1 lg:ml-64">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}