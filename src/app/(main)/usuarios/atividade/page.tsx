import { redirect } from "next/navigation";
import { activityLabel } from "@/lib/audit/activity-actions";
import { formatActivitySummary } from "@/lib/audit/format-activity-summary";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ActivityLogHeader } from "./activity-log-header";
import { ActivitySearchPanel, type ActivityLogRow } from "./activity-search-panel";

export const dynamic = "force-dynamic";

export default async function UsuariosAtividadePage() {
  const session = await getSession();
  if (!session?.permissions.includes("users.manage")) {
    redirect("/");
  }

  const rows = await prisma.userActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      actor: {
        select: { id: true, displayName: true, email: true, loginName: true },
      },
    },
  });

  const logs: ActivityLogRow[] = rows.map((r) => {
    const actor = r.actor;
    const actorLabel = actor
      ? `${actor.displayName.trim()} (@${actor.loginName})`
      : "— (sistema ou anônimo)";
    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      action: r.action,
      actionLabel: activityLabel(r.action),
      summary: formatActivitySummary(r.action, r.detailsJson),
      actorLabel,
      actorId: r.actorUserId,
      detailsJson: r.detailsJson,
      ip: r.ip,
    };
  });

  return (
    <div className="mx-auto min-w-0 max-w-6xl px-3 sm:px-4">
      <ActivityLogHeader />
      <div className="mt-6">
        <ActivitySearchPanel logs={logs} />
      </div>
    </div>
  );
}
