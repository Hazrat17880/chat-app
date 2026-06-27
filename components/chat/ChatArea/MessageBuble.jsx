export default function MessageBubble({ message }) {
  const isMe = message.sender === "me";

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}
    >
      <div
        className={`relative max-w-[75%] md:max-w-[60%] px-3.5 py-2 shadow-sm ${
          isMe
            ? "bg-blue-500 text-white rounded-2xl rounded-br-sm"
            : "bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100"
        }`}
      >
        <p className="text-sm leading-relaxed break-words">{message.text}</p>

        <div
          className={`flex items-center gap-1.5 mt-1 ${
            isMe ? "justify-end" : "justify-start"
          }`}
        >
          <span className={`text-[10px] ${isMe ? "text-blue-200" : "text-gray-400"}`}>
            {message.time}
          </span>
          {isMe && (
            <svg className="w-4 h-4 text-blue-200" viewBox="0 0 16 15" fill="currentColor">
              <path d="M11.03.476a.75.75 0 010 1.06L5.426 7.14l5.605 5.603a.75.75 0 11-1.06 1.06l-6.136-6.133a.75.75 0 010-1.061l6.136-6.134a.75.75 0 011.06 0z" transform="translate(4, 0) rotate(90 4 7.5)" />
              <path d="M14.53.476a.75.75 0 010 1.06L8.926 7.14l5.605 5.603a.75.75 0 11-1.06 1.06l-6.136-6.133a.75.75 0 010-1.061l6.136-6.134a.75.75 0 011.06 0z" transform="translate(8, 0) rotate(90 8 7.5)" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}