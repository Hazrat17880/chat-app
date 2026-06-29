// components/chat/VoiceRecorder.jsx
import { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

export default function VoiceRecorder({ onSend, onCancel }) {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    cleanup
  } = useAudioRecorder();

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    return () => cleanup();
  }, []);

  const handleSend = async () => {
    if (audioBlob) {
      // Convert blob to base64 or File
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result;
        onSend({
          audio: base64Audio,
          duration: recordingDuration,
          type: 'audio'
        });
        cleanup();
      };
    }
  };

  const handleCancel = () => {
    cancelRecording();
    if (onCancel) onCancel();
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded-full shadow-lg border border-gray-200">
      {!isRecording && !audioUrl ? (
        // Start Recording Button
        <button
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={startRecording}
          className="p-2.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" />
          </svg>
        </button>
      ) : isRecording ? (
        // Recording Controls
        <>
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">
              {recordingDuration}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
          <button
            onClick={handleCancel}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      ) : (
        // Preview Controls
        <>
          <audio controls className="h-8 w-32">
            <source src={audioUrl} type="audio/webm" />
          </audio>
          <button
            onClick={handleSend}
            className="p-2 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
          <button
            onClick={handleCancel}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}