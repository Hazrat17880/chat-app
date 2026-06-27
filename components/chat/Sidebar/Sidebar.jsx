import SidebarHeader from "./SidebarHeader";
import SearchBar from "./SidebarSearch"
import FilterTabs from "./FilterTab"
import UserList from "./UserList";

export default function Sidebar({
  isOpen,
  onClose,
  users,
  selectedUser,
  onUserSelect,
  activeTab,
  onTabChange,
  onMenuToggle,
}) {
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
        <SidebarHeader onMenuToggle={onMenuToggle} />
        <SearchBar />
        <FilterTabs activeTab={activeTab} onTabChange={onTabChange} />
        <UserList
          users={users}
          selectedUser={selectedUser}
          onUserSelect={onUserSelect}
          activeTab={activeTab}
        />
      </div>
    </>
  );
}