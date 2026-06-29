import UserItem from "./UserItems"

export default function UserList({ users, selectedUser, onUserSelect, activeTab }) {
  const filteredUsers = users.filter((user) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return user.unread > 0;
    if (activeTab === "favorite") return user.favorite === true;
    if (activeTab === "groups") return user.isGroup === true;
    return true;
    console.log("your selected user are in the user list :",user);
  });


  return (
    <div className="flex-1 overflow-y-auto">
      {filteredUsers.map((user) => (
        <UserItem
          key={user.id}
          user={user}
          isSelected={selectedUser?.userId === user.userId}
          onSelect={onUserSelect}
        />
      ))}
    </div>
  );
}