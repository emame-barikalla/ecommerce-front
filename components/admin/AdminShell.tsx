import AdminNav from './AdminNav';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex min-h-screen">
      <AdminNav />
      <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
