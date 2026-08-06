'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, ChangeEvent, FormEvent, useRef } from 'react';
import SignOutButton from '@/components/SignOutButton';

interface WorkspaceUser {
  name: string | null;
  email: string | null;
  image: string | null;
}

interface HomeContentData {
  greeting: string;
  description: string;
}

interface ProjectData {
  _id: string;
  title: string;
  description: string;
  href: string;
  imageUrl: string;
}

interface PostData {
  _id: string;
  title: string;
  description: string;
  date: string;
  image: string;
  slug: string;
  tags: string[];
  author: string;
  readTime: string;
  content: string;
  sections?: PostSectionData[];
}

interface PostSectionData {
  title: string;
  type: 'text' | 'ordered' | 'unordered' | 'description';
  content: string;
}

interface ContactData {
  description: string;
  email: string;
  linkedinUrl: string;
  githubUrl: string;
}

interface PostSection {
  id: string;
  title: string;
  type: 'text' | 'ordered' | 'unordered' | 'description';
  content: string;
}

const sidebarItems = [
  { key: 'home', title: 'Home' },
  { key: 'projects', title: 'Projects' },
  { key: 'posts', title: 'Posts' },
  { key: 'about', title: 'About' },
  { key: 'contact', title: 'Contact' },
] as const;

type SectionKey = (typeof sidebarItems)[number]['key'];

function toSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `posts/${slug}`;
}

function generateMarkdownFromSections(sections: PostSection[]): string {
  let md = '';
  for (const section of sections) {
    md += `## ${section.title}\n\n`;
    if (section.type === 'text') {
      md += `${section.content}\n\n`;
    } else if (section.type === 'ordered') {
      const items = section.content
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      md += items.map((item, i) => `${i + 1}. ${item}`).join('\n') + '\n\n';
    } else if (section.type === 'unordered') {
      const items = section.content
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      md += items.map((item) => `- ${item}`).join('\n') + '\n\n';
    } else if (section.type === 'description') {
      md += `${section.content}\n\n`;
    }
  }
  return md.trim();
}

function parseSectionsFromMarkdown(content: string): PostSection[] {
  const sections: PostSection[] = [];
  const parts = content.split(/^## /m).filter(Boolean);

  if (parts.length === 0) {
    return [
      {
        id: '1',
        title: '',
        type: 'text',
        content: content.trim(),
      },
    ];
  }

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const firstNewline = part.indexOf('\n');
    const title = firstNewline > -1 ? part.slice(0, firstNewline).trim() : part.trim();
    const body = firstNewline > -1 ? part.slice(firstNewline + 1).trim() : '';

    let type: PostSection['type'] = 'text';
    if (/^(\d+\.\s|-\s)/m.test(body)) {
      type = body.match(/^\d+\./m) ? 'ordered' : 'unordered';
    }

    sections.push({
      id: String(i + 1),
      title,
      type,
      content: body,
    });
  }

  return sections;
}

export default function WorkspaceShell({ user }: { user: WorkspaceUser }) {
  const [active, setActive] = useState<SectionKey>('home');
  const activeItem = sidebarItems.find((item) => item.key === active)!;
  const displayName = user.name || user.email || 'there';

  const [homeContent, setHomeContent] = useState<HomeContentData>({
    greeting: '',
    description: '',
  });
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeSaving, setHomeSaving] = useState(false);
  const [homeMessage, setHomeMessage] = useState<string | null>(null);

  const loadHomeContent = useCallback(async () => {
    setHomeLoading(true);
    try {
      const res = await fetch('/api/homepage');
      if (res.ok) {
        const data = (await res.json()) as HomeContentData;
        setHomeContent(data);
      }
    } catch {
      // ignore load failure; form stays editable with empty state
    } finally {
      setHomeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active === 'home') {
      loadHomeContent();
    }
  }, [active, loadHomeContent]);

  const handleHomeChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHomeContent((prev) => ({ ...prev, [name]: value }));
  };

  const handleHomeSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHomeSaving(true);
    setHomeMessage(null);

    try {
      const res = await fetch('/api/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(homeContent),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to save.');
      }

      const data = (await res.json()) as HomeContentData;
      setHomeContent(data);
      setHomeMessage('Saved successfully.');
    } catch (err) {
      setHomeMessage(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setHomeSaving(false);
    }
  };

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsMessage, setProjectsMessage] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState({
    _id: '',
    title: '',
    description: '',
    href: '',
    imageUrl: '',
  });
  const [projectSaving, setProjectSaving] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = (await res.json()) as ProjectData[];
        setProjects(data);
      }
    } catch {
      // ignore
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active === 'projects') {
      loadProjects();
    }
  }, [active, loadProjects]);

  useEffect(() => {
    if (active === 'about') {
      loadAboutContent();
    }
  }, [active]);

  const resetProjectForm = () => {
    setProjectForm({ _id: '', title: '', description: '', href: '', imageUrl: '' });
    setEditingProjectId(null);
    setShowProjectForm(false);
    if (projectFileInputRef.current) {
      projectFileInputRef.current.value = '';
    }
  };

  const handleProjectChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Upload failed.');
      }

      const data = (await res.json()) as { url: string };
      setProjectForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleProjectSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProjectSaving(true);
    setProjectsMessage(null);

    try {
      const isEdit = Boolean(editingProjectId);
      const url = isEdit ? `/api/projects/${editingProjectId}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to save project.');
      }

      const data = (await res.json()) as ProjectData;
      if (isEdit) {
        setProjects((prev) => prev.map((p) => (p._id === data._id ? data : p)));
      } else {
        setProjects((prev) => [data, ...prev]);
      }

      resetProjectForm();
      setProjectsMessage(isEdit ? 'Project updated.' : 'Project added.');
    } catch (err) {
      setProjectsMessage(err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setProjectSaving(false);
    }
  };

  const handleEditProject = (project: ProjectData) => {
    setEditingProjectId(project._id);
    setProjectForm({
      _id: project._id,
      title: project.title,
      description: project.description,
      href: project.href,
      imageUrl: project.imageUrl,
    });
    setShowProjectForm(true);
    setProjectsMessage(null);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) {
      return;
    }

    setProjectsMessage(null);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to delete project.');
      }

      setProjects((prev) => prev.filter((p) => p._id !== id));
      if (editingProjectId === id) {
        resetProjectForm();
      }
      setProjectsMessage('Project deleted.');
    } catch (err) {
      setProjectsMessage(err instanceof Error ? err.message : 'Failed to delete project.');
    }
  };

  const renderProjectForm = () => (
    <form onSubmit={handleProjectSubmit} className="space-y-3">
      <div>
        <label htmlFor="project-title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Title
        </label>
        <input
          id="project-title"
          name="title"
          type="text"
          value={projectForm.title}
          onChange={handleProjectChange}
          disabled={projectSaving || uploading}
          required
          maxLength={120}
          className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="project-description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Description
        </label>
        <textarea
          id="project-description"
          name="description"
          rows={3}
          value={projectForm.description}
          onChange={handleProjectChange}
          disabled={projectSaving || uploading}
          required
          maxLength={800}
          className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="project-href" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Link
        </label>
        <input
          id="project-href"
          name="href"
          type="text"
          value={projectForm.href}
          onChange={handleProjectChange}
          disabled={projectSaving || uploading}
          maxLength={500}
          className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="project-image" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Thumbnail
        </label>
        <input
          id="project-image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handleProjectFileUpload}
          disabled={projectSaving || uploading}
          ref={projectFileInputRef}
          className="mt-1 block w-full text-sm text-neutral-900 dark:text-white file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-800 dark:file:bg-white dark:file:text-neutral-900"
        />
        {projectForm.imageUrl && (
          <div className="mt-2">
            <Image
              src={projectForm.imageUrl}
              alt="Preview"
              width={200}
              height={120}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={projectSaving || uploading}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          {projectSaving ? 'Saving...' : editingProjectId ? 'Update' : 'Add'}
        </button>

        {editingProjectId && (
          <button
            type="button"
            onClick={resetProjectForm}
            disabled={projectSaving || uploading}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  const renderProjectsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
            Public Projects
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Manage projects shown on the public projects page.
          </p>
        </div>
        {!showProjectForm && (
          <button
            type="button"
            onClick={() => {
              resetProjectForm();
              setShowProjectForm(true);
            }}
            className="rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            + Add
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project._id}
            className="rounded-xl border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-700">
              <Image
                src={project.imageUrl}
                alt={project.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-2 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {project.title}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                  {project.description}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => handleEditProject(project)}
                  className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProject(project._id)}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && !projectsLoading && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No projects yet.</p>
        )}
      </div>

      {showProjectForm && (
        <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
          {renderProjectForm()}
        </div>
      )}

      {projectsMessage && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{projectsMessage}</p>
      )}
    </div>
  );

  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsMessage, setPostsMessage] = useState<string | null>(null);

  const [postForm, setPostForm] = useState({
    _id: '',
    title: '',
    description: '',
    date: '',
    image: '',
    slug: '',
    tags: '',
    author: '',
    readTime: '',
    content: '',
  });
  const [postSaving, setPostSaving] = useState(false);
  const [editingPostSlug, setEditingPostSlug] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postUploading, setPostUploading] = useState(false);
  const [sections, setSections] = useState<PostSection[]>([]);

  interface SkillItem {
    id: string;
    value: string;
  }

   interface ExperienceItem {
    id: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    role: string;
    company: string;
    description: string;
  }

   interface CareerItem {
    id: string;
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
    experience: { title: string; items: { startDate: string; endDate: string; isCurrent: boolean; role: string; company: string; description: string }[] };
    career: { title: string; items: { startDate: string; endDate: string; isCurrent: boolean; degree: string; course: string; college: string; cgpa: string }[] };
  }

   const degreeOptions = [
     { value: 'B.Tech', label: 'B.Tech' },
     { value: 'M.Tech', label: 'M.Tech' },
     { value: 'B.E', label: 'B.E' },
     { value: 'M.E', label: 'M.E' },
     { value: 'B.Sc', label: 'B.Sc' },
     { value: 'M.Sc', label: 'M.Sc' },
     { value: 'MCA', label: 'MCA' },
     { value: 'MBA', label: 'MBA' },
     { value: 'B.Com', label: 'B.Com' },
     { value: 'M.Com', label: 'M.Com' },
     { value: 'B.A', label: 'B.A' },
     { value: 'M.A', label: 'M.A' },
     { value: 'Ph.D', label: 'Ph.D' },
     { value: 'Diploma', label: 'Diploma' },
     { value: 'Other', label: 'Other' },
   ];

   const courseOptionsByDegree: Record<string, string[]> = {
     'B.Tech': ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Other'],
     'M.Tech': ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Other'],
     'B.E': ['Computer Science', 'Electronics & Communication', 'Mechanical', 'Civil', 'Electrical', 'Other'],
     'M.E': ['Computer Science', 'Electronics & Communication', 'Mechanical', 'Civil', 'Electrical', 'Other'],
     'B.Sc': ['Physics', 'Chemistry', 'Mathematics', 'Statistics', 'Computer Science', 'Botany', 'Zoology', 'Other'],
     'M.Sc': ['Physics', 'Chemistry', 'Mathematics', 'Statistics', 'Computer Science', 'Botany', 'Zoology', 'Other'],
     'MCA': ['Master of Computer Applications'],
     'MBA': ['Master of Business Administration'],
     'B.Com': ['Commerce', 'Accounting', 'Finance', 'Other'],
     'M.Com': ['Commerce', 'Accounting', 'Finance', 'Other'],
     'B.A': ['English', 'History', 'Psychology', 'Sociology', 'Political Science', 'Economics', 'Other'],
     'M.A': ['English', 'History', 'Psychology', 'Sociology', 'Political Science', 'Economics', 'Other'],
     'Ph.D': ['Research'],
     'Diploma': ['Computer Applications', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Other'],
   };

   const collegeOptions = [
     'Massachusetts Institute of Technology',
     'Stanford University',
     'Carnegie Mellon University',
     'University of California, Berkeley',
     'University of Michigan',
     'Caltech',
     'Princeton University',
     'Harvard University',
     'Indian Institute of Technology Bombay',
     'Indian Institute of Technology Delhi',
     'Indian Institute of Technology Madras',
     'Indian Institute of Technology Kanpur',
     'Indian Institute of Technology Kharagpur',
     'Indian Institute of Technology Roorkee',
    'Indian Institute of Technology Guwahati',
    'Others',
  ];

   const [aboutData, setAboutData] = useState<AboutData>({
     title: 'About Me',
     description: '',
     thumbnailImage: '',
     skills: [],
     experience: { title: 'Experience', items: [] },
     career: { title: 'Career', items: [] },
   });
   const [aboutLoading, setAboutLoading] = useState(false);
   const [aboutSaving, setAboutSaving] = useState(false);
   const [aboutMessage, setAboutMessage] = useState<string | null>(null);
   const [skillInputs, setSkillInputs] = useState<SkillItem[]>([{ id: 'new', value: '' }]);
   const [expInputs, setExpInputs] = useState<ExperienceItem[]>([
     { id: 'new', startDate: '', endDate: '', isCurrent: false, role: '', company: '', description: '' },
   ]);
   const [careerInputs, setCareerInputs] = useState<CareerItem[]>([
     { id: 'new', startDate: '', endDate: '', isCurrent: false, degree: '', course: '', college: '', cgpa: '' },
   ]);
    const [aboutUploading, setAboutUploading] = useState(false);

  const [contactData, setContactData] = useState<ContactData>({
    description: '',
    email: '',
    linkedinUrl: '',
    githubUrl: '',
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = (await res.json()) as PostData[];
        setPosts(data);
      }
    } catch {
      // ignore
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const loadAboutContent = useCallback(async () => {
    setAboutLoading(true);
    try {
      const res = await fetch('/api/about');
      if (res.ok) {
        const data = await res.json() as AboutData;
        setAboutData(data);
        setSkillInputs(data.skills?.length ? data.skills.map((s, i) => ({ id: i.toString(), value: s })) : [{ id: 'new', value: '' }]);
        setExpInputs(
          data.experience?.items?.length
            ? data.experience.items.map((e, i) => ({ id: i.toString(), ...e }))
            : [{ id: 'new', startDate: '', endDate: '', isCurrent: false, role: '', company: '', description: '' }]
        );
        setCareerInputs(
          data.career?.items?.length
            ? data.career.items.map((c, i) => ({ id: i.toString(), ...c }))
            : [{ id: 'new', startDate: '', endDate: '', isCurrent: false, degree: '', course: '', college: '', cgpa: '' }]
        );
      }
    } catch {
      // ignore
    } finally {
      setAboutLoading(false);
    }
  }, []);

  const loadContactContent = useCallback(async () => {
    setContactLoading(true);
    try {
      const res = await fetch('/api/contact');
      if (res.ok) {
        const data = await res.json() as ContactData;
        setContactData(data);
      }
    } catch {
      // ignore
    } finally {
      setContactLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active === 'posts') {
      loadPosts();
    }
  }, [active, loadPosts]);

  useEffect(() => {
    if (active === 'contact') {
      loadContactContent();
    }
  }, [active, loadContactContent]);

  useEffect(() => {
    if (active === 'posts') {
      loadPosts();
    }
  }, [active, loadPosts]);

  const resetPostForm = () => {
    setPostForm({ _id: '', title: '', description: '', date: '', image: '', slug: '', tags: '', author: '', readTime: '', content: '' });
    setEditingPostSlug(null);
    setShowPostForm(false);
    setSections([]);
    if (postFileInputRef.current) {
      postFileInputRef.current.value = '';
    }
  };

  const handlePostChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPostForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'title' && !editingPostSlug) {
        next.slug = toSlug(value);
      }
      return next;
    });
  };

  const handlePostFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPostUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Upload failed.');
      }

      const data = (await res.json()) as { url: string };
      setPostForm((prev) => ({ ...prev, image: data.url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setPostUploading(false);
    }
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        title: '',
        type: 'text',
        content: '',
      },
    ]);
  };

  const updateSection = (id: string, updates: Partial<PostSection>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handlePostSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPostSaving(true);
    setPostsMessage(null);

    try {
      const isEdit = Boolean(editingPostSlug);
      const url = isEdit ? `/api/posts/${editingPostSlug}` : '/api/posts';
      const method = isEdit ? 'PUT' : 'POST';

      const validSections = sections.filter((s) => s.title.trim() || s.content.trim());
      const generatedContent = generateMarkdownFromSections(validSections);

      const payload = {
        ...postForm,
        content: generatedContent,
        tags: postForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        sections: validSections
          .filter((s) => s.title.trim() || s.content.trim())
          .map(({ id, ...rest }) => rest),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to save post.');
      }

      const data = (await res.json()) as PostData;
      if (isEdit) {
        setPosts((prev) => prev.map((p) => (p.slug === data.slug ? data : p)));
      } else {
        setPosts((prev) => [data, ...prev]);
      }

      resetPostForm();
      setPostsMessage(isEdit ? 'Post updated.' : 'Post added.');
    } catch (err) {
      setPostsMessage(err instanceof Error ? err.message : 'Failed to save post.');
    } finally {
      setPostSaving(false);
    }
  };

  const handleEditPost = (post: PostData) => {
    setEditingPostSlug(post.slug);
    setPostForm({
      _id: post._id,
      title: post.title,
      description: post.description,
      date: post.date,
      image: post.image,
      slug: post.slug,
      tags: post.tags.join(', '),
      author: post.author,
      readTime: post.readTime,
      content: post.content,
    });
    if (post.sections && post.sections.length > 0) {
      setSections(
        post.sections.map((s, i) => ({
          id: String(i + 1),
          title: s.title,
          type: s.type as PostSection['type'],
          content: s.content,
        }))
      );
    } else {
      setSections(parseSectionsFromMarkdown(post.content));
    }
    setShowPostForm(true);
    setPostsMessage(null);
  };

  const handleDeletePost = async (slug: string) => {
    if (!confirm('Delete this post?')) {
      return;
    }

    setPostsMessage(null);
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to delete post.');
      }

      setPosts((prev) => prev.filter((p) => p.slug !== slug));
      if (editingPostSlug === slug) {
        resetPostForm();
      }
      setPostsMessage('Post deleted.');
    } catch (err) {
      setPostsMessage(err instanceof Error ? err.message : 'Failed to delete post.');
    }
  };

  const handleAboutChange = (field: keyof AboutData, value: unknown) => {
    setAboutData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSkillChange = (id: string, value: string) => {
    setSkillInputs((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
  };

  const addSkillInput = () => {
    setSkillInputs((prev) => [...prev, { id: `${Date.now()}`, value: '' }]);
  };

  const removeSkillInput = (id: string) => {
    if (skillInputs.length === 1) return;
    setSkillInputs((prev) => prev.filter((s) => s.id !== id));
  };

  const handleExpChange = (id: string, field: string, value: string | boolean) => {
    setExpInputs((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const addExpInput = () => {
    setExpInputs((prev) => [...prev, { id: `${Date.now()}`, startDate: '', endDate: '', isCurrent: false, role: '', company: '', description: '' }]);
  };

  const removeExpInput = (id: string) => {
    if (expInputs.length === 1) return;
    setExpInputs((prev) => prev.filter((e) => e.id !== id));
  };

  const handleCareerChange = (id: string, field: string, value: string | boolean) => {
    setCareerInputs((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const addCareerInput = () => {
    setCareerInputs((prev) => [...prev, { id: `${Date.now()}`, startDate: '', endDate: '', isCurrent: false, degree: '', course: '', college: '', cgpa: '' }]);
  };

  const removeCareerInput = (id: string) => {
    if (careerInputs.length === 1) return;
    setCareerInputs((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAboutUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAboutUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Upload failed.');
      }
      const data = await res.json() as { url: string };
      handleAboutChange('thumbnailImage', data.url);
    } catch (err) {
      setAboutMessage(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setAboutUploading(false);
    }
  };

  const handleAboutSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAboutSaving(true);
    setAboutMessage(null);

    const skills = skillInputs
      .map((s) => s.value.trim())
      .filter(Boolean);
    const experience = {
      title: aboutData.experience.title,
      items: expInputs
        .filter((e) => e.startDate.trim() || e.endDate.trim() || e.role.trim() || e.company.trim() || e.description.trim())
        .map(({ id, ...rest }) => rest),
    };
    const career = {
      title: aboutData.career.title,
      items: careerInputs
        .filter((c) => c.startDate.trim() || c.endDate.trim() || c.degree.trim() || c.course.trim() || c.college.trim() || c.cgpa.trim())
        .map(({ id, ...rest }) => rest),
    };

    try {
      const res = await fetch('/api/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...aboutData,
          skills,
          experience,
          career,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to save.');
      }

      const data = (await res.json()) as AboutData;
      setAboutData(data);
      setAboutMessage('About content saved.');
    } catch (err) {
      setAboutMessage(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setAboutSaving(false);
    }
  };

  const handleContactChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setContactSaving(true);
    setContactMessage(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to save.');
      }

      const data = (await res.json()) as ContactData;
      setContactData(data);
      setContactMessage('Contact content saved.');
    } catch (err) {
      setContactMessage(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setContactSaving(false);
    }
  };

  const renderPostForm = () => (
    <form onSubmit={handlePostSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="post-title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Title
          </label>
          <input
            id="post-title"
            name="title"
            type="text"
            value={postForm.title}
            onChange={handlePostChange}
            disabled={postSaving || postUploading}
            required
            maxLength={200}
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="post-slug" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Slug
          </label>
          <input
            id="post-slug"
            name="slug"
            type="text"
            value={postForm.slug}
            onChange={handlePostChange}
            disabled={!!editingPostSlug || postSaving || postUploading}
            required
            maxLength={200}
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <label htmlFor="post-description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Description
        </label>
        <textarea
          id="post-description"
          name="description"
          rows={2}
          value={postForm.description}
          onChange={handlePostChange}
          disabled={postSaving || postUploading}
          required
          maxLength={1000}
          className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="post-date" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Posted on
          </label>
          <input
            id="post-date"
            name="date"
            type="date"
            value={postForm.date}
            onChange={handlePostChange}
            disabled={postSaving || postUploading}
            required
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="post-readTime" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Time to read
          </label>
          <input
            id="post-readTime"
            name="readTime"
            type="text"
            value={postForm.readTime}
            onChange={handlePostChange}
            disabled={postSaving || postUploading}
            required
            maxLength={20}
            placeholder="5 min read"
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="post-author" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Author
          </label>
          <input
            id="post-author"
            name="author"
            type="text"
            value={postForm.author}
            onChange={handlePostChange}
            disabled={postSaving || postUploading}
            required
            maxLength={100}
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="post-tags" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Tags
          </label>
          <input
            id="post-tags"
            name="tags"
            type="text"
            value={postForm.tags}
            onChange={handlePostChange}
            disabled={postSaving || postUploading}
            placeholder="react, nextjs, tutorial"
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <label htmlFor="post-image" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Thumbnail
        </label>
        <input
          id="post-image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handlePostFileUpload}
          disabled={postSaving || postUploading}
          ref={postFileInputRef}
          className="mt-1 block w-full text-sm text-neutral-900 dark:text-white file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-800 dark:file:bg-white dark:file:text-neutral-900"
        />
        {postForm.image && (
          <div className="mt-2">
            <Image
              src={postForm.image}
              alt="Preview"
              width={200}
              height={120}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700"
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Content Sections
          </label>
          <button
            type="button"
            onClick={addSection}
            disabled={postSaving || postUploading}
            className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            + Add Section
          </button>
        </div>

        <div className="space-y-3">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Section {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  disabled={postSaving || postUploading}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  disabled={postSaving || postUploading}
                  placeholder="Section title"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                />

                <select
                  value={section.type}
                  onChange={(e) => updateSection(section.id, { type: e.target.value as PostSection['type'] })}
                  disabled={postSaving || postUploading}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white disabled:opacity-60"
                >
                  <option value="text">Text Box</option>
                  <option value="ordered">Ordered List</option>
                  <option value="unordered">Unordered List</option>
                  <option value="description">Description</option>
                </select>

                {section.type === 'text' ? (
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(section.id, { content: e.target.value })}
                    disabled={postSaving || postUploading}
                    rows={4}
                    placeholder="Write your content here..."
                    className="w-full rounded-lg border border-neutral-300 bg-neutral-900 px-3 py-2 text-sm text-green-400 font-mono placeholder:text-neutral-500 dark:bg-black dark:text-green-400 dark:placeholder:text-neutral-600 disabled:opacity-60"
                  />
                ) : section.type === 'description' ? (
                  <input
                    type="text"
                    value={section.content}
                    onChange={(e) => updateSection(section.id, { content: e.target.value })}
                    disabled={postSaving || postUploading}
                    placeholder="Enter description..."
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                  />
                ) : (
                  <div className="space-y-2">
                    {section.content
                      .split('\n')
                      .map((line) => line.trim())
                      .filter((line, idx, arr) => line !== '' || idx < arr.length - 1)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 w-5 text-right">
                            {section.type === 'ordered' ? `${idx + 1}.` : '-'}
                          </span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const lines = section.content.split('\n');
                              lines[idx] = e.target.value;
                              updateSection(section.id, { content: lines.join('\n') });
                            }}
                            disabled={postSaving || postUploading}
                            className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const lines = section.content.split('\n').filter((_, i) => i !== idx);
                              updateSection(section.id, { content: lines.join('\n') });
                            }}
                            disabled={postSaving || postUploading}
                            className="rounded-lg border border-red-200 px-1.5 py-0.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                          >
                            x
                          </button>
                        </div>
                      ))}

                    <button
                      type="button"
                      onClick={() => {
                        const lines = section.content ? section.content.split('\n') : [];
                        updateSection(section.id, { content: [...lines, ''].join('\n') });
                      }}
                      disabled={postSaving || postUploading}
                      className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                      + Item
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {sections.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No sections yet. Click "+ Add Section" to create content.</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={postSaving || postUploading}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          {postSaving ? 'Saving...' : editingPostSlug ? 'Update' : 'Add'}
        </button>

        {editingPostSlug && (
          <button
            type="button"
            onClick={resetPostForm}
            disabled={postSaving || postUploading}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  const renderPostsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
            Public Posts
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Manage posts shown on the public posts page.
          </p>
        </div>
        {!showPostForm && (
          <button
            type="button"
            onClick={() => {
              resetPostForm();
              setShowPostForm(true);
            }}
            className="rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            + Add
          </button>
        )}
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post._id}
            className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {post.title}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                  <span>•</span>
                  <span>{post.author}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => handleEditPost(post)}
                  className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePost(post.slug)}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {posts.length === 0 && !postsLoading && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No posts yet.</p>
        )}
      </div>

      {showPostForm && (
        <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
          {renderPostForm()}
        </div>
      )}

      {postsMessage && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{postsMessage}</p>
      )}
    </div>
  );

  const renderHomeSection = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
        Public Homepage Content
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Update the name and description shown on the public homepage.
      </p>

      <form onSubmit={handleHomeSave} className="space-y-4">
        <div>
          <label htmlFor="greeting" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Name / Greeting
          </label>
          <input
            id="greeting"
            name="greeting"
            type="text"
            value={homeContent.greeting}
            onChange={handleHomeChange}
            disabled={homeLoading || homeSaving}
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={homeContent.description}
            onChange={handleHomeChange}
            disabled={homeLoading || homeSaving}
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={homeLoading || homeSaving}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          {homeSaving ? 'Saving...' : 'Save changes'}
        </button>

        {homeMessage && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{homeMessage}</p>
        )}
      </form>
    </div>
  );

  const renderAboutSection = () => (
    <form onSubmit={handleAboutSave} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">About Content</h2>
        {aboutMessage && (
          <p className={`mt-2 text-sm ${aboutMessage.includes('Failed') || aboutMessage.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
            {aboutMessage}
          </p>
        )}
      </div>

      {aboutLoading ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading about content...</p>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={aboutData.title}
                onChange={(e) => handleAboutChange('title', e.target.value)}
                disabled={aboutSaving || aboutUploading}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Description
              </label>
              <textarea
                value={aboutData.description}
                onChange={(e) => handleAboutChange('description', e.target.value)}
                disabled={aboutSaving || aboutUploading}
                rows={5}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Thumbnail Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAboutUpload}
                disabled={aboutSaving || aboutUploading}
                className="w-full text-sm text-neutral-600 dark:text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 disabled:opacity-60"
              />
              {aboutUploading && <p className="text-xs text-neutral-500 mt-1">Uploading...</p>}
              {aboutData.thumbnailImage && (
                <p className="text-xs text-neutral-500 mt-1 truncate">Current: {aboutData.thumbnailImage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Skills
              </label>
              <div className="space-y-2">
                {skillInputs.map((skill, idx) => (
                  <div key={skill.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={skill.value}
                      onChange={(e) => handleSkillChange(skill.id, e.target.value)}
                      disabled={aboutSaving || aboutUploading}
                      placeholder={`Skill ${idx + 1}`}
                      className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={addSkillInput}
                      disabled={aboutSaving || aboutUploading}
                      className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 disabled:opacity-60"
                    >
                      +
                    </button>
                    {skillInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSkillInput(skill.id)}
                        disabled={aboutSaving || aboutUploading}
                        className="px-3 py-1 text-sm text-red-500 disabled:opacity-60"
                      >
                        -
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Experience
              </label>
              <div className="space-y-4">
                {expInputs.map((exp, idx) => (
                  <div key={exp.id} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Experience {idx + 1}
                      </span>
                      {expInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExpInput(exp.id)}
                          disabled={aboutSaving || aboutUploading}
                          className="px-2 py-0.5 text-xs text-red-500 disabled:opacity-60"
                        >
                          -
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) => handleExpChange(exp.id, 'startDate', e.target.value)}
                          disabled={aboutSaving || aboutUploading}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={exp.endDate}
                            onChange={(e) => handleExpChange(exp.id, 'endDate', e.target.value)}
                            disabled={aboutSaving || aboutUploading || exp.isCurrent}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                          />
                        </div>
                        <label className="flex items-center gap-1 text-xs text-neutral-700 dark:text-neutral-300">
                          <input
                            type="checkbox"
                            checked={exp.isCurrent}
                            onChange={(e) => handleExpChange(exp.id, 'isCurrent', e.target.checked)}
                            disabled={aboutSaving || aboutUploading}
                            className="rounded border-neutral-300 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
                          />
                          Present
                        </label>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => handleExpChange(exp.id, 'role', e.target.value)}
                      disabled={aboutSaving || aboutUploading}
                      placeholder="Role"
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                    />
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => handleExpChange(exp.id, 'company', e.target.value)}
                      disabled={aboutSaving || aboutUploading}
                      placeholder="Company"
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                    />
                    <textarea
                      value={exp.description}
                      onChange={(e) => handleExpChange(exp.id, 'description', e.target.value)}
                      disabled={aboutSaving || aboutUploading}
                      placeholder="Description"
                      rows={3}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExpInput}
                  disabled={aboutSaving || aboutUploading}
                  className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 disabled:opacity-60"
                >
                  + Add Experience
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Career
              </label>
              <div className="space-y-4">
                {careerInputs.map((career, idx) => (
                  <div key={career.id} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Career {idx + 1}
                      </span>
                      {careerInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCareerInput(career.id)}
                          disabled={aboutSaving || aboutUploading}
                          className="px-2 py-0.5 text-xs text-red-500 disabled:opacity-60"
                        >
                          -
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={career.startDate}
                          onChange={(e) => handleCareerChange(career.id, 'startDate', e.target.value)}
                          disabled={aboutSaving || aboutUploading}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={career.endDate}
                            onChange={(e) => handleCareerChange(career.id, 'endDate', e.target.value)}
                            disabled={aboutSaving || aboutUploading || career.isCurrent}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                          />
                        </div>
                        <label className="flex items-center gap-1 text-xs text-neutral-700 dark:text-neutral-300">
                          <input
                            type="checkbox"
                            checked={career.isCurrent}
                            onChange={(e) => handleCareerChange(career.id, 'isCurrent', e.target.checked)}
                            disabled={aboutSaving || aboutUploading}
                            className="rounded border-neutral-300 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
                          />
                          Present
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Degree
                      </label>
                      <select
                        value={degreeOptions.some((o) => o.value === career.degree) ? career.degree : 'Other'}
                        onChange={(e) => {
                          if (e.target.value === 'Other') {
                            handleCareerChange(career.id, 'degree', '');
                          } else {
                            handleCareerChange(career.id, 'degree', e.target.value);
                            handleCareerChange(career.id, 'course', '');
                          }
                        }}
                        disabled={aboutSaving || aboutUploading}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                      >
                        {degreeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {!degreeOptions.some((o) => o.value === career.degree) && (
                        <input
                          type="text"
                          value={career.degree}
                          onChange={(e) => handleCareerChange(career.id, 'degree', e.target.value)}
                          disabled={aboutSaving || aboutUploading}
                          placeholder="Enter degree"
                          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Course
                      </label>
                      <select
                        value={career.course}
                        onChange={(e) => handleCareerChange(career.id, 'course', e.target.value)}
                        disabled={aboutSaving || aboutUploading || !career.degree}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                      >
                        <option value="">Select Course</option>
                        {(courseOptionsByDegree[career.degree] || []).map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        College
                      </label>
                      <select
                        value={collegeOptions.includes(career.college) && career.college !== '' ? career.college : 'Others'}
                        onChange={(e) => {
                          if (e.target.value === 'Others') {
                            handleCareerChange(career.id, 'college', '');
                          } else {
                            handleCareerChange(career.id, 'college', e.target.value);
                          }
                        }}
                        disabled={aboutSaving || aboutUploading}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                      >
                        {collegeOptions.filter((c) => c !== 'Others').map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="Others">Others</option>
                      </select>
                      {(!collegeOptions.includes(career.college) || career.college === '') && (
                        <input
                          type="text"
                          value={career.college}
                          onChange={(e) => handleCareerChange(career.id, 'college', e.target.value)}
                          disabled={aboutSaving || aboutUploading}
                          placeholder="Enter college name"
                          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                        />
                      )}
                    </div>

                    <input
                      type="text"
                      value={career.cgpa}
                      onChange={(e) => handleCareerChange(career.id, 'cgpa', e.target.value)}
                      disabled={aboutSaving || aboutUploading}
                      placeholder="CGPA"
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCareerInput}
                  disabled={aboutSaving || aboutUploading}
                  className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 disabled:opacity-60"
                >
                  + Add Career
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={aboutSaving || aboutUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-60"
            >
              {aboutSaving ? 'Saving...' : 'Save About'}
            </button>
          </div>
        </>
      )}
    </form>
  );

  const renderContactSection = () => (
    <form onSubmit={handleContactSave} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Contact Content</h2>
        {contactMessage && (
          <p className={`mt-2 text-sm ${contactMessage.includes('Failed') || contactMessage.includes('error') || contactMessage.includes('fail') ? 'text-red-600' : 'text-green-600'}`}>
            {contactMessage}
          </p>
        )}
      </div>

      {contactLoading ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading contact content...</p>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <label htmlFor="contact-description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Description
              </label>
              <textarea
                id="contact-description"
                name="description"
                value={contactData.description}
                onChange={handleContactChange}
                disabled={contactSaving}
                rows={4}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={contactData.email}
                onChange={handleContactChange}
                disabled={contactSaving}
                placeholder="hello@example.com"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="contact-linkedin" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                LinkedIn URL
              </label>
              <input
                id="contact-linkedin"
                name="linkedinUrl"
                type="url"
                value={contactData.linkedinUrl}
                onChange={handleContactChange}
                disabled={contactSaving}
                placeholder="https://linkedin.com/in/your-profile"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="contact-github" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                GitHub URL
              </label>
              <input
                id="contact-github"
                name="githubUrl"
                type="url"
                value={contactData.githubUrl}
                onChange={handleContactChange}
                disabled={contactSaving}
                placeholder="https://github.com/your-username"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={contactSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-60"
            >
              {contactSaving ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </>
      )}
    </form>
  );

  const renderPlaceholder = () => (
    <>
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">{activeItem.title}</h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        This section is empty for now.
      </p>
    </>
  );

  const renderSection = () => {
    if (active === 'home') return renderHomeSection();
    if (active === 'projects') return renderProjectsSection();
    if (active === 'posts') return renderPostsSection();
    if (active === 'about') return renderAboutSection();
    if (active === 'contact') return renderContactSection();
    return renderPlaceholder();
  };

  return (
    <div className="w-full max-w-6xl rounded-3xl border border-neutral-200 bg-white/80 p-4 shadow-xl shadow-neutral-200/40 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80 dark:shadow-neutral-950/30 sm:p-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold uppercase text-white dark:bg-white dark:text-neutral-900">
              {displayName.charAt(0)}
            </span>
          )}

          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              Welcome back, {displayName}
            </p>
            {user.email && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
            )}
          </div>
        </div>

        <SignOutButton className="self-start sm:self-auto" />
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="w-full shrink-0 rounded-2xl bg-neutral-50/60 p-4 dark:bg-neutral-900/60 md:w-60">
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
            Menu
          </p>

          <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActive(item.key)}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                  active === item.key
                    ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
                }`}
              >
                {item.title}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-h-[360px] flex-1 rounded-2xl border border-dashed border-neutral-300 p-6 dark:border-neutral-700">
          {renderSection()}
        </section>
      </div>
    </div>
  );
}
