"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "../../components/chat/Sidebar/Sidebar";
import ChatHeader from "../../components/chat/ChatArea/ChatHeader";
import Messages from "../../components/chat/ChatArea/Messages"; // ✅ Fixed: was "Message"
import ChatInput from "../../components/chat/ChatArea/ChatInput";
import EmptyState from "../../components/chat/EmptyState/EmptyState"; // ✅ Fixed: was "EmptyStateMenu"
import UserDetailsModal from "../../components/chat/Modals/UserDetailsModal"; // ✅ Fixed: was "Models" and "UserDetailsModel"
import NewChatMenu from "../../components/chat/Modals/NewChatMenu"; // ✅ Fixed: was "Models"

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showMenu, setShowMenu] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "them",
      text: "Hey! Are you coming to the meeting?",
      time: "10:30 AM",
    },
    {
      id: 2,
      sender: "me",
      text: "Yes, I'm just finishing up some code 👨‍💻",
      time: "10:31 AM",
    },
    {
      id: 3,
      sender: "them",
      text: "Perfect. Don't forget to bring the UI mockups.",
      time: "10:32 AM",
    },
    {
      id: 4,
      sender: "me",
      text: "Got them right here. They look great 👍",
      time: "10:33 AM",
    },
  ]);

  const users = [
    {
      id: 1,
      name: "Alice Johnson",
      lastMsg: "Don't forget the mockups.",
      time: "10:32 AM",
      online: true,
      unread: 2,
      favorite: true,
      isGroup: false,
      avatar: "AJ",
      email: "alice@email.com",
      phone: "+1 (555) 123-4567",
    },
    {
      id: 2,
      name: "Sara Williams",
      lastMsg: "How are you?",
      time: "9:15 AM",
      online: false,
      unread: 0,
      favorite: false,
      isGroup: false,
      avatar: "SW",
    },
    {
      id: 3,
      name: "John Doe",
      lastMsg: "Let's talk later",
      time: "Yesterday",
      online: true,
      unread: 1,
      favorite: false,
      isGroup: false,
      avatar: "JD",
    },
    {
      id: 4,
      name: "Emma Brown",
      lastMsg: "See you tomorrow!",
      time: "Yesterday",
      online: false,
      unread: 0,
      favorite: true,
      isGroup: false,
      avatar: "EB",
    },
    {
      id: 5,
      name: "David Wilson",
      lastMsg: "Thanks for the help!",
      time: "Monday",
      online: true,
      unread: 0,
      favorite: false,
      isGroup: false,
      avatar: "DW",
    },
  ];

  // Simulate Auto-Reply
  useEffect(() => {
    if (!selectedUser || chatMessages[chatMessages.length - 1]?.sender !== "me")
      return;

    setIsTyping(true);
    const timer = setTimeout(() => {
      const replies = [
        "That sounds great! 👍",
        "I'll check on that right away.",
        "Haha, totally agree.",
        "Can we discuss this at 3 PM?",
        "Got it, thanks!",
        "Perfect, see you then!",
        "Let me think about that...",
        "Sure thing!",
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "them",
          text: randomReply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setIsTyping(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [chatMessages, selectedUser]);

  const handleSendMessage = (message) => {
    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: typeof message === 'string' ? message : message.text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsMobileMenuOpen(false);
    // Reset messages
    const initialMessages = [
      {
        id: 1,
        sender: "them",
        text: `Hey! It's ${user.name.split(" ")[0]}. How are you?`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];
    setChatMessages(initialMessages);
  };

  return (
    <div className="h-screen flex bg-[#f0f2f5] overflow-hidden font-sans relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        users={users}
        selectedUser={selectedUser}
        onUserSelect={handleUserSelect}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMenuToggle={() => setShowMenu(!showMenu)}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#f0f2f5]">
        <ChatHeader
          user={selectedUser}
          isTyping={isTyping}
          onBack={() => setIsMobileMenuOpen(true)}
          onUserDetails={() => setShowUserDetails(true)}
        />

        {selectedUser ? (
          <>
            <Messages messages={chatMessages} isTyping={isTyping} />
            <ChatInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Modals */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={showUserDetails}
        onClose={() => setShowUserDetails(false)}
        onMessage={() => {
          setShowUserDetails(false);
          // Focus on input
        }}
        onCall={() => {
          setShowUserDetails(false);
          // Handle call
        }}
      />

      <NewChatMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        users={users}
        onUserSelect={handleUserSelect}
      />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}