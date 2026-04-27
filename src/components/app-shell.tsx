import { getEnabledModules } from "@/lib/modules";
import { Sidebar } from "@/components/sidebar";
import { getSession } from "@/lib/auth/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const modules = getEnabledModules();
  const session = await getSession();

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar
        modules={modules}
        sessionLabel={session?.displayName ?? session?.email ?? null}
        canManageUsers={session?.permissions.includes("users.manage") ?? false}
        canAccessSuppliers={session?.permissions.includes("suppliers.access") ?? false}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 bg-shell p-6">{children}</main>
      </div>
    </div>
  );
}
