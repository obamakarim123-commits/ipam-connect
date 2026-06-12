import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getServerSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container-responsive flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-blue-600">IPAM Connect</h1>
          <Link href="/auth/signin" className="btn-primary">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container-responsive py-20 text-center">
        <h2 className="text-5xl font-bold text-slate-900 mb-6">
          Student Networking Reimagined
        </h2>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Connect with peers, collaborate on projects, and access course resources all in one secure,
          unified platform designed specifically for IPAM students.
        </p>
        <Link href="/auth/signin" className="btn-primary text-lg">
          Get Started
        </Link>
      </section>

      {/* Features Section */}
      <section className="container-responsive py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <h3 className="text-xl font-bold mb-3">Unified Messaging</h3>
            <p className="text-slate-600">
              Direct messages and group channels keep all conversations organized in one place.
            </p>
          </div>
          <div className="card text-center">
            <h3 className="text-xl font-bold mb-3">Course Collaboration</h3>
            <p className="text-slate-600">
              Dedicated spaces for each course with shared resources, announcements, and discussions.
            </p>
          </div>
          <div className="card text-center">
            <h3 className="text-xl font-bold mb-3">Secure File Sharing</h3>
            <p className="text-slate-600">
              Share study materials, assignments, and resources with per-user storage limits.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-16">
        <div className="container-responsive text-center">
          <p>&copy; 2026 IPAM Connect. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
