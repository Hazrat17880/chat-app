// components/chat/Messages.jsx
import { useRef, useEffect, useMemo } from "react";
import MessageBubble from "./MessageBuble";
import TypingIndicator from "./TypingIndicator";

export default function Messages({ messages, isTyping, currentUserId }) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Helper to safely parse dates
  const parseDate = (dateValue) => {
    if (!dateValue) return new Date(0);
    
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    } else if (dateValue instanceof Date) {
      return dateValue;
    } else if (dateValue && typeof dateValue === 'object' && dateValue.$date) {
      return new Date(dateValue.$date);
    }
    return new Date(dateValue);
  };

  // Sort messages by createdAt (oldest first, newest at bottom)
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const dateA = parseDate(a.createdAt || a.timestamp || 0);
      const dateB = parseDate(b.createdAt || b.timestamp || 0);
      return dateA - dateB;
    });
  }, [messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [sortedMessages, isTyping]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    sortedMessages.forEach((msg) => {
      const msgDate = parseDate(msg.createdAt || msg.timestamp || Date.now());
      const dateStr = msgDate.toDateString();
      
      if (dateStr !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = dateStr;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [sortedMessages]);

  const formatDateHeader = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'TODAY';
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 md:px-16 lg:px-24"
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            <div className="flex justify-center my-4">
              <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full shadow-sm font-medium">
                {formatDateHeader(group.date)}
              </span>
            </div>
            {group.messages.map((msg) => (
              <MessageBubble 
                key={msg._id || msg.id} 
                message={msg} 
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ))}
        
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}