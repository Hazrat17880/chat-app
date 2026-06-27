export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
      <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-6">
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-2xl font-light text-gray-700 mb-2">Chat App</h3>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
        Send and receive messages instantly.
        <br />
        Connect with your friends in real-time.
      </p>
      <div className="mt-8 border-t border-gray-200 pt-4 w-64 text-xs text-gray-400 flex items-center justify-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        End-to-end encrypted
      </div>
    </div>
  );
}