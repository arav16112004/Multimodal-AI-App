"use client";

interface UploadButtonProps {
  apiKey: string;
  onAnalysis: (analysis: any) => void;
}

export default function UploadButton({ apiKey, onAnalysis }: UploadButtonProps) {
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
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key }),
        });
        
        if (!analysisRes.ok) throw new Error('Analysis failed');
        const analysis = await analysisRes.json();
        
        onAnalysis(analysis);
        console.log(analysis);
        

      } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed. Please try again.');
      }
    };
    input.click();
  };

  return (
    <button 
      onClick={handleUpload}
      className="w-full py-12 px-12 bg-purple-600 hover:bg-purple-700 text-white font-bold text-2xl rounded-3xl transition-all duration-500 hover:scale-105 hover:shadow-2xl backdrop-blur-sm hover:backdrop-blur-md"
    >
      Upload Now
    </button>
  );
}
