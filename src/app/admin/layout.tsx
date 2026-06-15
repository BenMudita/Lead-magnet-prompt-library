import { AdminNav } from "@/components/admin-nav";
import { MuditaHeader } from "@/components/mudita-header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <MuditaHeader />
      <section className="admin-head">
        <div>
          <p className="eyebrow">Internal tools</p>
          <h1>Mudita Library Admin</h1>
        </div>
        <AdminNav />
      </section>
      {children}
    </main>
  );
}

