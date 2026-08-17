import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardAuthPanel from './DashboardAuthPanel';
import { auth } from '@/auth';
import { isAuthorizedEmail } from '@/auth.config';

export default async function DashboardPage() {
  const session = await auth();

  if (isAuthorizedEmail(session?.user?.email)) {
    redirect('/dashboard/home');
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
          <div className="w-full max-w-5xl rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-xl shadow-neutral-200/40 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80 dark:shadow-neutral-950/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <aside className="rounded-2xl p-6 bg-neutral-50/60 dark:bg-neutral-900/60">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">Get in touch</p>
                <h3 className="mt-4 text-3xl font-extrabold text-neutral-900 dark:text-white">About this portfolio</h3>
                <p className="mt-4 text-base leading-7 text-neutral-600 dark:text-neutral-300">
                  This portfolio showcases projects, posts and design work. Use the dashboard to view analytics, manage content, and review submissions. It is a lightweight admin surface built with Next.js and Tailwind CSS.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">✉️</div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Contact</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">hello@portfolio.example</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">💼</div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Role</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Frontend Engineer & Designer</p>
                    </div>
                  </div>
                </div>
              </aside>

              <DashboardAuthPanel redirectTo="/dashboard/home" />
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
