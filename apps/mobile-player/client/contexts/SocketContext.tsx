import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { serverConfig } from '@/config/server';
import { socketEventStream } from '@/services/socketEventStream';

// =============================================================================
// TYPES
// =============================================================================

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;  // Force fresh connection, clearing all listeners
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
      extraHeaders: {
        "ngrok-skip-browser-warning": "true",
      },
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

    // Initialize RxJS event stream with the socket
    socketEventStream.init(newSocket);
  }, []); // No dependencies - stable function reference

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting socket');
      // Clean up RxJS event stream
      socketEventStream.cleanup();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []); // No dependencies - stable function reference

  // Force a fresh connection - disconnect existing socket and create new one
  // This clears ALL listeners and server-side state
  const reconnect = useCallback(() => {
    console.log('🔌 Reconnecting socket (fresh connection)');

    // Clean up RxJS event stream first
    socketEventStream.cleanup();

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Create fresh socket
    const newSocket = io(serverConfig.baseUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      extraHeaders: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected (fresh):', newSocket.id);
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

    // Initialize RxJS event stream with the fresh socket
    socketEventStream.init(newSocket);
  }, []);

  const value: SocketContextValue = {
    socket,
    isConnected,
    connect,
    disconnect,
    reconnect,
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
