# Debug Family Login Issue

## Changes Made

I've added console logging to help identify where the logout is happening:

### 1. AuthContext.jsx
- Logs when user is restored from localStorage
- Logs login attempts and success
- Logs when logout is called

### 2. API Client (client.js)
- Logs when 401 error triggers auto-logout
- Shows which API endpoint caused the 401
- Shows error details

## How to Test

### Step 1: Open Browser DevTools
1. Open http://localhost:5173/ in your browser
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Make sure you can see all logs (not filtered)

### Step 2: Clear Storage (Fresh Start)
1. In DevTools, go to **Application** tab
2. Click **Local Storage** → **http://localhost:5173**
3. Click "Clear All" or delete `auth_token` and `user`
4. Or just run this in the Console:
   ```javascript
   localStorage.clear()
   ```

### Step 3: Test Family Login
1. Go back to the Console tab
2. Refresh the page (F5)
3. Log in with:
   - Username: `family`
   - Password: `family123`
4. Watch the Console for log messages

### What to Look For

#### ✅ **Expected Flow (Success):**
```
[AuthContext] No saved session found
[AuthContext] Login attempt for: family
[AuthContext] Login successful: {username: "family", role: "family", ...}
```

#### ❌ **If Logging Out:**
Look for one of these:

**Option A - API Client Logout:**
```
[API Client] 401 Unauthorized - Logging out
[API Client] Request was: /api/some-endpoint
```
→ This means a specific API call is failing with 401

**Option B - AuthContext Logout:**
```
[AuthContext] Logging out user
```
→ This means something is explicitly calling logout()

**Option C - Parse Error:**
```
[AuthContext] Failed to parse saved user: ...
```
→ This means localStorage data is corrupted

## What Each Message Means

| Log Message | What It Means |
|-------------|---------------|
| `[AuthContext] User restored from localStorage` | App successfully loaded saved session |
| `[AuthContext] Login successful` | Login API call worked |
| `[API Client] 401 Unauthorized` | An API endpoint returned 401 and triggered auto-logout |
| `[AuthContext] Logging out user` | logout() function was explicitly called |

## Common Causes

### If you see 401 errors:
1. **Check which endpoint** - The log will show `Request was: /api/xxx`
2. **That endpoint might require different permissions** for family role
3. **Or the token format might be wrong** for that specific endpoint

### If you see logout without 401:
1. **Something in the React code is calling logout()**
2. **Or there's a navigation/routing issue**
3. **Or localStorage is being cleared by something**

## Next Steps After Testing

**Please share the Console output with me**, specifically:
1. All lines starting with `[AuthContext]` or `[API Client]`
2. Any red error messages
3. What you see on screen when you get logged out

This will help me pinpoint the exact cause!

## Alternative: Test with HTML Page

If the React app has issues, you can test the raw API:
1. Open `test_frontend_login.html` in your browser
2. Click "Login as Family"
3. Click "Fetch Dashboard"
4. Click "Fetch Patients"

This tests the API without React to confirm the backend is working.
