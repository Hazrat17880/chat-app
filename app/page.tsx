"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  const fullText = "Connect with friends in real-time";

  // Typing effect
  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 60); // Slightly slower for better readability

    return () => clearInterval(typingInterval);
  }, []);

  // Cursor blink effect (runs independently)
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden">
      
      {/* Ambient background blobs for a modern, soft look */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>

      {/* Main Content Container */}
      <div className="relative text-center px-6 max-w-2xl z-10">
        
        {/* Logo / Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-200 transform rotate-3 transition-transform duration-300 hover:rotate-0">
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>

        {/* Title with Gradient Text */}
        <h1 className="text-6xl font-extrabold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Chatly
          </span>
        </h1>

        {/* Animated Subtitle */}
        <div className="text-slate-500 text-xl mb-10 h-8 font-medium flex items-center justify-center">
          <span>{typedText}</span>
          <span 
            className={`inline-block w-[3px] h-5 bg-blue-500 ml-1 rounded-full transition-opacity duration-100 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
          ></span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
          <button
            onClick={() => router.push("/signup")}
            className="group w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-base font-semibold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            Get Started
            {/* Animated Arrow */}
            <svg 
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <button
            onClick={() => router.push("/login")}
            className="w-full sm:w-auto bg-white text-slate-700 px-8 py-3.5 rounded-xl text-base font-semibold shadow-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </div>

        {/* Optional: Sub-footer text */}
        <p className="mt-12 text-sm text-slate-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}