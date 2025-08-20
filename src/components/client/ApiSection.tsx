"use client";

import { useState } from "react";
import CopyButton from "./CopyButton";

interface ApiQuota {
  secretKey: string;
  requestsUsed: number;
  maxRequests: number;
  lastResetDate: Date;
}

interface ApiSectionProps {
  quota: ApiQuota;
}

export default function ApiSection({ quota }: ApiSectionProps) {
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'typescript' | 'curl'>('typescript');

  const handleToggleVisibility = (show: boolean) => {
    setIsKeyVisible(show);
  };

  const tsCode = `// 1. Get upload URL
const response = await fetch('/api/upload-url', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${quota.secretKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileType: '.mp4'
  })
});

const { uploadUrl, key } = await response.json();

// 2. Upload file to S3
const uploadResponse = await fetch(uploadUrl, {
  method: 'POST',
  body: file,
  headers: {
    'Content-Type': 'video/mp4'
  }
});

// 3. Analyze video
const analysisResponse = await fetch('/api/sentiment-inference', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${quota.secretKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    key: key
  })
});

const sentimentResult = await analysisResponse.json();`;

  const curlCode = `# 1. Get upload URL
curl -X POST /api/upload-url \\
  -H "Authorization: Bearer ${quota.secretKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"fileType": ".mp4"}'

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
  /api/sentiment-inference`;

  return (
    <div className="mt-16">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-black text-white mb-4">API</h3>
        <p className="text-lg text-purple-300 font-semibold">Use our API to integrate video sentiment analysis into your applications</p>
      </div>
      
      <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-bold text-white">API Key</h4>
          <CopyButton 
            text={quota.secretKey} 
            onToggleVisibility={handleToggleVisibility}
            isVisible={isKeyVisible}
          />
        </div>
        <div className="bg-gray-900/50 border border-gray-600/50 rounded-xl p-4">
          <code className="text-purple-300 font-mono text-sm break-all">
            {isKeyVisible ? quota.secretKey : quota.secretKey.replace(/./g, '•')}
          </code>
        </div>
        <div className="mt-4 text-sm text-gray-400">
          <p>Requests used: {quota.requestsUsed} / {quota.maxRequests}</p>
          <p>Last reset: {quota.lastResetDate.toLocaleDateString()}</p>
        </div>
      </div>

      {/* API Usage Examples */}
      <div className="mt-8">
        <div className="text-center mb-6">
          <h4 className="text-2xl font-black text-white mb-2">API Usage</h4>
          <p className="text-purple-300 font-semibold">Examples of how to use the API with TypeScript and CURL</p>
        </div>
        
        <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-gray-700/50">
            <button
              onClick={() => setActiveTab('typescript')}
              className={`px-6 py-3 font-semibold transition-all duration-300 ${
                activeTab === 'typescript'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              TypeScript
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`px-6 py-3 font-semibold transition-all duration-300 ${
                activeTab === 'curl'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              CURL
            </button>
          </div>
          
          {/* Code Content */}
          <div className="p-6">
            <pre className="bg-gray-900/50 border border-gray-600/50 rounded-xl p-4 overflow-x-auto">
              <code className="text-purple-300 font-mono text-sm">
                {activeTab === 'typescript' ? tsCode : curlCode}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
