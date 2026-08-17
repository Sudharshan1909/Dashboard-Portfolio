const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERCEL_URL = process.argv[2] || process.env.VERCEL_URL;
if (!VERCEL_URL) {
  console.error('Usage: node build-static.js <vercel-url>');
  console.error('Example: node build-static.js https://my-app.vercel.app');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const BACKUP_DIR = path.join(ROOT, '.static-backup');

const originalFiles = {};

function backupFile(relativePath) {
  const fullPath = path.join(SRC, relativePath);
  if (fs.existsSync(fullPath)) {
    originalFiles[relativePath] = fs.readFileSync(fullPath, 'utf8');
  }
}

function restoreFile(relativePath) {
  const fullPath = path.join(SRC, relativePath);
  if (originalFiles[relativePath] !== undefined) {
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, originalFiles[relativePath], 'utf8');
  } else if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

function backupDir(relativePath) {
  const fullPath = path.join(SRC, relativePath);
  if (!fs.existsSync(fullPath)) return;
  
  function walk(dir, base) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const entryPath = path.join(dir, entry);
      const relPath = path.join(base, entry);
      const stat = fs.statSync(entryPath);
      if (stat.isDirectory()) {
        walk(entryPath, relPath);
      } else {
        backupFile(relPath);
      }
    }
  }
  
  walk(fullPath, relativePath);
}

function restoreDir(relativePath) {
  const fullPath = path.join(SRC, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
  
  for (const [relPath, content] of Object.entries(originalFiles)) {
    if (relPath === relativePath || relPath.startsWith(relativePath + '/') || relPath.startsWith(relativePath + '\\')) {
      const filePath = path.join(SRC, relPath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

function writeFile(relativePath, content) {
  const fullPath = path.join(SRC, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

function removeFile(relativePath) {
  const fullPath = path.join(SRC, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

function removeDir(relativePath) {
  const fullPath = path.join(SRC, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

console.log('Preparing static export for Infinity Free...');
console.log('   Vercel URL: ' + VERCEL_URL);

try {
  console.log('Backing up original files...');
  backupDir('app/dashboard');
  backupDir('app/auth');
  backupFile('app/posts/[slug]/page.tsx');
  backupDir('app/api');

  console.log('Creating static redirect pages...');

  const dashboardRedirect = "'use client';\n" +
    "import { useEffect } from 'react';\n" +
    "\n" +
    "export default function DashboardRedirect() {\n" +
    "  useEffect(() => {\n" +
    "    window.location.href = '" + VERCEL_URL + "/dashboard';\n" +
    "  }, []);\n" +
    "  return (\n" +
    "    <main className=\"min-h-screen flex items-center justify-center\">\n" +
    "      <p className=\"text-neutral-600 dark:text-neutral-300\">Redirecting to dashboard...</p>\n" +
    "    </main>\n" +
    "  );\n" +
    "}\n";

  const dashboardHomeRedirect = "'use client';\n" +
    "import { useEffect } from 'react';\n" +
    "\n" +
    "export default function DashboardHomeRedirect() {\n" +
    "  useEffect(() => {\n" +
    "    window.location.href = '" + VERCEL_URL + "/dashboard/home';\n" +
    "  }, []);\n" +
    "  return (\n" +
    "    <main className=\"min-h-screen flex items-center justify-center\">\n" +
    "      <p className=\"text-neutral-600 dark:text-neutral-300\">Redirecting to dashboard...</p>\n" +
    "    </main>\n" +
    "  );\n" +
    "}\n";

  const authRedirect = "'use client';\n" +
    "import { useEffect } from 'react';\n" +
    "\n" +
    "export default function AuthRedirect() {\n" +
    "  useEffect(() => {\n" +
    "    window.location.href = '" + VERCEL_URL + "/auth';\n" +
    "  }, []);\n" +
    "  return (\n" +
    "    <main className=\"min-h-screen flex items-center justify-center\">\n" +
    "      <p className=\"text-neutral-600 dark:text-neutral-300\">Redirecting to sign-in...</p>\n" +
    "    </main>\n" +
    "  );\n" +
    "}\n";

  const postsPageStatic = "import Navbar from \"@/components/Navbar\";\n" +
    "import Footer from \"@/components/Footer\";\n" +
    "import { postsConfig } from \"@/config/posts\";\n" +
    "import { notFound } from 'next/navigation';\n" +
    "\n" +
    "async function getPost(slug: string) {\n" +
    "  const staticPost = postsConfig.posts.find((p) => p.slug === 'posts/' + slug);\n" +
    "  if (staticPost) {\n" +
    "    return { ...staticPost };\n" +
    "  }\n" +
    "  return null;\n" +
    "}\n" +
    "\n" +
    "export default async function Post({ params }: { params: Promise<{ slug: string }> }) {\n" +
    "  const { slug } = await params;\n" +
    "\n" +
    "  const post = await getPost(slug);\n" +
    "\n" +
    "  if (!post) {\n" +
    "    notFound();\n" +
    "  }\n" +
    "\n" +
    "  return (\n" +
    "    <div className=\"min-h-screen flex flex-col\">\n" +
    "      <div className=\"absolute inset-0 z-0 overflow-hidden\">\n" +
    "        <div className=\"absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_48px] -z-10\"></div>\n" +
    "        <div className=\"absolute left-0 right-0 top-0 -z-10 m-auto h-[1200px] w-[1200px] rounded-full bg-neutral-400 opacity-10 blur-[100px]\"></div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div className=\"relative z-10 flex flex-col flex-1\">\n" +
    "        <Navbar />\n" +
    "\n" +
    "         <section className=\"flex flex-1\">\n" +
    "            <article className=\"relative z-20 w-[896px] mx-auto mt-32 mb-12\">\n" +
    "              <div className=\"prose dark:prose-invert max-w-none\">\n" +
    "                <h1 className=\"text-4xl font-bold mb-4\">{post.title}</h1>\n" +
    "                <div className=\"flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-8\">\n" +
    "                  <time>{post.date}</time>\n" +
    "                  <span>•</span>\n" +
    "                  <span>{post.readTime.includes('min') ? post.readTime : post.readTime + ' min read'}</span>\n" +
    "                  <span>•</span>\n" +
    "                  <span>{post.author}</span>\n" +
    "                </div>\n" +
    "\n" +
    "               <div dangerouslySetInnerHTML={{ __html: post.html }} />\n" +
    "              </div>\n" +
    "            </article>\n" +
    "          </section>\n" +
    "      </div>\n" +
    "\n" +
    "      <Footer />\n" +
    "    </div>\n" +
    "  );\n" +
    "}\n";

  writeFile('app/dashboard/page.tsx', dashboardRedirect);
  writeFile('app/dashboard/home/page.tsx', dashboardHomeRedirect);
  writeFile('app/auth/page.tsx', authRedirect);
  writeFile('app/posts/[slug]/page.tsx', postsPageStatic);

  removeFile('app/dashboard/DashboardAuthPanel.tsx');
  removeFile('app/dashboard/home/WorkspaceShell.tsx');
  removeDir('app/api');

  console.log('Building static export...');
  const env = {
    ...process.env,
    STATIC_EXPORT: '1',
    NEXT_PUBLIC_VERCEL_URL: VERCEL_URL,
  };

  try {
    execSync('npx next build', {
      cwd: ROOT,
      stdio: 'inherit',
      env,
    });
  } catch (buildError) {
    console.error('Build failed:', buildError.message);
    process.exit(1);
  }

  console.log('Static build complete!');
  console.log('   Output: ' + path.join(ROOT, 'out'));
  console.log('   Upload the "out" folder to Infinity Free.');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} finally {
  console.log('Restoring original files...');
  restoreDir('app/dashboard');
  restoreDir('app/auth');
  restoreFile('app/posts/[slug]/page.tsx');
  restoreDir('app/api');

  console.log('Done!');
}
