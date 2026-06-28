// components/chat/ChatHeader.jsx
import { useState, useEffect } from 'react';

export default function ChatHeader({
  user,
  isTyping,
  onBack,
  onUserDetails,
}) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  console.log("your user are :",user);

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

  const handleOpenProfile = () => {
    setShowProfileModal(true);
    if (onUserDetails) onUserDetails();
  };

  // Profile Modal Component (built-in)
  const UserProfileModal = () => {
    useEffect(() => {
      if (showProfileModal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [showProfileModal]);

    if (!showProfileModal || !user) return null;

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        setShowProfileModal(false);
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 px-6 pt-10 pb-16">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-3 right-3 text-white/80 hover:text-white p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col items-center">
              <div className="relative">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-semibold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                {user.online && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mt-3">{user.name}</h2>
              <p className="text-white/80 text-sm">
                {user.online ? '🟢 Online' : '🔴 Offline'}
              </p>
            </div>
          </div>

          {/* User Details */}
          <div className="px-6 py-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <p className="text-xs text-gray-400">Username</p>
                <p className="text-sm text-gray-800 font-medium">{user.name}</p>
              </div>
            </div>

            {user.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-gray-800 font-medium">{user.email}</p>
                </div>
              </div>
            )}

            {user.bio && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <div>
                  <p className="text-xs text-gray-400">Bio</p>
                  <p className="text-sm text-gray-800 font-medium">{user.bio}</p>
                </div>
              </div>
            )}

            {user.location && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="text-sm text-gray-800 font-medium">{user.location}</p>
                </div>
              </div>
            )}

            {user.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm text-gray-800 font-medium">{user.phone}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full mt-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 shadow-sm z-10">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div 
          className="relative flex-shrink-0 cursor-pointer"
          onClick={handleOpenProfile}
        >
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          {user.online && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={handleOpenProfile}
        >
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
            onClick={handleOpenProfile}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
        </div>
      </div>

      {/* User Profile Modal - Built-in */}
      <UserProfileModal />
    </>
  );
}