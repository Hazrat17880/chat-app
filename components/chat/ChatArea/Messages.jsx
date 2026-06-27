import { useRef, useEffect } from "react";
import MessageBubble from "./MessageBuble"
import TypingIndicator from "./TypingIndicator";

export default function Messages({ messages, isTyping }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-16 lg:px-24">
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        <div className="flex justify-center mb-4">
          <span className="bg-white text-gray-500 text-xs px-3 py-1 rounded-lg shadow-sm font-medium">
            TODAY
          </span>
        </div>

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}