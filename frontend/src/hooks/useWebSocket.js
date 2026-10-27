/**
 * useWebSocket - Project Aura Real-Time Hook
 * ============================================
 * Connects to the FastAPI WebSocket endpoint with:
 * - Auto-reconnect with exponential backoff (max 30s)
 * - JWT token auth via query param
 * - Event-based subscription system
 * - React Query cache invalidation on push events
 * - Ping/pong keepalive
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import useAppStore from '../store/useAppStore';

// Derive WebSocket URL:
// - If VITE_API_URL is set (Vercel → Koyeb deployment): convert http→ws
// - Dev mode without VITE_API_URL: use Vite proxy (ws://localhost:5173 → localhost:8000)
// - Standalone (desktop, same origin): use page host
function getWsBase() {
 const apiUrl = import.meta.env.VITE_API_URL?.trim();
 if (apiUrl) {
 // Convert https://xxx.koyeb.app → wss://xxx.koyeb.app
 return apiUrl.replace(/^https/, 'wss').replace(/^http/, 'ws');
 }
 if (import.meta.env.DEV) {
 // Vite dev server proxy handles /ws → localhost:8000
 return 'ws://localhost:5173';
 }
 // Standalone / served by FastAPI - same origin
 const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
 return `${proto}://${window.location.host}`;
}
const WS_URL = getWsBase();

const MAX_RETRY_DELAY = 30000;
const BASE_RETRY_DELAY = 1000;

export default function useWebSocket() {
 const { user, isAuthenticated } = useAuth();
 const queryClient = useQueryClient();
 const setUnreadAlerts = useAppStore(s => s.setUnreadAlerts);
 const unreadAlerts = useAppStore(s => s.unreadAlerts);

 const ws = useRef(null);
 const retryDelay = useRef(BASE_RETRY_DELAY);
 const retryTimer = useRef(null);
 const listeners = useRef({}); // event → Set of callbacks
 const [connected, setConnected] = useState(false);

 const emit = useCallback((event, data) => {
 const cbs = listeners.current[event];
 if (cbs) cbs.forEach(cb => cb(data));
 }, []);

 const subscribe = useCallback((event, cb) => {
 if (!listeners.current[event]) listeners.current[event] = new Set();
 listeners.current[event].add(cb);
 return () => listeners.current[event]?.delete(cb);
 }, []);

 const send = useCallback((event, data = {}) => {
 if (ws.current?.readyState === WebSocket.OPEN) {
 ws.current.send(JSON.stringify({ event, data }));
 }
 }, []);

 const connect = useCallback(() => {
 if (!isAuthenticated || !user?.id) return;
 const token = localStorage.getItem('auth_token');
 if (!token) return;

 // Close existing connection
 if (ws.current) {
 ws.current.onclose = null; // prevent auto-reconnect on manual close
 ws.current.close();
 }

 const url = `${WS_URL}/ws/${user.id}?token=${token}`;
 const socket = new WebSocket(url);
 ws.current = socket;

 socket.onopen = () => {
 setConnected(true);
 retryDelay.current = BASE_RETRY_DELAY; // reset backoff
 console.log('[WS] Connected');
 };

 socket.onmessage = (e) => {
 try {
 const { event, data } = JSON.parse(e.data);
 handleServerEvent(event, data);
 emit(event, data);
 } catch {}
 };

 socket.onclose = (e) => {
 setConnected(false);
 if (e.code === 4001 || e.code === 4003) {
 // Auth failure (expired/invalid token) - wait for re-login then retry
 // The token will be refreshed when the user logs in again
 console.warn('[WS] Auth rejected (expired token?), will retry in 10s');
 retryTimer.current = setTimeout(connect, 10000);
 return;
 }
 // Schedule reconnect with backoff
 retryTimer.current = setTimeout(() => {
 retryDelay.current = Math.min(retryDelay.current * 2, MAX_RETRY_DELAY);
 connect();
 }, retryDelay.current);
 };

 socket.onerror = () => {
 // onclose fires after onerror, reconnect handled there
 };
 }, [isAuthenticated, user?.id, emit]);

 /** Handle server-pushed events and invalidate React Query caches */
 const handleServerEvent = useCallback((event, data) => {
 switch (event) {
 case 'new_alert':
 // Invalidate alerts queries so they refetch immediately
 queryClient.invalidateQueries({ queryKey: ['alerts'] });
 queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
 setUnreadAlerts(unreadAlerts + 1);
 // Show browser notification if supported
 if (Notification.permission === 'granted' && data.severity === 'critical') {
 new Notification('🚨 Critical Alert - Project Aura', {
 body: `${data.patient_name}: ${data.message}`,
 icon: '/favicon.svg',
 });
 }
 break;

 case 'alert_update':
 queryClient.invalidateQueries({ queryKey: ['alerts'] });
 queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
 break;

 case 'new_message':
 queryClient.invalidateQueries({ queryKey: ['conversations'] });
 if (data.conversation_id) {
 queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] });
 }
 break;

 case 'new_notification':
 queryClient.invalidateQueries({ queryKey: ['notifications'] });
 queryClient.invalidateQueries({ queryKey: ['unread-count'] });
 break;

 case 'vital_update':
 if (data.patient_id) {
 queryClient.invalidateQueries({ queryKey: ['vitals', data.patient_id] });
 queryClient.invalidateQueries({ queryKey: ['patient', data.patient_id] });
 }
 break;

 case 'patient_status':
 if (data.patient_id) {
 queryClient.invalidateQueries({ queryKey: ['patient', data.patient_id] });
 queryClient.invalidateQueries({ queryKey: ['patients-list'] });
 }
 break;

 case 'ping':
 send('pong');
 break;

 case 'connected':
 console.log(`[WS] Online users: ${data.online_users}`);
 break;

 default:
 break;
 }
 }, [queryClient, setUnreadAlerts, unreadAlerts, send]);

 // Connect on mount / when user changes - get fresh token each time
 useEffect(() => {
 if (isAuthenticated && user?.id) {
 // Small delay to ensure token is written to localStorage after login
 const t = setTimeout(() => {
 connect();
 if (Notification.permission === 'default') {
 Notification.requestPermission();
 }
 }, 500);
 return () => {
 clearTimeout(t);
 clearTimeout(retryTimer.current);
 if (ws.current) {
 ws.current.onclose = null;
 ws.current.close();
 }
 };
 } else {
 // Not authenticated - close connection
 clearTimeout(retryTimer.current);
 if (ws.current) {
 ws.current.onclose = null;
 ws.current.close();
 ws.current = null;
 }
 setConnected(false);
 }
 }, [isAuthenticated, user?.id]);

 return { connected, subscribe, send };
}
