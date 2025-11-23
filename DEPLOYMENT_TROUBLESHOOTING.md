# Deployment Troubleshooting Guide

## Common Errors and Solutions

### Error: "Request timed out" or "Load failed"

**Symptoms:**
- Browser console shows: `Failed to load resource: The request timed out`
- Error message: `TypeError: Load failed`
- Deployment modal shows timeout error

**Possible Causes & Solutions:**

#### 1. Backend Server Not Running
**Check:**
```bash
# In backend directory
cd backend
# Check if server is running on port 4000
curl http://localhost:4000/api/health
```

**Solution:**
```bash
# Start the backend server
cd backend
uvicorn app.main:app --reload --port 4000
```

#### 2. Wrong Backend URL
**Check your `frontend/.env`:**
```env
VITE_BACKEND_URL=http://localhost:4000/api
```

**Solution:**
- Verify the URL matches your backend port
- Make sure it includes `/api` at the end
- Restart frontend dev server after changing `.env`

#### 3. CORS Issues
**Check backend CORS configuration in `backend/app/main.py`**

**Solution:**
- Ensure CORS middleware allows your frontend origin
- Check browser console for CORS errors

#### 4. Railway API Taking Too Long
**Symptoms:**
- Backend is running but Railway API calls timeout

**Solution:**
- The timeout is now 2 minutes (120 seconds)
- Check Railway API status: https://status.railway.app
- Verify your Railway API token is valid
- Check Railway account rate limits

#### 5. Network/Firewall Issues
**Check:**
- Firewall blocking localhost:4000
- VPN interfering with local connections
- Antivirus blocking requests

**Solution:**
- Temporarily disable firewall/VPN
- Check if other API calls work (e.g., chat feature)

### Error: "Cannot connect to backend server"

**Solution:**
1. Verify backend is running:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --port 4000
   ```

2. Test backend health endpoint:
   ```bash
   curl http://localhost:4000/api/health
   ```
   Should return: `{"status": "ok"}`

3. Check `frontend/.env`:
   ```env
   VITE_BACKEND_URL=http://localhost:4000/api
   ```

4. Restart frontend dev server after changing `.env`

### Error: "Invalid projectId format"

**Solution:**
- Save your project first (click "Save" button)
- Ensure project is saved to Supabase
- Check that projectId is a valid UUID

### Error: "Project not found"

**Solution:**
- Save your project to Supabase first
- Check Supabase connection in `frontend/.env`
- Verify Supabase is accessible

### Error: "Failed to initialize Railway client"

**Solution:**
- Verify Railway API token is correct
- Get a new token from: https://railway.app/account/tokens
- Check token hasn't expired

## Quick Diagnostic Steps

1. **Check Backend:**
   ```bash
   curl http://localhost:4000/api/health
   ```

2. **Check Frontend Config:**
   - Open browser DevTools → Console
   - Check for `VITE_BACKEND_URL` errors
   - Verify environment variables are loaded

3. **Check Network Tab:**
   - Open DevTools → Network
   - Look for failed requests to `/deploy/railway`
   - Check request URL and status code

4. **Check Backend Logs:**
   - Look at terminal where backend is running
   - Check for error messages or stack traces

5. **Test Railway API Token:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://backboard.railway.com/graphql/v2 \
        -d '{"query": "{ me { id } }"}'
   ```

## Environment Variables Checklist

### Backend (`backend/.env`)
- [ ] `PORT=4000`
- [ ] `SUPABASE_URL=...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=...`
- [ ] `GOOGLE_GEMINI_API_KEY=...`

### Frontend (`frontend/.env`)
- [ ] `VITE_BACKEND_URL=http://localhost:4000/api`
- [ ] `VITE_SUPABASE_URL=...`
- [ ] `VITE_SUPABASE_ANON_KEY=...`

## Still Having Issues?

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for detailed error messages
   - Check Network tab for failed requests

2. **Check Backend Logs:**
   - Look at terminal running backend
   - Check for Python errors or stack traces

3. **Verify Dependencies:**
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt
   
   # Frontend
   cd frontend
   npm install
   ```

4. **Test with Simple Request:**
   ```bash
   # Test backend health
   curl http://localhost:4000/api/health
   
   # Test deployment endpoint (will fail without proper data, but shows if endpoint exists)
   curl -X POST http://localhost:4000/api/deploy/railway \
        -H "Content-Type: application/json" \
        -d '{"projectId":"test","railwayToken":"test"}'
   ```

