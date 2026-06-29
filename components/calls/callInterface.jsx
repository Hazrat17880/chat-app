// components/chat/CallInterface.jsx
import { useEffect } from 'react';

export default function CallInterface({
  isOpen,
  onClose,
  callerName,
  callStatus,
  isMuted,
  duration,
  onMuteToggle,
  onEndCall,
  isIncoming = false,
  onAccept,
  onReject
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl w-full max-w-md mx-4 p-8 shadow-2xl animate-scale-in">
        {/* Call Status */}
        <div className="text-center">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {callerName?.charAt(0).toUpperCase() || '?'}
          </div>

          <h2 className="text-xl font-bold text-gray-800 mt-4">
            {callerName || 'Unknown'}
          </h2>
          
          {/* Call Status Text */}
          <p className={`text-sm mt-1 ${
            callStatus === 'connected' ? 'text-green-500' :
            callStatus === 'calling' || callStatus === 'ringing' ? 'text-blue-500 animate-pulse' :
            'text-gray-500'
          }`}>
            {callStatus === 'calling' && 'Calling...'}
            {callStatus === 'ringing' && 'Incoming Call...'}
            {callStatus === 'connected' && `⏱ ${duration}`}
            {callStatus === 'ended' && 'Call Ended'}
            {callStatus === 'idle' && 'Call ended'}
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {isIncoming ? (
            // Incoming call controls
            <>
              <button
                onClick={onReject}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={onAccept}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </>
          ) : (
            // Active call controls
            <>
              <button
                onClick={onMuteToggle}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg ${
                  isMuted 
                    ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isMuted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              <button
                onClick={onEndCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21L9.228 3.684A1 1 0 008.28 3H5z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}