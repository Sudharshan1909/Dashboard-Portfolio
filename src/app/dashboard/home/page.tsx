import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { auth } from '@/auth';
import { isAuthorizedEmail } from '@/auth.config';
import WorkspaceShell from './WorkspaceShell';

export default async function DashboardHomePage() {
  // Sessions expire quickly (5s), so the dashboard always requires a fresh login.
  // No persistent session across visits.
  const session = await auth();

  if (!session?.user || !isAuthorizedEmail(session.user.email)) {
    redirect('/dashboard?callbackUrl=/dashboard/home');
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="relative flex-grow flex flex-col overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_48px] -z-10"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[1200px] w-[1200px] rounded-full bg-neutral-400 opacity-10 blur-[100px]"></div>
        </div>

        <Navbar />

        <section className="flex flex-1 items-center justify-center px-6 py-24">
          <WorkspaceShell
            user={{
              name: session.user.name ?? null,
              email: session.user.email ?? null,
              image: session.user.image ?? null,
            }}
          />
        </section>
      </div>
      <Footer />
    </main>
  );
}
