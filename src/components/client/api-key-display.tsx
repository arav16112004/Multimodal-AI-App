"use client";

import { useState, useEffect } from "react";

interface ApiQuota {
  secretKey: string;
  requestsUsed: number;
  maxRequests: number;
}

export default function ApiKeyDisplay() {
  const [quota, setQuota] = useState<ApiQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"typescript" | "curl">("typescript");

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await fetch('/api/quota');
        if (!response.ok) {
          throw new Error('Failed to fetch quota');
        }
        const data = await response.json();
        setQuota(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchQuota();
  }, []);

  const copyToClipboard = async () => {
    if (!quota) return;
    
    try {
      await navigator.clipboard.writeText(quota.secretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Error Loading API Information</h3>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!quota) {
    return (
      <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No API Quota Found</h3>
          <p className="text-gray-300">Please contact support to set up your API access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white mb-6 text-center">
          API
        </h2>
        
        {/* Secret Key Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-3">Secret key</h3>
          <p className="text-gray-300 mb-4">
            This key should be used when calling our API, to authorize your request. It can not be shared publicly, and needs to be kept secret.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-xl text-green-400 font-mono text-sm break-all">
              {quota.secretKey}
            </code>
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Monthly Quota Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-3">Monthly quota</h3>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-white">
              {quota.requestsUsed.toLocaleString()} / {quota.maxRequests.toLocaleString()} requests
            </div>
            <div className="flex-1 bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(quota.requestsUsed / quota.maxRequests) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* API Usage Section */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">API Usage</h3>
          <p className="text-gray-300 mb-4">
            Examples of how to use the API with TypeScript and CURL.
          </p>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-600 mb-4">
            <button
              onClick={() => setActiveTab("typescript")}
              className={`px-6 py-3 font-bold transition-all duration-300 ${
                activeTab === "typescript"
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              TypeScript
            </button>
            <button
              onClick={() => setActiveTab("curl")}
              className={`px-6 py-3 font-bold transition-all duration-300 ${
                activeTab === "curl"
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              CURL
            </button>
          </div>

          {/* Code Display */}
          <div className="bg-gray-900/50 border border-gray-600/50 rounded-xl p-6">
            <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
              <code>{activeTab === "typescript" ? `// 1. Get upload URL
await fetch('/api/upload-url', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${quota.secretKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({fileType: '.mp4'})
}).then(res => res.json());

// Response contains url and key

// 2. Upload file to S3
await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'video/mp4'
  },
  body: videoFile
});

// 3. Analyze video
await fetch('/api/sentiment-inference', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${quota.secretKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ key })
}).then(res => res.json());` : `# 1. Get upload URL
curl -X POST \\
  -H "Authorization: Bearer ${quota.secretKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"fileType": ".mp4"}' \\
  /api/upload-url

# Response contains url and key

# 2. Upload file to S3
curl -X POST \\
  -H "Content-Type: video/mp4" \\
  --data-binary @video.mp4 \\
  "\${url}"

# 3. Analyze video
curl -X POST \\
  -H "Authorization: Bearer ${quota.secretKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"key": "\${key}"}' \\
  /api/sentiment-inference`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
