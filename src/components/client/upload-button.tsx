"use client";

import { useState } from "react";

interface UploadButtonProps {
  apiKey: string;
  onAnalysis: (analysis: any) => void;
}

export default function UploadButton({ apiKey, onAnalysis }: UploadButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState<string>("");

  const pollForResults = async (key: string, requestId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/sentiment-inference?key=${key}&requestId=${requestId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.status === "completed") {
            setStatus("Analysis complete!");
            setIsAnalyzing(false);
            onAnalysis(result.analysis);
            return;
          } else if (result.status === "processing") {
            setStatus("Processing... Please wait.");
            attempts++;
            
            if (attempts < maxAttempts) {
              setTimeout(poll, 5000); // Poll every 5 seconds
            } else {
              setStatus("Analysis timed out. Please try again.");
              setIsAnalyzing(false);
            }
          }
        } else {
          throw new Error('Failed to check status');
        }
      } catch (error) {
        console.error('Status check failed:', error);
        setStatus("Error checking status. Please try again.");
        setIsAnalyzing(false);
      }
    };

    // Start polling
    poll();
  };

  const handleUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        setIsAnalyzing(true);
        setStatus("Starting analysis...");
        
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
        setStatus("Uploading video...");
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        
        // 3. Start async analysis
        setStatus("Starting video analysis...");
        const analysisRes = await fetch('/api/sentiment-inference', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key }),
        });
        
        if (!analysisRes.ok) throw new Error('Failed to start analysis');
        
        const result = await analysisRes.json();
        console.log('Async analysis started:', result);
        
        if (result.status === "processing") {
          setStatus("Analysis in progress...");
          // Start polling for results
          pollForResults(key, result.requestId);
        } else {
          throw new Error('Unexpected response from analysis API');
        }

      } catch (error) {
        console.error('Upload failed:', error);
        setStatus("Upload failed. Please try again.");
        setIsAnalyzing(false);
        alert('Upload failed. Please try again.');
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={handleUpload}
        disabled={isAnalyzing}
        className="w-full py-12 px-12 bg-purple-600 hover:bg-purple-700 text-white font-bold text-2xl rounded-3xl transition-all duration-500 hover:scale-105 hover:shadow-2xl backdrop-blur-sm hover:backdrop-blur-md disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isAnalyzing ? "Analyzing..." : "Upload Now"}
      </button>
      
      {isAnalyzing && status && (
        <div className="text-center text-purple-300 font-medium">
          {status}
        </div>
      )}
    </div>
  );
}
