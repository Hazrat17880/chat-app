export default function UserDetailsModal({ user, isOpen, onClose, onMessage, onCall }) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">User Details</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1 rounded-full transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {user.avatar || user.name.charAt(0)}
              </div>
              {user.online && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-3 border-white rounded-full"></div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-800 mt-3">{user.name}</h2>
            <p className={`text-sm ${user.online ? 'text-green-500' : 'text-gray-400'}`}>
              {user.online ? '🟢 Online' : '⚪ Offline'}
            </p>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Status</span>
              <span className="text-sm font-medium text-gray-800">
                {user.online ? 'Active Now' : 'Last seen recently'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">User ID</span>
              <span className="text-sm font-medium text-gray-800">#{user.id}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-800">
                {user.email || `${user.name.toLowerCase().replace(' ', '.')}@email.com`}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Phone</span>
              <span className="text-sm font-medium text-gray-800">
                {user.phone || '+1 (555) 123-4567'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onMessage}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Message
            </button>
            <button
              onClick={onCall}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}