// components/chat/Sidebar/SidebarHeader.jsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

export default function SidebarHeader({ 
  onMenuToggle, 
  user, 
  users = [], 
  onContactAdded,
  onUserSelect 
}) {
  const router = useRouter();
  const auth = useSelector((state) => state.auth);
  

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // current login user id
  const userId = auth?.user?.id || auth?.user?._id;

  // get the login user data and show in the profile
  const [loginUserData, setLoginUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProfileClick = () => {
    if (loginUserData?._id) {
      router.push(`/profile?userId=${loginUserData._id}`);
    }
  };

  // Helper function to get avatar display
  const getAvatarDisplay = () => {
    if (!loginUserData) {
      return { type: 'initials', value: 'U', name: 'User' };
    }
    
    const username = loginUserData.username || 'User';
    const avatar = loginUserData.avatar;
    const firstChar = username.charAt(0).toUpperCase();
    
    if (avatar && avatar.length > 1 && avatar !== firstChar) {
      return { type: 'image', value: avatar, name: username };
    }
    
    return { type: 'initials', value: firstChar, name: username };
  };

  // Get user status
  const getUserStatus = () => {
    if (!loginUserData) return 'offline';
    return loginUserData.online ? 'online' : 'offline';
  };

  // get login user data 
  useEffect(() => {
    const getUserData = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/get-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setLoginUserData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch user.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      getUserData();
    }
  }, [userId]);

  // State for creating new contact
  const [showContactModal, setShowContactModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState("");

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Use the users prop from Sidebar for the modal list
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // when a user wants to create or add to list the new user
  const handleAddContact = async () => {
    // 1️⃣ Validate inputs
    if (!phoneNumber || !contactName) {
      setError("Please fill in all fields");
      return;
    }

    // 2️⃣ Show loading state
    setIsLoading(true);
    setError("");

    try {
      // 4️⃣ Make API call
      const response = await fetch("/api/new-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          phoneNumber: phoneNumber.trim(),
          customName: contactName.trim(),
        }),
      });

      const result = await response.json();

      // 5️⃣ Handle response
      if (response.ok && result.success) {
        // ✅ Success - Contact added
        setContacts((prev) => [result.data.contact, ...prev]);

        setPhoneNumber("");
        setContactName("");
        setError("");

        setShowContactModal(false);

        setShowSuccessMessage(
          `${result.data.contact.customName} added successfully 🎉`
        );

        // 🔥 Call this to refresh the contacts list in Sidebar
        if (onContactAdded) {
          onContactAdded();
        }
      } else {
        // ❌ Error from backend
        setError(result.message || "Failed to add contact");

        if (result.message?.includes("not registered")) {
          setError("This phone number is not registered in the app");
        } else if (result.message?.includes("already exists")) {
          setError("This contact is already in your list");
        } else if (result.message?.includes("yourself")) {
          setError("You cannot add yourself as a contact");
        }
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user selection from modal
  const handleUserClick = (user) => {
    setShowCreateModal(false);
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  // Get avatar display data
  const avatarDisplay = getAvatarDisplay();
  const isOnline = getUserStatus() === 'online';

  return (
    <>
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={handleProfileClick}
            className="relative focus:outline-none group"
          >
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
            ) : avatarDisplay.type === 'image' ? (
              <img
                src={avatarDisplay.value}
                alt={avatarDisplay.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 group-hover:border-indigo-500 transition-colors"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const parent = e.target.parentElement;
                  const div = document.createElement('div');
                  div.className = 'w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg font-semibold border-2 border-gray-200 group-hover:border-indigo-500 transition-colors';
                  div.textContent = loginUserData?.username?.charAt(0).toUpperCase() || 'U';
                  parent.appendChild(div);
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg font-semibold border-2 border-gray-200 group-hover:border-indigo-500 transition-colors">
                {avatarDisplay.value}
              </div>
            )}
            
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </button>
          <h1 className="text-xl font-bold text-gray-800">Chats</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={onMenuToggle}
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                New Conversation
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowContactModal(true);
                }}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-indigo-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700 mt-1">
                  Contact
                </span>
              </button>
              <button
                onClick={() => {
                  console.log("Creating new group");
                  setShowCreateModal(false);
                }}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-green-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700 mt-1">
                  Group
                </span>
              </button>
              <button
                onClick={() => {
                  console.log("Creating new channel");
                  setShowCreateModal(false);
                }}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-purple-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg
                    className="w-6 h-6 text-purple-600"
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
                </div>
                <span className="text-xs font-medium text-gray-700 mt-1">
                  Channel
                </span>
              </button>
            </div>

            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id || user.userId || user._id}
                    onClick={() => handleUserClick(user)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      {user.avatarUrl || user.avatar ? (
                        <img
                          src={user.avatarUrl || user.avatar}
                          alt={user.name || user.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            const div = document.createElement('div');
                            div.className = 'w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold';
                            div.textContent = (user.name || user.username || 'U').charAt(0).toUpperCase();
                            parent.appendChild(div);
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      {user.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-800">
                        {user.name || user.username}
                      </p>
                      <p className="text-xs text-gray-500">{user.email || user.phone}</p>
                    </div>
                    {user.online && (
                      <span className="text-xs text-green-500 font-medium">
                        Online
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-gray-500">No contacts found</p>
                  <p className="text-xs text-gray-400 mt-1">Add a contact to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-white text-2xl font-bold">
                    Add New Contact
                  </h2>
                  <p className="text-indigo-100 text-sm">
                    Enter details to add a new contact
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setPhoneNumber("");
                    setContactName("");
                    setError("");
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Enter contact name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-xs text-blue-700">
                    The contact will be added to your list and you can start
                    chatting immediately.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setPhoneNumber("");
                    setContactName("");
                    setError("");
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContact}
                  disabled={!phoneNumber || !contactName || isLoading}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    phoneNumber && contactName && !isLoading
                      ? "bg-indigo-500 text-white hover:bg-indigo-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    "Add Contact"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-6 right-6 z-[100] animate-bounce">
          <div className="bg-green-500 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px]">
            <div className="bg-white rounded-full p-1">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold">Success</h3>
              <p className="text-sm text-green-100">{showSuccessMessage}</p>
            </div>

            <button
              onClick={() => setShowSuccessMessage("")}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}