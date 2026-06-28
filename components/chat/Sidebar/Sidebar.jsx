// components/chat/Sidebar/Sidebar.jsx
import SidebarHeader from "./SidebarHeader";
import SearchBar from "./SidebarSearch";
import FilterTabs from "./FilterTab";
import UserList from "./UserList";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function Sidebar({
  isOpen,
  onClose,
  selectedUser,
  onUserSelect,
  activeTab,
  onTabChange,
  onMenuToggle,
}) {

  // Select only auth from state
  const auth = useSelector((state) => state.auth);

  // Contacts state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId = auth?.user?.id || auth?.user?._id;

  // Function to fetch contacts (can be called from parent)
  const fetchContacts = async () => {
    if (!userId) {
      console.log("No userId found");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching contacts for userId:", userId);

      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      // Check if response is OK
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Contacts API not found. Please check your API route.");
        }
        const text = await response.text();
        console.error("API response error:", text);
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();

      console.log("Friend contacts:", result);

      if (result.success) {
        setUsers(result.data || []);
      } else {
        setError(result.message || "Failed to fetch contacts");
        console.error(result.message);
      }
    } catch (error) {
      setError(error.message);
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [userId]);

  // Pass fetchContacts to SidebarHeader so it can refresh after adding contact
  const handleContactAdded = () => {
    fetchContacts(); // Refresh the contacts list
  };

  // Handle user select from header modal
  const handleUserSelectFromHeader = (user) => {
    onUserSelect(user);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed md:relative inset-y-0 left-0 z-50 w-[320px] lg:w-[360px] bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <SidebarHeader
          onMenuToggle={onMenuToggle}
          onContactAdded={handleContactAdded}
          users={users}
          loading={loading}
          error={error}
          onUserSelect={handleUserSelectFromHeader}
        />

        <SearchBar />

        <FilterTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
        />

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-red-500 text-sm mb-2">{error}</p>
              <button 
                onClick={fetchContacts}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-gray-500 text-sm">No contacts yet</p>
              <p className="text-gray-400 text-xs">Add friends to start chatting</p>
            </div>
          </div>
        ) : (
          <UserList
            users={users}
            selectedUser={selectedUser}
            onUserSelect={onUserSelect}
            activeTab={activeTab}
          />
        )}
      </div>
    </>
  );
}