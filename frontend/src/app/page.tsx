import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="text-lg font-semibold tracking-tight text-slate-900">NoahLaw</span>
          </Link>
          <div className="flex items-center gap-8">
            <a href="#mission" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Mission
            </a>
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              How It Works
            </a>
            <Link
              href="/login"
              className="text-sm font-medium border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section — dark navy for impact */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center px-6 pt-32 pb-24">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-blue-300 tracking-wide uppercase">AI-Powered Legal Platform</span>
          </div>

          <h1 className="text-6xl font-bold tracking-tight leading-tight mb-6 text-white">
            Navigate the law<br />
            with <span className="text-blue-400">confidence</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            NoahLaw combines AI-driven case management with a curated marketplace
            of legal professionals — so you never face the courtroom alone.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold text-lg px-8 py-3.5 rounded-lg hover:bg-blue-500 transition-colors"
            >
              Get Started
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium text-lg px-6 py-3.5 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10 bg-white/[0.03]">
          <div className="max-w-5xl mx-auto grid grid-cols-3 divide-x divide-white/10">
            <div className="py-8 text-center">
              <p className="text-3xl font-bold text-white">10,000+</p>
              <p className="text-sm text-slate-400 mt-1">Cases Managed</p>
            </div>
            <div className="py-8 text-center">
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-sm text-slate-400 mt-1">Legal Specialists</p>
            </div>
            <div className="py-8 text-center">
              <p className="text-3xl font-bold text-white">98%</p>
              <p className="text-sm text-slate-400 mt-1">Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-24 px-6 bg-white scroll-mt-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-4">Our Mission</p>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">
              Justice should not be a privilege
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              Every year, thousands of people navigate complex legal proceedings alone —
              overwhelmed by procedural rules, buried in paperwork, and unsure of their rights.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              NoahLaw exists to change that. We democratise access to justice by putting
              AI-powered tools and vetted legal professionals within everyone&apos;s reach.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-10">
            <blockquote className="text-lg text-slate-300 italic leading-relaxed">
              &ldquo;Equal justice under law is not merely a caption on the facade of the
              Supreme Court building; it is perhaps the most inspiring ideal of our society.&rdquo;
            </blockquote>
            <p className="mt-6 text-sm text-slate-500">— Lewis Powell Jr., U.S. Supreme Court Justice</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-slate-50 border-y border-slate-200 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-4">Features</p>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">
              Everything you need to manage your case
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 4.94a2.25 2.25 0 01-2.013 1.244H9.483a2.25 2.25 0 01-2.013-1.244L5 14.5m14 0H5" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Case Analysis</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload your documents and let our AI identify key arguments, deadlines,
                and relevant case law in seconds.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Timeline Management</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Never miss a filing deadline. Track court dates, responses, and procedural
                steps with automated reminders.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-lg bg-violet-50 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Legal Marketplace</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Browse vetted barristers, solicitors, and legal consultants. Find the right
                specialist for your specific case type.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Document Builder</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate court-ready witness statements, skeleton arguments, and claim forms
                with AI-assisted drafting.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Legal Chat</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ask questions about your case in plain English. Get clear, contextual
                guidance based on your specific circumstances.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Evidence Vault</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Securely store and organise case evidence. Tag, search, and cross-reference
                documents with full audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-white scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-4">How It Works</p>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">
              Three steps to stronger representation
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-6">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Create Your Case</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sign up and describe your legal situation. Our AI will help categorise
                your case and identify the key issues at stake.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-6">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Build Your Strategy</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload evidence, generate timelines, and use AI analysis to understand
                your position and prepare your arguments.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-6">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Get Expert Help</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                When you need professional support, browse our marketplace to find and
                instruct the right legal specialist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section — dark navy for final impact */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white mb-6">
            Ready to take control of your case?
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Join thousands of litigants who are using NoahLaw to navigate
            the legal system with confidence.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold text-lg px-8 py-3.5 rounded-lg hover:bg-blue-500 transition-colors"
          >
            Get Started — It&apos;s Free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white border-t border-slate-200">
        <p className="text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} NoahLaw. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
