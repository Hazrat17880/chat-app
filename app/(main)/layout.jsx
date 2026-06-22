"use client";

import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [menuView, setMenuView] = useState("main");
  const [searchUser, setSearchUser] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const messagesEndRef = useRef(null);

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

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsMobileMenuOpen(false);
    // Reset messages when switching users
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

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setMenuView("main");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="h-screen flex bg-[#f0f2f5] overflow-hidden font-sans relative">
        {/* Dark Overlay for Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR */}
        <div
          className={`fixed md:relative inset-y-0 left-0 z-50 w-[320px] lg:w-[360px] bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
            <h1 className="text-xl font-bold text-gray-800">Chats</h1>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setShowMenu(!showMenu)}
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search or start new chat"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
              />
              <svg
                className="absolute left-3 top-3 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pb-2 flex gap-2 overflow-x-auto">
            {[
              { key: "all", label: "All" },
              { key: "unread", label: "Unread" },
              { key: "favorite", label: "Favorites" },
              { key: "groups", label: "Groups" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition ${
                  activeTab === tab.key
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto">
            {users
              .filter((user) => {
                if (activeTab === "all") return true;
                if (activeTab === "unread") return user.unread > 0;
                if (activeTab === "favorite") return user.favorite === true;
                if (activeTab === "groups") return user.isGroup === true;
                return true;
              })
              .map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                      {user.avatar || user.name.charAt(0)}
                    </div>
                    {user.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-white rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">
                        {user.name}
                      </h3>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {user.time}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-xs text-gray-500 truncate pr-2">
                        {user.lastMsg}
                      </p>
                      {user.unread > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                          {user.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col bg-[#f0f2f5]">
          {/* TOP BAR / HEADER */}
          <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 shadow-sm z-10">
            {/* Mobile Back Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {selectedUser ? (
              <>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                    {selectedUser.avatar || selectedUser.name.charAt(0)}
                  </div>
                  {selectedUser.online && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-800 text-sm truncate">
                    {selectedUser.name}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {isTyping ? (
                      <span className="text-blue-500 font-medium flex items-center gap-1">
                        typing
                        <span className="flex gap-0.5">
                          <span
                            className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></span>
                          <span
                            className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></span>
                          <span
                            className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></span>
                        </span>
                      </span>
                    ) : selectedUser.online ? (
                      "Online"
                    ) : (
                      "Last seen recently"
                    )}
                  </p>
                </div>

                {/* Header Actions */}
                <div className="hidden md:flex items-center gap-1">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-9 4h8a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 5v.01M12 12v.01M12 19v.01"
                      />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 text-center">
                <p className="text-gray-600 font-medium text-sm">
                  Select a chat to start messaging
                </p>
              </div>
            )}
          </div>

          {/* MESSAGES AREA */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-16 lg:px-24">
            {selectedUser ? (
              <div className="max-w-3xl mx-auto flex flex-col gap-2">
                {/* Date Separator */}
                <div className="flex justify-center mb-4">
                  <span className="bg-white text-gray-500 text-xs px-3 py-1 rounded-lg shadow-sm font-medium">
                    TODAY
                  </span>
                </div>

                {chatMessages.map((msg) => {
                  const isMe = msg.sender === "me";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}
                    >
                      <div
                        className={`relative max-w-[75%] md:max-w-[60%] px-3.5 py-2 shadow-sm ${
                          isMe
                            ? "bg-blue-500 text-white rounded-2xl rounded-br-sm"
                            : "bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100"
                        }`}
                      >
                        <p className="text-sm leading-relaxed break-words">
                          {msg.text}
                        </p>

                        <div
                          className={`flex items-center gap-1.5 mt-1 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <span
                            className={`text-[10px] ${isMe ? "text-blue-200" : "text-gray-400"}`}
                          >
                            {msg.time}
                          </span>
                          {isMe && (
                            <svg
                              className="w-4 h-4 text-blue-200"
                              viewBox="0 0 16 15"
                              fill="currentColor"
                            >
                              <path
                                d="M11.03.476a.75.75 0 010 1.06L5.426 7.14l5.605 5.603a.75.75 0 11-1.06 1.06l-6.136-6.133a.75.75 0 010-1.061l6.136-6.134a.75.75 0 011.06 0z"
                                transform="translate(4, 0) rotate(90 4 7.5)"
                              />
                              <path
                                d="M14.53.476a.75.75 0 010 1.06L8.926 7.14l5.605 5.603a.75.75 0 11-1.06 1.06l-6.136-6.133a.75.75 0 010-1.061l6.136-6.134a.75.75 0 011.06 0z"
                                transform="translate(8, 0) rotate(90 8 7.5)"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator Bubble */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm px-4 py-3 flex gap-1.5 items-center">
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
                <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-6">
                  <svg
                    className="w-12 h-12 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-light text-gray-700 mb-2">
                  Chat App
                </h3>
                <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                  Send and receive messages instantly.
                  <br />
                  Connect with your friends in real-time.
                </p>
                <div className="mt-8 border-t border-gray-200 pt-4 w-64 text-xs text-gray-400 flex items-center justify-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  End-to-end encrypted
                </div>
              </div>
            )}
          </div>

        {/* INPUT BOX */}
{selectedUser && (
  <div className="bg-[#f0f2f5] px-4 py-3 md:px-12 lg:px-24">
    <form
      onSubmit={handleSendMessage}
      className="max-w-3xl mx-auto flex items-end gap-2 bg-white rounded-2xl px-4 py-2 shadow-md border border-gray-100"
    >
      {/* Emoji Button with Emoji Picker */}
      <div className="relative flex-shrink-0">
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => {
            // Toggle emoji picker visibility
            const picker = document.getElementById('emoji-picker');
            if (picker) {
              picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
            }
          }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        
        {/* Simple Emoji Picker */}
        <div 
          id="emoji-picker" 
          className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-[280px] hidden z-50"
          style={{ display: 'none' }}
        >
          <div className="grid grid-cols-7 gap-1">
            {['😀','😁','😂','🤣','😊','😍','🥰','😘','😗','😙','😚','🥲','😜','😝','😛','🤑','🤗','🤩','🥳','😎','🤓','🧐','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'].map((emoji, index) => (
              <button
                key={index}
                type="button"
                className="hover:bg-gray-100 rounded p-1 text-xl transition-colors"
                onClick={() => {
                  setMessageInput(prev => prev + emoji);
                  document.getElementById('emoji-picker').style.display = 'none';
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attachment Button with File Input */}
      <div className="relative flex-shrink-0">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => {
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
                file: URL.createObjectURL(file),
                fileType: file.type,
                fileName: file.name,
                fileSize: (file.size / 1024).toFixed(2) + " KB",
              };
              setChatMessages((prev) => [...prev, fileMessage]);
              
              // Show success message
              alert(`✅ File "${file.name}" attached successfully!`);
            }
            e.target.value = ""; // Reset input
          }}
          multiple
        />
        <label
          htmlFor="file-upload"
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rotate-45 cursor-pointer block"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </label>
      </div>

      {/* Text Input - Multi-line Support */}
      <textarea
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        placeholder="Type a message"
        className="flex-1 py-2.5 outline-none bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none overflow-y-auto"
        style={{
          maxHeight: "120px",
          minHeight: "42px",
          lineHeight: "1.5",
        }}
        rows={1}
        onKeyDown={(e) => {
          // Send message on Enter (without Shift)
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (messageInput.trim()) {
              handleSendMessage(e);
            }
          }
        }}
        onInput={(e) => {
          // Auto-resize textarea
          const target = e.target;
          target.style.height = "auto";
          target.style.height = Math.min(target.scrollHeight, 120) + "px";
        }}
        autoFocus
      />

      {/* Send / Mic Button */}
      <button
        type="submit"
        disabled={!messageInput.trim()}
        className="p-2 text-gray-400 hover:text-blue-500 disabled:text-gray-300 transition-colors flex-shrink-0"
      >
        {messageInput.trim() ? (
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </button>
    </form>
  </div>
)}
        </div>
      </div>

      {/* New Chat Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute top-0 left-0 w-[358px] h-screen bg-white shadow-xl border-r border-gray-200 z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setMenuView("main");
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {menuView === "main" ? (
                <h2 className="text-lg font-semibold text-gray-800">New Chat</h2>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMenuView("main")}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h2 className="text-lg font-semibold text-gray-800">
                    New Contact
                  </h2>
                </div>
              )}
            </div>

            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18 8a3 3 0 00-6 0v1H9a2 2 0 00-2 2v5a2 2 0 002 2h9a2 2 0 002-2v-5a2 2 0 00-2-2h-1V8z"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search name or number..."
              className="w-full px-4 py-2 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {menuView === "main" && (
              <>
                {/* Actions */}
                <div className="py-2 border-b border-gray-100">
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition">
                    <span className="text-xl">👥</span>
                    <span className="text-sm font-medium">New Group</span>
                  </button>

                  <button
                    onClick={() => setMenuView("newContact")}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition"
                  >
                    <span className="text-xl">➕</span>
                    <span className="text-sm font-medium">New Contact</span>
                  </button>

                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition">
                    <span className="text-xl">🌐</span>
                    <span className="text-sm font-medium">New Community</span>
                  </button>
                </div>

                {/* Contacts */}
                <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  Contacts on ChatApp
                </div>

                {users.map((user, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                    onClick={() => {
                      handleUserSelect(user);
                      setShowMenu(false);
                      setMenuView("main");
                    }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.avatar || user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                ))}
              </>
            )}

            {menuView === "newContact" && (
              <div className="p-3">
                <input
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  type="text"
                  placeholder="Search users..."
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />

                <div className="mt-3 space-y-1">
                  {users
                    .filter((u) =>
                      u.name.toLowerCase().includes(searchUser.toLowerCase())
                    )
                    .map((user, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                        onClick={() => {
                          handleUserSelect(user);
                          setShowMenu(false);
                          setMenuView("main");
                          setSearchUser("");
                        }}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.avatar || user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">
                            {user.online ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS Animations */}
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

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c7cd;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8b0b8;
        }
      `}</style>
    </>
  );
}