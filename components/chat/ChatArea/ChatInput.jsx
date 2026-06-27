import { useState, useRef } from "react";

export default function ChatInput({ onSendMessage, isTyping }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        onSendMessage(message);
        setMessage("");
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload
      const fileMessage = {
        id: Date.now(),
        sender: "me",
        text: `📎 ${file.name}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      onSendMessage(fileMessage);
    }
    e.target.value = ""; // Reset input
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const emojis = ['😀','😁','😂','🤣','😊','😍','🥰','😘','😗','😙','😚','🥲','😜','😝','😛','🤑','🤗','🤩','🥳','😎','🤓','🧐','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'];

  return (
    <div className="bg-[#f0f2f5] px-4 py-3 md:px-12 lg:px-24">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto flex items-end gap-2 bg-white rounded-2xl px-4 py-2 shadow-md border border-gray-100"
      >
        {/* Emoji Button */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-[280px] z-50">
              <div className="grid grid-cols-7 gap-1">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    className="hover:bg-gray-100 rounded p-1 text-xl transition-colors"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attachment Button */}
        <div className="relative flex-shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            multiple
          />
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rotate-45"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>

        {/* Text Input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 py-2.5 outline-none bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none overflow-y-auto"
          style={{
            maxHeight: "120px",
            minHeight: "42px",
            lineHeight: "1.5",
          }}
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={(e) => {
            const target = e.target;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 120) + "px";
          }}
          autoFocus
        />

        {/* Send / Mic Button */}
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 text-gray-400 hover:text-blue-500 disabled:text-gray-300 transition-colors flex-shrink-0"
        >
          {message.trim() ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}