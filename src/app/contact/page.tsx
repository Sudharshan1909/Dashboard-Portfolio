'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MailIcon, LinkedinIcon, GithubIcon } from '@/components/SimpleIcons';
import { FormEvent, useState, useEffect } from 'react';

interface ContactData {
  description: string;
  email: string;
  linkedinUrl: string;
  githubUrl: string;
}

const fallbackContactData: ContactData = {
  description: "Get in touch with me for collaboration opportunities, questions, or just to say hello. I'm always open to discussing new projects and ideas.",
  email: 'hello@example.com',
  linkedinUrl: '',
  githubUrl: '',
};

export default function ContactPage() {
  const [contactData, setContactData] = useState<ContactData>(fallbackContactData);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/contact');
        if (res.ok) {
          const json = (await res.json()) as Partial<ContactData>;
          setContactData({
            description: json.description || fallbackContactData.description,
            email: json.email || fallbackContactData.email,
            linkedinUrl: json.linkedinUrl || fallbackContactData.linkedinUrl,
            githubUrl: json.githubUrl || fallbackContactData.githubUrl,
          });
        }
      } catch {
        // fallback to static config
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError(null);

    try {
      const res = await fetch('/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to send message.');
      }

      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <div className="relative flex-grow flex flex-col">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_48px] -z-10"></div>
          </div>
          <Navbar />
          <section className="flex flex-1 items-center justify-center px-6 py-24">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading contact info...</p>
          </section>
          <Footer />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="relative flex-grow flex flex-col">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_48px] -z-10"></div>
        </div>

        <Navbar />

        <section className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="w-full max-w-7xl rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-xl shadow-neutral-200/40 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80 dark:shadow-neutral-950/30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left column */}
              <div className="px-4 py-6">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">Get in touch</p>
                <h2 className="mt-6 text-4xl font-extrabold text-neutral-900 dark:text-white">Let's work together</h2>
                <p className="mt-4 max-w-lg text-base leading-7 text-neutral-600 dark:text-neutral-300">
                  {contactData.description}
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                      <MailIcon />
                    </span>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{contactData.email}</span>
                  </div>

                  {contactData.linkedinUrl && (
                    <div className="flex items-center space-x-3">
                      <a
                        href={contactData.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:text-orange-500 transition-colors"
                      >
                        <LinkedinIcon />
                      </a>
                      <a
                        href={contactData.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-orange-500 transition-colors"
                      >
                        {contactData.linkedinUrl}
                      </a>
                    </div>
                  )}

                  {contactData.githubUrl && (
                    <div className="flex items-center space-x-3">
                      <a
                        href={contactData.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:text-orange-500 transition-colors"
                      >
                        <GithubIcon />
                      </a>
                      <a
                        href={contactData.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-orange-500 transition-colors"
                      >
                        {contactData.githubUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Right column - form */}
              <div className="px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm text-neutral-700 dark:text-neutral-200">Name *</span>
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-2 block w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none focus:ring-0 dark:border-neutral-700 dark:text-white"
                        placeholder="Jane Smith"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm text-neutral-700 dark:text-neutral-200">Email *</span>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-2 block w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none focus:ring-0 dark:border-neutral-700 dark:text-white"
                        placeholder="jane@company.com"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm text-neutral-700 dark:text-neutral-200">Subject</span>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-2 block w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none focus:ring-0 dark:border-neutral-700 dark:text-white"
                      placeholder="Project inquiry"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-neutral-700 dark:text-neutral-200">Message *</span>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      className="mt-2 block w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none focus:ring-0 dark:border-neutral-700 dark:text-white"
                      placeholder="Tell me about your project..."
                    />
                  </label>

                   <div className="mt-4">
                     <button
                       type="submit"
                       disabled={sending}
                       className="w-full rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-60 transition"
                     >
                       {sending ? 'Sending...' : sent ? 'Message sent ✓' : 'Send message →'}
                     </button>
                     {sendError && (
                       <p className="mt-2 text-sm text-red-500">{sendError}</p>
                     )}
                   </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
