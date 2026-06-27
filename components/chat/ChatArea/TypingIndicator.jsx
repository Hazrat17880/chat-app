export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm px-4 py-3 flex gap-1.5 items-center">
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></span>
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></span>
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></span>
      </div>
    </div>
  );
}