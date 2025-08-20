"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  onToggleVisibility: (show: boolean) => void;
  isVisible: boolean;
}

export default function CopyButton({ text, onToggleVisibility, isVisible }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const toggleKeyVisibility = () => {
    onToggleVisibility(!isVisible);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleKeyVisibility}
        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
      >
        {isVisible ? "Hide" : "Show"}
      </button>
      <button
        onClick={handleCopy}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-300"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
