export default function UserItem({ user, isSelected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(user)}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full shadow-sm flex-shrink-0">
  {user.avatar ? (
    <img 
      src={user.avatar} 
      alt={user.name}
      className="w-full h-full rounded-full object-cover"
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
      {user.name?.charAt(0).toUpperCase()}
    </div>
  )}
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
          <p className="text-xs text-gray-500 truncate pr-2">{user.lastMsg}</p>
          {user.unread > 0 && (
            <span className="bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
              {user.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}