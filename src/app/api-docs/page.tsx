import { auth, signOut } from "~/server/auth";
import { redirect } from "next/navigation";
import ApiKeyDisplay from "~/components/client/api-key-display";

export default async function ApiDocsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex h-16 items-center justify-between border-b border-gray-700/50 backdrop-blur-md bg-gray-900/50 px-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </div>
          <span className="text-2xl font-extrabold text-white">SentimentAnalysis</span>
        </div>
        <div className="flex items-center space-x-6">
          <a href="/" className="text-gray-300 hover:text-white transition-colors font-semibold">Dashboard</a>
          <span className="text-gray-300 font-semibold">
            Welcome, {session.user.name || session.user.email}
          </span>
          <form action={async () => {
            'use server';
            await signOut();
          }}>
            <button
              type="submit"
              className="px-6 py-2 bg-red-500 hover:bg-red-700 text-white rounded-xl transition-all duration-300 font-bold"
            >
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-10 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-white mb-6">
            API <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Documentation</span>
          </h1>
          <p className="text-xl text-purple-300 font-semibold max-w-3xl mx-auto">
            Integrate video sentiment analysis into your applications with our powerful API
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <ApiKeyDisplay />
        </div>
      </main>
    </div>
  );
}
