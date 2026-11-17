# Deployment Guide: Production Setup

This guide provides step-by-step instructions for deploying the Dynamic Survey Application to production using:
- **Database**: MongoDB Atlas (Free Tier)
- **Backend API**: Render (or Railway)
- **Frontend SPA**: Vercel (or Netlify)

---

## 1. Step 1: Provision MongoDB Atlas Database

1. Sign in or create an account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new **Free (M0)** Cluster in your preferred region.
3. Under **Security $\rightarrow$ Database Access**:
   - Click **Add New Database User**.
   - Choose **Password** authentication.
   - Enter a username (e.g. `survey_admin`) and a secure password.
   - Grant role: **Read and write to any database**.
4. Under **Security $\rightarrow$ Network Access**:
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) so that cloud hosting providers (Render/Vercel) can connect.
5. In your cluster dashboard, click **Connect** $\rightarrow$ **Drivers** (Node.js).
6. Copy the connection string. It will look like:
   ```
   mongodb+srv://survey_admin:<PASSWORD>@cluster0.xxxx.mongodb.net/survey_app?retryWrites=true&w=majority
   ```
   Replace `<PASSWORD>` with your database user password.

---

## 2. Step 2: Deploy Backend to Render

1. Push your repository to GitHub.
2. Sign in to [render.com](https://render.com) and click **New $\rightarrow$ Web Service**.
3. Select your GitHub repository.
4. Configure the service:
   - **Name**: `survey-builder-api`
   - **Region**: Choose the region closest to your MongoDB Atlas cluster
   - **Branch**: `main`
   - **Root Directory**: Leave blank (monorepo root)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build --workspace=shared && npm run build --workspace=backend
     ```
   - **Start Command**:
     ```bash
     node backend/dist/server.js
     ```
   - **Plan**: `Free`
5. In **Environment Variables**, add:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://survey_admin:<PASSWORD>@cluster0.xxxx.mongodb.net/survey_app?retryWrites=true&w=majority
   JWT_SECRET=production_secret_key_at_least_32_characters_random_string
   JWT_EXPIRES_IN=12h
   IP_SALT=production_salt_for_ip_hash_min_16_characters
   CORS_ORIGIN=*
   SPAM_PROTECTION_ENABLED=false
   ADMIN_EMAIL=admin@aigeeks.io
   ADMIN_PASSWORD=AdminPassword123!
   ```
   *(Note: You will update `CORS_ORIGIN` to your exact frontend domain after deploying the frontend in Step 4).*
6. Click **Create Web Service**. Wait for the build and deployment to complete.
7. Test the health endpoint: `https://<YOUR_RENDER_SUBDOMAIN>.onrender.com/health` $\rightarrow$ should return `{"status":"ok"}`.

---

## 3. Step 3: Seed Production Database

To populate the initial administrator account and the demo survey ("Customer Feedback" with 25 realistic responses) directly on your live database, run this command from your local terminal:

```bash
MONGODB_URI="mongodb+srv://survey_admin:<PASSWORD>@cluster0.xxxx.mongodb.net/survey_app?retryWrites=true&w=majority" \
ADMIN_EMAIL="admin@aigeeks.io" \
ADMIN_PASSWORD="AdminPassword123!" \
npm run seed --workspace=backend
```

You should see:
```
✅ Created admin user: admin@aigeeks.io
✅ Created demo survey: Customer Feedback
✅ Inserted 25 sample responses.
🎉 Seeding successfully finished!
```

---

## 4. Step 4: Deploy Frontend to Vercel

1. Sign in to [vercel.com](https://vercel.com) and click **Add New $\rightarrow$ Project**.
2. Import your GitHub repository.
3. In **Project Configuration**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `.` (leave at root, our `vercel.json` coordinates monorepo builds)
   - **Build Command**:
     ```bash
     npm run build --workspace=shared && npm run build --workspace=frontend
     ```
   - **Output Directory**: `frontend/dist`
4. In **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://<YOUR_RENDER_SUBDOMAIN>.onrender.com/api/v1`
5. Click **Deploy**.
6. Once deployed, note your live Vercel URL (e.g. `https://survey-builder-aigeeks.vercel.app`).

---

## 5. Step 5: Lock Down Backend CORS

1. Go back to your Render Dashboard for `survey-builder-api`.
2. Go to **Environment** tab.
3. Update `CORS_ORIGIN` to:
   ```env
   CORS_ORIGIN=https://survey-builder-aigeeks.vercel.app
   ```
4. Click **Save Changes** (Render will automatically redeploy with the restricted CORS policy).

---

## 6. Post-Deployment Smoke Test Checklist

- [ ] **Health Endpoint**: Visit `https://<YOUR_API_DOMAIN>/health` $\rightarrow$ returns `{ status: "ok" }`.
- [ ] **Admin Login**: Visit `https://<YOUR_FRONTEND_DOMAIN>/login` $\rightarrow$ log in with `admin@aigeeks.io` / `AdminPassword123!`.
- [ ] **Surveys Dashboard**: Verify the "Customer Feedback" survey appears with status `published` and 25 responses.
- [ ] **Analytics View**: Click the analytics icon $\rightarrow$ verify bar charts, star rating average, and response table load.
- [ ] **Public Form**: Open the public survey URL `https://<YOUR_FRONTEND_DOMAIN>/s/<ROOT_ID>` in an incognito window or on mobile $\rightarrow$ test conditional question visibility and submit a response.
- [ ] **Real-time Count**: Verify the total response count increments in the admin dashboard.

---

## 7. Troubleshooting Common Issues

### Issue 1: CORS Error in Browser Console (`Access to fetch at ... blocked by CORS policy`)
- **Fix**: Check `CORS_ORIGIN` on Render. Ensure there are no trailing slashes in the origin URL (e.g. `https://my-app.vercel.app`, NOT `https://my-app.vercel.app/`). To allow multiple origins, separate them with commas.

### Issue 2: Render Free-Tier Cold Starts (Initial load takes 30-50s)
- **Explanation**: Render's free tier spins down web services after 15 minutes of inactivity. When a new request arrives, it spins up the container.
- **Fix**: If the frontend displays a network error on initial visit, wait 30 seconds for the container to wake up and refresh.

### Issue 3: MongoDB Atlas Connection Timeout (`MongoServerSelectionError`)
- **Fix**: Confirm that **Network Access** in MongoDB Atlas includes `0.0.0.0/0` (Allow Access from Anywhere) and that your database user credentials in `MONGODB_URI` do not contain unencoded special characters.

### Issue 4: Page Refresh on Frontend Shows 404
- **Fix**: Verify `vercel.json` exists in your repository root with the rewrite rule routing all paths to `/index.html`.
