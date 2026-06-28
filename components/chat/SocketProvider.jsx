// components/chat/SocketProvider.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useSelector } from 'react-redux';

export default function SocketProvider({ children }) {
  const auth = useSelector((state) => state.auth);
  const userId = auth?.user?.id || auth?.user?._id;
  const [socketInitialized, setSocketInitialized] = useState(false);

  useEffect(() => {
    // Initialize socket connection when user is logged in
    if (userId && !socketInitialized) {
      // The useSocket hook will handle connection
      setSocketInitialized(true);
    }
  }, [userId, socketInitialized]);

  return <>{children}</>;
}