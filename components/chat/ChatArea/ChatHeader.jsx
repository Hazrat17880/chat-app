export default function ChatHeader({
  user,
  isTyping,
  onBack,
  onUserDetails,
}) {
  if (!user) {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center shadow-sm z-10">
        <div className="flex-1 text-center">
          <p className="text-gray-600 font-medium text-sm">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 shadow-sm z-10">
      <button
        onClick={onBack}
        className="md:hidden p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
          {user.avatar || user.name.charAt(0)}
        </div>
        {user.online && (
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-gray-800 text-sm truncate">
          {user.name}
        </h2>
        <p className="text-xs text-gray-400">
          {isTyping ? (
            <span className="text-blue-500 font-medium flex items-center gap-1">
              typing
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </span>
            </span>
          ) : user.online ? (
            "Online"
          ) : (
            "Last seen recently"
          )}
        </p>
      </div>

      <div className="hidden md:flex items-center gap-1">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>

        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-9 4h8a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          onClick={onUserDetails}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </button>
      </div>
    </div>
  );
}