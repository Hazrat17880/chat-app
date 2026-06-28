// components/chat/MessageBuble.jsx
export default function MessageBubble({ message }) {
  const isMe = message.sender === "me" || message.senderId === message.senderId?._id;
  
  // Helper function to safely parse dates from MongoDB
  const formatMessageTime = (dateValue) => {
    if (!dateValue) return '';
    
    let date;
    // Handle different date formats
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (dateValue && typeof dateValue === 'object' && dateValue.$date) {
      // Handle MongoDB date format: { $date: "2026-06-28T09:26:08.711Z" }
      date = new Date(dateValue.$date);
    } else if (dateValue && typeof dateValue === 'object' && dateValue._date) {
      // Handle alternative MongoDB format
      date = new Date(dateValue._date);
    } else {
      // Try to convert directly
      date = new Date(dateValue);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateValue);
      return '';
    }
    
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status icon based on message status
  const getStatusIcon = () => {
    const status = message.status || 'sent';
    
    switch(status) {
      case 'sending':
        return (
          <svg className="w-4 h-4 text-blue-200 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M12 6v6l4 2" strokeWidth="2" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'sent':
        return (
          <svg className="w-4 h-4 text-blue-200" viewBox="0 0 16 15" fill="currentColor">
            <path d="M11.03.476a.75.75 0 010 1.06L5.426 7.14l5.605 5.603a.75.75 0 11-1.06 1.06l-6.136-6.133a.75.75 0 010-1.061l6.136-6.134a.75.75 0 011.06 0z" />
          </svg>
        );
      case 'delivered':
        return (
          <svg className="w-4 h-4 text-blue-200" viewBox="0 0 16 15" fill="currentColor">
            <path d="M11.03.476a.75.75 0 010 1.06L5.426 7.14l5.605 5.603a.75.75 0 11-1.06 1.06l-6.136-6.133a.75.75 0 010-1.061l6.136-6.134a.75.75 0 011.06 0z" transform="translate(2, 0)" />
            <path d="M11.03.476a.75.75 0 010 1.06L5.426 7.14l5.605 5.603a.75.75 0 11-1.06 1.06l-6.136-6.133a.75.75 0 010-1.061l6.136-6.134a.75.75 0 011.06 0z" transform="translate(6, 0)" />
          </svg>
        );
      case 'read':
        return (
          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 16 15" fill="currentColor">
            <path d="M11.03.476a.75.75 0 010 1.06L5.426 7.14l5.605 5.603a.75.75 0 11-1.06 1.06l-6.136-6.133a.75.75 0 010-1.061l6.136-6.134a.75.75 0 011.06 0z" transform="translate(2, 0)" />
            <path d="M11.03.476a.75.75 0 010 1.06L5.426 7.14l5.605 5.603a.75.75 0 11-1.06 1.06l-6.136-6.133a.75.75 0 010-1.061l6.136-6.134a.75.75 0 011.06 0z" transform="translate(6, 0)" />
            <circle cx="12" cy="7.5" r="2" fill="white" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get status text for tooltip
  const getStatusText = () => {
    const status = message.status || 'sent';
    const statusMap = {
      'sending': 'Sending...',
      'failed': 'Failed to send',
      'sent': 'Sent',
      'delivered': 'Delivered',
      'read': 'Read'
    };
    return statusMap[status] || '';
  };

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}
    >
      <div
        className={`relative max-w-[75%] md:max-w-[60%] px-3.5 py-2 shadow-sm ${
          isMe
            ? message.status === 'failed' 
              ? "bg-red-500 text-white rounded-2xl rounded-br-sm" 
              : "bg-blue-500 text-white rounded-2xl rounded-br-sm"
            : "bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100"
        }`}
      >
        <p className="text-sm leading-relaxed break-words">{message.content}</p>

        <div
          className={`flex items-center gap-1.5 mt-1 ${
            isMe ? "justify-end" : "justify-start"
          }`}
        >
          <span
            className={`text-[10px] ${
              isMe 
                ? message.status === 'failed' 
                  ? "text-red-200" 
                  : "text-blue-200" 
                : "text-gray-400"
            }`}
          >
            {formatMessageTime(message.createdAt)}
          </span>
          
          {isMe && (
            <div className="flex items-center gap-0.5" title={getStatusText()}>
              {getStatusIcon()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}