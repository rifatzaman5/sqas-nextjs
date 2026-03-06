import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'teacher') redirect('/login');
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role="teacher" name={session.name} />
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 min-w-0">{children}</main>
    </div>
  );
}
