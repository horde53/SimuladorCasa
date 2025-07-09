# 🚀 Supabase Setup Guide for Casa Programada

## 📋 Prerequisites
- Supabase account (free tier available)
- Your static website files

## 🔧 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub/Google
4. Click "New Project"
5. Choose organization and fill:
   - **Name**: `casa-programada`
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to your users
6. Click "Create new project"

## 🗄️ Step 2: Create Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the content from `supabase/migrations/create_simulacoes_table.sql`
4. Click "Run" to execute the migration
5. Verify the table was created in **Table Editor**

## 🔑 Step 3: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NI...`)

## ⚙️ Step 4: Configure Your Static Site

1. Open `js/supabase-config.js`
2. Replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
    // Replace with your actual Project URL
    URL: 'https://your-project-id.supabase.co',
    
    // Replace with your actual anon key
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    
    // Enable Supabase
    ENABLED: true
};
```

## 🚀 Step 5: Deploy Your Static Site

Upload all files to your shared hosting:
- All HTML files
- All CSS files  
- All JS files (including the new Supabase files)
- Images folder
- supabase folder (for reference)

## ✅ Step 6: Test the Integration

1. Visit your website
2. Fill out a simulation form
3. Check browser console for "✅ Saved to Supabase successfully"
4. Go to Supabase dashboard → **Table Editor** → **simulacoes**
5. Verify your simulation data appears

## 🔒 Security Features

- **Row Level Security (RLS)** enabled
- **Public insert**: Anyone can create simulations
- **Authenticated read**: Only authenticated users (admin) can view data
- **No sensitive data exposure**: Only simulation data is stored

## 📊 Admin Panel Features

The admin panel will automatically:
- ✅ Try Supabase first, fallback to local storage
- ✅ Show combined statistics from both sources
- ✅ Export data from Supabase when available
- ✅ Display connection status

## 🔄 Fallback System

If Supabase is unavailable:
- ✅ Automatically falls back to local IndexedDB storage
- ✅ No interruption to user experience
- ✅ Data is preserved locally
- ✅ Admin panel continues to work

## 🛠️ Troubleshooting

### "Supabase not initialized" error:
1. Check your URL and key in `supabase-config.js`
2. Ensure `ENABLED: true`
3. Check browser console for connection errors

### CORS errors:
1. Supabase automatically handles CORS for web apps
2. If issues persist, check your domain in Supabase settings

### Database connection issues:
1. Verify your project is not paused (free tier pauses after 1 week inactivity)
2. Check Supabase status page
3. Verify your API key hasn't expired

## 💡 Benefits of This Setup

- ✅ **Static hosting compatible**: No server required
- ✅ **Automatic fallback**: Works even if Supabase is down
- ✅ **Real-time data**: All simulations saved to cloud database
- ✅ **Admin dashboard**: View and manage all simulations
- ✅ **Export functionality**: Download all data as JSON
- ✅ **Scalable**: Handles thousands of simulations
- ✅ **Free tier**: Up to 50,000 monthly active users

## 📈 Next Steps

After setup, you can:
1. Monitor usage in Supabase dashboard
2. Set up email notifications for new simulations
3. Create additional admin users
4. Add more advanced analytics
5. Implement data backup strategies

---

**Need help?** Check the browser console for detailed error messages or contact support.