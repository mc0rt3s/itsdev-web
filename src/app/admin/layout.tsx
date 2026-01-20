import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <AdminSidebar user={session.user} />
      <main className="flex-1 p-8 ml-64">
        {children}
      </main>
    </div>
  );
}
