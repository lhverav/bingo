import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { serverConfig } from '@/config/server';

// =============================================================================
// TYPES
// =============================================================================

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const SocketContext = createContext<SocketContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    // Use ref to check if already connected (avoids dependency on socket state)
    if (socketRef.current?.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    // If there's an existing socket that's not connected, clean it up
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    console.log('🔌 Connecting socket to', serverConfig.baseUrl);
    const newSocket = io(serverConfig.baseUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, []); // No dependencies - stable function reference

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting socket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []); // No dependencies - stable function reference

  const value: SocketContextValue = {
    socket,
    isConnected,
    connect,
    disconnect,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
