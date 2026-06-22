Agar aap **Next.js (App Router) + MongoDB** mein **WhatsApp-like Social Chat Application** bana rahe hain, to ye professional project structure use kar sakte hain.

## Project Structure

```text
src/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.jsx
│   │   ├── register/
│   │   │   └── page.jsx
│   │   └── forgot-password/
│   │       └── page.jsx
│   │
│   ├── (main)/
│   │   ├── chat/
│   │   │   ├── page.jsx
│   │   │   └── [conversationId]/
│   │   │       └── page.jsx
│   │   │
│   │   ├── contacts/
│   │   │   └── page.jsx
│   │   │
│   │   ├── groups/
│   │   │   └── page.jsx
│   │   │
│   │   ├── status/
│   │   │   └── page.jsx
│   │   │
│   │   ├── calls/
│   │   │   └── page.jsx
│   │   │
│   │   ├── profile/
│   │   │   └── page.jsx
│   │   │
│   │   ├── settings/
│   │   │   └── page.jsx
│   │   │
│   │   └── layout.jsx
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/
│   │   │   │   └── route.js
│   │   │   ├── login/
│   │   │   │   └── route.js
│   │   │   ├── logout/
│   │   │   │   └── route.js
│   │   │   └── me/
│   │   │       └── route.js
│   │   │
│   │   ├── users/
│   │   │   ├── route.js
│   │   │   └── [id]/
│   │   │       └── route.js
│   │   │
│   │   ├── conversations/
│   │   │   ├── route.js
│   │   │   └── [id]/
│   │   │       └── route.js
│   │   │
│   │   ├── messages/
│   │   │   ├── route.js
│   │   │   └── [conversationId]/
│   │   │       └── route.js
│   │   │
│   │   ├── groups/
│   │   │   └── route.js
│   │   │
│   │   ├── upload/
│   │   │   └── route.js
│   │   │
│   │   └── status/
│   │       └── route.js
│   │
│   ├── layout.jsx
│   ├── page.jsx
│   └── globals.css
│
├── components/
│   │
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── MobileMenu.jsx
│   │   └── Header.jsx
│   │
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── chat/
│   │   ├── ChatList.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── MessageInput.jsx
│   │   ├── TypingIndicator.jsx
│   │   ├── OnlineStatus.jsx
│   │   └── EmojiPicker.jsx
│   │
│   ├── group/
│   │   ├── GroupList.jsx
│   │   ├── CreateGroup.jsx
│   │   └── GroupInfo.jsx
│   │
│   ├── status/
│   │   ├── StatusCard.jsx
│   │   └── CreateStatus.jsx
│   │
│   ├── calls/
│   │   ├── CallButton.jsx
│   │   ├── VideoCall.jsx
│   │   └── VoiceCall.jsx
│   │
│   └── common/
│       ├── Loader.jsx 
│       ├── Modal.jsx
│       ├── Button.jsx
│       └── Input.jsx
│
├── lib/
│   ├── mongodb.js
│   ├── cloudinary.js
│   ├── auth.js
│   ├── socket.js
│   └── helpers.js
│
├── models/
│   ├── User.js
│   ├── Message.js
│   ├── Conversation.js
│   ├── Group.js
│   └── Status.js
│
├── services/
│   ├── authService.js
│   ├── chatService.js
│   ├── userService.js
│   └── uploadService.js
│
├── hooks/
│   ├── useAuth.js
│   ├── useSocket.js
│   ├── useChat.js
│   └── useTheme.js
│
├── store/
│   ├── authStore.js
│   ├── chatStore.js
│   ├── userStore.js
│   └── socketStore.js
│
├── middleware.js
│
└── utils/
    ├── constants.js
    ├── formatDate.js
    ├── generateToken.js
    └── validators.js
```

## MongoDB Models

### User

```js
{
  _id,
  name,
  email,
  password,
  profilePic,
  bio,
  lastSeen,
  isOnline,
  createdAt
}
```

### Conversation

```js
{
  _id,
  participants: [],
  lastMessage,
  updatedAt
}
```

### Message

```js
{
  _id,
  sender,
  receiver,
  conversationId,
  text,
  image,
  audio,
  seen,
  createdAt
}
```

### Group

```js
{
  _id,
  groupName,
  groupImage,
  admin,
  members
}
```

### Status

```js
{
  _id,
  user,
  media,
  caption,
  expiresAt
}
```

## Development Order

1. Authentication (Login/Register)
2. MongoDB Connection
3. User Profile
4. Contacts/User Search
5. One-to-One Chat
6. Socket.IO Integration
7. Online Status
8. Typing Indicator
9. Read Receipts
10. Group Chat
11. Image/File Sharing
12. Voice Notes
13. Status/Stories
14. Audio/Video Calling
15. Notifications
16. Deployment

Ye structure production-level WhatsApp-style application ke liye scalable hai aur Next.js App Router ke saath achhi tarah kaam karega.
