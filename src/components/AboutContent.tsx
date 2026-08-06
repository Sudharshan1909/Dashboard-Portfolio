'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { aboutConfig } from '@/config/about';

interface ExperienceItem {
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  role: string;
  company: string;
  description: string;
}

interface CareerItem {
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  degree: string;
  course: string;
  college: string;
  cgpa: string;
}

interface AboutData {
  title: string;
  description: string;
  thumbnailImage: string;
  skills: string[];
  experience: { title: string; items: ExperienceItem[] };
  career: { title: string; items: CareerItem[] };
}

const formatPeriod = (startDate: string, endDate: string, isCurrent: boolean) => {
  const fmt = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
  const start = fmt(startDate);
  if (isCurrent) return `${start} - Present`;
  const end = fmt(endDate);
  return `${start} - ${end}`;
};

export default function AboutContent() {
  const [data, setData] = useState<AboutData>({
    title: aboutConfig.title,
    description: aboutConfig.description,
    thumbnailImage: aboutConfig.image,
    skills: aboutConfig.skills,
    experience: aboutConfig.experience,
    career: aboutConfig.career,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/about');
        if (res.ok) {
          const json = (await res.json()) as AboutData;
          setData({
            title: json.title || aboutConfig.title,
            description: json.description || aboutConfig.description,
            thumbnailImage: json.thumbnailImage || aboutConfig.image,
            skills: json.skills?.length ? json.skills : aboutConfig.skills,
            experience: json.experience?.items?.length
              ? json.experience
              : aboutConfig.experience,
            career: json.career?.items?.length
              ? json.career
              : aboutConfig.career,
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

  if (loading) {
    return (
      <section className="relative z-20 w-[896px] mx-auto mt-32 mb-12">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading about...</p>
      </section>
    );
  }

  return (
    <section className="relative z-20 w-[896px] mx-auto mt-32 mb-12">
      <div className="relative z-20 w-full mx-auto lg:mx-0">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl lg:text-4xl">
          {data.title}
        </h2>
        <div className="flex flex-col md:flex-row gap-8 mt-3 sm:mt-4 lg:mt-6">
          <div className="w-full md:w-1/2 flex flex-col">
            <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400 sm:leading-7 lg:leading-8 sm:text-base lg:text-lg">
              {data.description}
            </p>
            <div className="mt-auto pt-4 flex flex-wrap gap-2">
              {data.skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 text-sm bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full md:w-1/2 flex justify-end">
            <div className="relative w-[360px] h-[360px]">
              <Image
                src={data.thumbnailImage || '/assets/images/about/coder.jpg'}
                alt="Profile"
                fill
                sizes="(max-width: 768px) 100vw, 360px"
                className="object-cover rounded-xl"
                priority
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row mt-20 gap-8">
          <div className="flex-1">
            <h2 className="mb-2 text-2xl font-bold dark:text-neutral-200">
              {data.experience.title}
            </h2>
            <div className="py-10">
              {data.experience.items.map((item, index) => (
                <div key={index} className="pb-10 border-l border-gray-200 last:border-l-0 dark:border-neutral-700">
                  <div className="relative flex flex-col justify-start pl-12">
                    <div className="absolute top-0 left-0 z-40 flex items-center justify-center -translate-x-1/2 bg-white border rounded-full dark:bg-neutral-950 w-14 h-14 border-neutral-300 dark:border-neutral-700">
                      <svg className="w-8 h-8 text-neutral-700 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <p className="text-xs uppercase text-neutral-400 dark:text-neutral-500 trackign-widest">{formatPeriod(item.startDate, item.endDate, item.isCurrent)}</p>
                    <h3 className="my-1 text-lg font-bold dark:text-neutral-100">{item.role}</h3>
                    <p className="mb-1 text-sm font-medium dark:text-neutral-300">{item.company}</p>
                    <p className="text-sm font-light text-neutral-600 dark:text-neutral-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <h2 className="mb-2 text-2xl font-bold dark:text-neutral-200">
              {data.career.title}
            </h2>
            <div className="py-10">
              {data.career.items.map((item, index) => (
                <div key={index} className="pb-10 border-l border-gray-200 last:border-l-0 dark:border-neutral-700">
                  <div className="relative flex flex-col justify-start pl-12">
                    <div className="absolute top-0 left-0 z-40 flex items-center justify-center -translate-x-1/2 bg-white border rounded-full dark:bg-neutral-950 w-14 h-14 border-neutral-300 dark:border-neutral-700">
                      <svg className="w-8 h-8 text-neutral-700 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.42A12 12 0 0112 21a12 12 0 01-6.16-10.42L12 14z" />
                      </svg>
                    </div>
                    <p className="text-xs uppercase text-neutral-400 dark:text-neutral-500 trackign-widest">{formatPeriod(item.startDate, item.endDate, item.isCurrent)}</p>
                    <h3 className="my-1 text-lg font-bold dark:text-neutral-100">{item.degree}</h3>
                    {item.course && (
                      <p className="mb-1 text-sm font-medium dark:text-neutral-300">{item.course}</p>
                    )}
                    <p className="mb-1 text-sm font-medium dark:text-neutral-300">{item.college}</p>
                    <p className="text-sm font-light text-neutral-600 dark:text-neutral-400">{item.cgpa}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
