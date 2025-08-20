import Link from "next/link";
import { auth } from "~/server/auth";
import { signOut } from "~/server/auth";
import { db } from "~/server/db";
import ApiSection from "~/components/client/ApiSection";


export default async function HomePage() {
  const session = await auth();
  const quota = await db.apiQuota.findUniqueOrThrow({
    where: {
      userId: session?.user.id,
    },
  });

  if (!session) {
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
          <div className="flex space-x-6">
            <a href="/login" className="text-gray-300 hover:text-white transition-colors font-semibold">Sign In</a>
            <a href="/signup" className="text-gray-300 hover:text-white transition-colors font-semibold">Sign Up</a>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="w-full max-w-4xl text-center">
            <h1 className="text-6xl font-black text-white mb-6">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Sentiment Analysis</span>
            </h1>
            <p className="text-xl text-purple-300 font-semibold mb-12 max-w-2xl mx-auto">
              Analyze video sentiment with AI-powered insights. Understand audience reactions and optimize your content strategy.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Upload Videos</h3>
                <p className="text-gray-300">Simply drag and drop your video files for analysis</p>
              </div>

              <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Analysis</h3>
                <p className="text-gray-300">Get detailed sentiment insights powered by machine learning</p>
              </div>

              <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Detailed Reports</h3>
                <p className="text-gray-300">View comprehensive analytics and actionable insights</p>
              </div>
            </div>

            <div className="space-x-6">
              <a
                href="/signup"
                className="inline-block py-4 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Get Started
              </a>
              <a
                href="/login"
                className="inline-block py-4 px-8 bg-gray-700/50 border border-gray-600/50 text-white font-bold rounded-xl hover:bg-gray-600/50 transition-all duration-300"
              >
                Sign In
              </a>
            </div>
          </div>
        </main>
      </div>
    );
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
          <h2 className="text-5xl font-black text-white mb-6">
            Welcome to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Dashboard</span>
          </h2>
          <p className="text-xl text-purple-300 font-semibold max-w-3xl mx-auto">
            Ready to analyze your video content? Upload videos and get instant sentiment analysis with our advanced AI technology.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-8 shadow-2xl hover:transform hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Upload Videos</h3>
            <p className="text-gray-300 mb-6">Simply drag and drop your video files for analysis</p>
            <button className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all duration-300">
              Upload Now
            </button>
          </div>

          <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-8 shadow-2xl hover:transform hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">AI Analysis</h3>
            <p className="text-gray-300 mb-6">Get detailed sentiment insights powered by machine learning</p>
            <button className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-300">
              Analyze
            </button>
          </div>

          <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-8 shadow-2xl hover:transform hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">View Reports</h3>
            <p className="text-gray-300 mb-6">Access comprehensive analytics and actionable insights</p>
            <button className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300">
              View Reports
            </button>
          </div>
        </div>

        <div className="text-center">
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-4 rounded-2xl text-xl font-black transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
            Get Started with Video Analysis
          </button>
        </div>

        {/* API Section */}
        <ApiSection quota={quota} />
      </main>
    </div>
  );
}
