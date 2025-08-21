"use client";

interface UploadSectionProps {
  apiKey: string;
}

export default function UploadSection({ apiKey }: UploadSectionProps) {
  const handleUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        // 1. Get upload URL
        const res = await fetch('/api/upload-url', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileType: file.type }),
        });
        
        if (!res.ok) throw new Error('Failed to get upload URL');
        const { url, key } = await res.json();
        
        // 2. Upload file to S3
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        
        // 3. Analyze video
        const analysisRes = await fetch('/api/sentiment-inference', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key }),
        });
        
        if (!analysisRes.ok) throw new Error('Analysis failed');
        const analysis = await analysisRes.json();
        
        console.log('Analysis received:', analysis);
        alert('Video analysis complete! Check your dashboard for results.');
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed. Please try again.');
      }
    };
    input.click();
  };

  return (
    <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-2xl p-8 shadow-2xl hover:transform hover:scale-105 transition-all duration-300">
      <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-4">Upload Videos</h3>
      <p className="text-gray-300 mb-6">Simply drag and drop your video files for analysis</p>
      <button 
        onClick={handleUpload}
        className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all duration-300"
      >
        Upload Now
      </button>
    </div>
  );
}
