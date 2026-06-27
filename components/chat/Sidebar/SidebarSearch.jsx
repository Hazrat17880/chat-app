export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="p-3">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder || "Search or start new chat"}
          value={value}
          onChange={onChange}
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
  );
}