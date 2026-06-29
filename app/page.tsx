"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const THREAD = [
  { from: "them", text: "you still up for saturday?" },
  { from: "me", text: "wouldn't miss it" },
  { from: "them", text: "bringing the whole crew then" },
  { from: "me", text: "even better 🔥" },
];

export default function Home() {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const loopRef = useRef(null);

  useEffect(() => {
    let i = 0;
    let cancelled = false;

    function step() {
      if (cancelled) return;
      if (i >= THREAD.length) {
        loopRef.current = setTimeout(() => {
          if (cancelled) return;
          setVisibleCount(0);
          i = 0;
          step();
        }, 1800);
        return;
      }
      setIsTyping(true);
      loopRef.current = setTimeout(() => {
        if (cancelled) return;
        setIsTyping(false);
        i += 1;
        setVisibleCount(i);
        loopRef.current = setTimeout(step, 900);
      }, 850);
    }

    step();
    return () => {
      cancelled = true;
      clearTimeout(loopRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#16140F] flex flex-col">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Space+Mono:wght@400;500&family=Inter:wght@400;500&display=swap");
        .font-display { font-family: "Archivo", sans-serif; }
        .font-mono { font-family: "Space Mono", monospace; }
        .font-body { font-family: "Inter", sans-serif; }
        @keyframes blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }
        @keyframes riseIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* Top bar */}
      <header className="w-full px-6 sm:px-10 py-6 flex items-center justify-between font-body">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A36]" />
          <span className="font-display font-semibold text-lg tracking-tight">Chatly</span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="text-sm font-medium text-[#16140F]/70 hover:text-[#16140F] transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Main split */}
      <main className="flex-1 flex items-center">
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div className="max-w-md">
            <p className="font-mono text-xs tracking-widest uppercase text-[#8A9A7E] mb-5">
              now connecting · real-time
            </p>
            <h1 className="font-display text-[3.4rem] leading-[1.02] font-semibold tracking-tight mb-6">
              Say it the
              <br />
              second you
              <br />
              think it.
            </h1>
            <p className="font-body text-[#16140F]/60 text-lg leading-relaxed mb-10 max-w-sm">
              No refresh, no delay. Messages land the instant you send them,
              and you'll always know who's reading.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-sm">
              <button
                onClick={() => router.push("/signup")}
                className="bg-[#16140F] text-[#FAF8F4] px-7 py-3.5 rounded-lg font-body font-medium text-[15px] hover:bg-[#2A2620] transition-colors"
              >
                Create an account
              </button>
              <button
                onClick={() => router.push("/login")}
                className="px-7 py-3.5 rounded-lg font-body font-medium text-[15px] border border-[#16140F]/15 hover:border-[#16140F]/30 transition-colors"
              >
                Sign in
              </button>
            </div>

            <p className="font-mono text-[11px] text-[#16140F]/35 mt-8 tracking-wide">
              by continuing you agree to our terms and privacy policy
            </p>
          </div>

          {/* Right: live thread mockup — the signature element */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-[300px] rounded-[28px] bg-[#16140F] p-2 shadow-2xl">
              <div className="rounded-[22px] bg-[#FAF8F4] overflow-hidden">
                {/* thread header */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#16140F]/8">
                  <div className="w-8 h-8 rounded-full bg-[#E8E3D8] flex items-center justify-center font-display text-xs font-semibold text-[#16140F]/60">
                    JM
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium leading-tight">Jess M.</p>
                    <p className="font-mono text-[10px] text-[#8A9A7E] tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8A9A7E] inline-block" />
                      active now
                    </p>
                  </div>
                </div>

                {/* messages */}
                <div className="px-4 py-5 flex flex-col gap-2.5 min-h-[260px] justify-end">
                  {THREAD.slice(0, visibleCount).map((m, idx) => (
                    <div
                      key={idx}
                      style={{ animation: "riseIn 0.3s ease-out" }}
                      className={`max-w-[78%] px-3.5 py-2 rounded-2xl font-body text-[13.5px] leading-snug ${
                        m.from === "me"
                          ? "self-end bg-[#FF5A36] text-white rounded-br-md"
                          : "self-start bg-[#E8E3D8] text-[#16140F] rounded-bl-md"
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}

                  {isTyping && (
                    <div
                      className={`flex gap-1 px-3.5 py-3 rounded-2xl w-fit ${
                        visibleCount % 2 === 0
                          ? "self-start bg-[#E8E3D8] rounded-bl-md"
                          : "self-end bg-[#FF5A36] rounded-br-md"
                      }`}
                    >
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className={`w-1.5 h-1.5 rounded-full ${
                            visibleCount % 2 === 0 ? "bg-[#16140F]/40" : "bg-white/70"
                          }`}
                          style={{ animation: `dot 1.1s ${d * 0.15}s infinite ease-in-out` }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* input row, decorative */}
                <div className="px-4 py-3 border-t border-[#16140F]/8 flex items-center gap-2">
                  <div className="flex-1 h-8 rounded-full bg-[#E8E3D8]/60" />
                  <div className="w-8 h-8 rounded-full bg-[#16140F] flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FAF8F4" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* floating status chip — the "delivered" beat */}
            <div className="hidden sm:flex absolute -left-6 top-10 bg-white border border-[#16140F]/10 rounded-xl px-3 py-2 shadow-md items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
              <span className="font-mono text-[10px] tracking-wide text-[#16140F]/60">delivered · 0.2s</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 sm:px-10 py-6 font-mono text-[10px] tracking-wide text-[#16140F]/30 text-center sm:text-left">
        chatly — built for the moment, not the inbox
      </footer>
    </div>
  );
}