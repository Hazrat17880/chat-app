const tabs = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "favorite", label: "Favorites" },
  { key: "groups", label: "Groups" },
];

export default function FilterTabs({ activeTab, onTabChange }) {
  return (
    <div className="px-3 pb-2 flex gap-2 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
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
  );
}