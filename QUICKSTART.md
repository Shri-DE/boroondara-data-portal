# 🚀 Quick Start Guide - Council Agent Portal

## Step-by-Step Setup (15 minutes)

### ✅ Step 1: Install Node.js (if not already installed)

Download and install Node.js 18+ from: https://nodejs.org/

Verify installation:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### ✅ Step 2: Azure Entra ID Setup

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to**: Entra ID > App Registrations
3. **Click**: "New registration"
4. **Fill in**:
   - Name: `Council Agent Portal`
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Web > `http://localhost:3000`
5. **Click**: "Register"

6. **Note down**:
   - Application (client) ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Directory (tenant) ID: `yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy`

7. **Configure Authentication**:
   - Click "Authentication" in left menu
   - Scroll to "Implicit grant and hybrid flows"
   - ✅ Check "ID tokens (used for implicit and hybrid flows)"
   - Click "Save"

8. **Create App Roles** (Optional - for production):
   - Click "App roles" in left menu
   - Click "Create app role"
   - Create these roles:
     * Display name: `Finance Agent User`
       Value: `Agent.Finance.User`
       Allowed member types: Users/Groups
     * Display name: `Agent Admin`
       Value: `Agent.Admin`
       Allowed member types: Users/Groups
   - Click "Apply" for each

### ✅ Step 3: Setup the Project

1. **Navigate to project folder**:
```bash
cd council-agent-portal
```

2. **Install dependencies**:
```bash
npm install
```

This will take 2-3 minutes to download all packages.

3. **Create environment file**:
```bash
# Copy the template
cp .env.template .env.local

# Edit the file with your Azure credentials
# On Windows: notepad .env.local
# On Mac/Linux: nano .env.local
```

4. **Fill in `.env.local`**:
```env
REACT_APP_ENTRA_CLIENT_ID=<paste-your-client-id>
REACT_APP_TENANT_ID=<paste-your-tenant-id>
REACT_APP_REDIRECT_URI=http://localhost:3000
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

### ✅ Step 4: Run the Application

```bash
npm start
```

The browser should automatically open to `http://localhost:3000`

If not, manually open your browser and go to: http://localhost:3000

### ✅ Step 5: Test Authentication

1. Click "Sign In to Get Started"
2. You'll be redirected to Microsoft login
3. Enter your council Microsoft credentials
4. Grant permissions when prompted
5. You'll be redirected back to the portal

🎉 **Success!** You should now see the portal home page.

## ⚠️ Common Issues & Solutions

### Issue: "AADSTS50011: The reply URL specified in the request does not match"

**Solution**: 
- Go to Azure Portal > Your App Registration > Authentication
- Make sure `http://localhost:3000` is listed in "Redirect URIs"
- Make sure there's no trailing slash
- Click "Save"

### Issue: "Module not found" errors

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Port 3000 is already in use"

**Solution**:
```bash
# Kill the process using port 3000
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Or use a different port:
PORT=3001 npm start
```

### Issue: Blank page after login

**Solution**:
1. Open browser Developer Tools (F12)
2. Check Console for errors
3. Verify your Client ID and Tenant ID in `.env.local`
4. Make sure you have ID tokens enabled in Azure

## 🔧 Development Tips

### Running in VS Code

1. Open folder in VS Code
2. Install recommended extensions:
   - ESLint
   - TypeScript React code snippets
   - Prettier
3. Use integrated terminal: `Ctrl + ~` (backtick)
4. Run `npm start`

### Hot Reload

The app supports hot reload - any changes you make will automatically refresh the browser!

### Debugging

1. Open Chrome DevTools (F12)
2. Go to "Sources" tab
3. Find your file in `webpack://` > `src`
4. Set breakpoints by clicking line numbers

## 📝 Next Steps

Now that you have the frontend running:

1. **Review the code**:
   - Start with `src/App.tsx`
   - Check `src/pages/Home.tsx`
   - Look at `src/config/authConfig.ts`

2. **Customize the portal**:
   - Change colors in `Header.tsx`
   - Update the council name
   - Add your logo

3. **Set up the backend**:
   - You'll need an API backend for full functionality
   - See the main architecture document for backend setup

4. **Deploy to Azure**:
   - Build: `npm run build`
   - Deploy to Azure Static Web Apps
   - Update redirect URIs in Azure to your production URL

## 📞 Need Help?

- Check the main README.md for detailed documentation
- Review the architecture document
- Contact: it-support@council.gov.au

---

**Estimated Time**: 15 minutes  
**Difficulty**: Beginner  
**Prerequisites**: Azure subscription, Node.js
