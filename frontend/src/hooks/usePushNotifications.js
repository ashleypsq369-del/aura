/**
 * usePushNotifications.js
 * Manages Web Push subscription lifecycle:
 *   - Registers service worker
 *   - Requests permission
 *   - Subscribes to push with VAPID key
 *   - Syncs subscription to backend
 *   - Handles unsubscribe
 */
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export default function usePushNotifications() {
  const [supported,    setSupported]    = useState(false);
  const [permission,   setPermission]   = useState('default');
  const [subscribed,   setSubscribed]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [vapidKey,     setVapidKey]     = useState('');
  const [swReg,        setSwReg]        = useState(null);

  // ── Register service worker ──────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setSupported(true);
    setPermission(Notification.permission);

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        setSwReg(reg);
        return reg.pushManager.getSubscription();
      })
      .then(sub => { if (sub) setSubscribed(true); })
      .catch(err => console.warn('[Push] SW registration failed:', err));
  }, []);

  // ── Fetch VAPID public key ────────────────────────────────────────────────
  useEffect(() => {
    if (!supported) return;
    apiClient.get('/api/notifications/vapid-public-key')
      .then(r => setVapidKey(r.data.public_key || ''))
      .catch(() => {});
  }, [supported]);

  // ── Subscribe ─────────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!supported || !swReg || !vapidKey) return false;
    setLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      // Subscribe via Push API
      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Extract keys
      const p256dhKey = sub.getKey('p256dh');
      const authKey   = sub.getKey('auth');
      const p256dh    = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)));
      const auth      = btoa(String.fromCharCode(...new Uint8Array(authKey)));

      // Send to backend
      await apiClient.post('/api/notifications/push-subscribe', {
        endpoint: sub.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
      });

      setSubscribed(true);
      return true;
    } catch (err) {
      console.error('[Push] Subscribe failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported, swReg, vapidKey]);

  // ── Unsubscribe ───────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!swReg) return;
    setLoading(true);
    try {
      const sub = await swReg.pushManager.getSubscription();
      if (sub) {
        await apiClient.delete(`/api/notifications/push-unsubscribe?endpoint=${encodeURIComponent(sub.endpoint)}`);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err);
    } finally {
      setLoading(false);
    }
  }, [swReg]);

  // ── Send test push ────────────────────────────────────────────────────────
  const sendTest = useCallback(async () => {
    try {
      const r = await apiClient.post('/api/notifications/push-test');
      return r.data;
    } catch (err) {
      throw new Error(err?.response?.data?.detail || 'Test push failed');
    }
  }, []);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe, sendTest };
}
