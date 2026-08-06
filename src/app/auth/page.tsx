import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Suspense } from 'react';
import AuthClient from './AuthClient';

export default function AuthPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="relative flex-grow flex flex-col">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_48px] -z-10"></div>
        </div>

        <Navbar />

        <section className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-xl shadow-neutral-200/40 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80 dark:shadow-neutral-950/30">
            <Suspense fallback={<div className="py-12 text-center">Loading...</div>}>
              <AuthClient />
            </Suspense>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
