/**
 * WebSocketContext - global real-time connection
 * ================================================
 * Wrap the app once (in App.jsx) and consume anywhere with useWS().
 * The connection is established once per session, not per component.
 */
import { createContext, useContext } from 'react';
import useWebSocket from '../hooks/useWebSocket';

const WSCtx = createContext({ connected: false, subscribe: () => () => {}, send: () => {} });

export function WebSocketProvider({ children }) {
 const ws = useWebSocket();
 return <WSCtx.Provider value={ws}>{children}</WSCtx.Provider>;
}

/** Hook to consume WebSocket anywhere */
export function useWS() {
 return useContext(WSCtx);
}
