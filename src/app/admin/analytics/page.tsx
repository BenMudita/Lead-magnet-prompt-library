import { SessionForm } from "@/components/session-form";
import { isSupabaseAuthEnabled } from "@/lib/env";
import { getSession, isAdminRole } from "@/lib/session";
import { getAnalyticsSummary } from "@/lib/store";

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!isAdminRole(session.role)) {
    const supabaseAuth = isSupabaseAuthEnabled();
    return (
      <section className="auth-page">
        <div>
          <p className="eyebrow">Analyst required</p>
          <h2>
            {supabaseAuth
              ? "Sign in with an admin account to view analytics."
              : "Use the admin demo session to view analytics."}
          </h2>
        </div>
        <SessionForm
          mode="login"
          admin={!supabaseAuth}
          defaultEmail="admin@muditastudios.com"
          redirectTo="/admin/analytics"
        />
      </section>
    );
  }

  const summary = getAnalyticsSummary();

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Funnel and usage telemetry</p>
          <h2>Analytics dashboard</h2>
        </div>
      </div>
      <div className="analytics-grid">
        <div className="admin-panel">
          <span className="metric-number">{summary.publishedPrompts}</span>
          <span className="metric-label">published prompts</span>
        </div>
        <div className="admin-panel">
          <span className="metric-number">{summary.pendingUseNotes}</span>
          <span className="metric-label">pending notes</span>
        </div>
        <div className="admin-panel">
          <span className="metric-number">{Object.values(summary.eventsByName).reduce((sum, count) => sum + count, 0)}</span>
          <span className="metric-label">events captured</span>
        </div>
      </div>
      <div className="admin-grid-two">
        <div className="admin-panel">
          <h3>Top prompts by copy/send</h3>
          {summary.topPrompts.map(({ prompt, metric }) => (
            <p key={prompt.id}>
              {prompt.title}: {metric.copyCount + metric.sendChatgptCount + metric.sendClaudeCount}
            </p>
          ))}
        </div>
        <div className="admin-panel">
          <h3>Top categories</h3>
          {summary.topCategories.map(({ category, copies }) => (
            <p key={category.id}>
              {category.name}: {copies}
            </p>
          ))}
        </div>
      </div>
      <div className="admin-panel">
        <h3>Events by name</h3>
        <div className="event-grid">
          {Object.entries(summary.eventsByName).map(([name, count]) => (
            <span key={name}>
              {name}: {count}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
