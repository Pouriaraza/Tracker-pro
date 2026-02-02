# Deployment & Maintenance Guide

## Live URLs
- **Primary**: https://site-tracker-7xev4lq0x-pouriarazas-projects.vercel.app
- **Alias**: https://site-tracker-theta.vercel.app

## Deployment Status
✅ **Deployed to Vercel** (February 2, 2026)
- Project: `site-tracker`
- Team: pouriarazas-projects
- Branch: main

## How to Update / Redeploy

### Option A: Using Git Push (Recommended)
1. Clone or navigate to your local repo:
   ```powershell
   cd 'C:\Users\pouria\Desktop\Tracker'
   ```

2. Make changes locally and test:
   ```powershell
   npm run dev
   ```

3. Commit and push to GitHub:
   ```powershell
   git add .
   git commit -m "Your message here"
   git push origin main
   ```
   Vercel will automatically rebuild and deploy.

### Option B: Manual Vercel CLI Deploy
```powershell
cd 'C:\Users\pouria\Desktop\Tracker'
npx vercel --prod
```

## Local Development
```powershell
npm install
npm run dev
```
Visit http://localhost:3000

## Project Structure
```
├── pages/
│   ├── _app.js          (App wrapper with global styles)
│   ├── index.js         (Home page)
│   ├── login.js         (Login page)
│   ├── signup.js        (Signup page)
│   └── dashboard.js     (Dashboard placeholder)
├── components/
│   ├── Hero.js          (Hero section)
│   └── FeatureCard.js   (Feature card component)
├── styles/
│   └── globals.css      (Global Tailwind styles)
├── package.json
├── next.config.js
├── tailwind.config.cjs
└── postcss.config.cjs
```

## Environment Variables (if needed)
Create a `.env.local` file in the root for local development:
```
NEXT_PUBLIC_API_URL=https://your-api.com
```

For production secrets, add them in Vercel Dashboard:
https://vercel.com/pouriarazas-projects/site-tracker/settings/environment-variables

## Build & Optimize
- Build locally: `npm run build`
- Start production server: `npm start`
- Next.js auto-optimizes images and code splitting.

## Security Notes
1. ✅ Vercel token used for deployment — **revoke it** at https://vercel.com/account/tokens
2. Never commit `.env.local` or sensitive credentials to Git.
3. Use Vercel's environment variable panel for secrets.

## Future Enhancements
- [ ] Connect backend API (Supabase, Firebase, or custom Node.js)
- [ ] Add authentication (NextAuth.js, Auth0, or Firebase Auth)
- [ ] Implement real spreadsheet feature
- [ ] Add charts/analytics (Recharts, Chart.js)
- [ ] Multilingual support (i18n)

## Troubleshooting

### Build fails locally
```powershell
npm run build
# Check for errors in the output. Most common: missing dependencies.
npm install
```

### Port 3000 already in use
```powershell
npm run dev -- -p 3001
# or use a different port
```

### Vercel deployment fails
- Check build logs at: https://vercel.com/pouriarazas-projects/site-tracker
- Ensure all dependencies are in `package.json`
- Verify Node.js version matches (defaults to 18.x on Vercel)

## Support
For questions or issues, refer to:
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs
- Tailwind Docs: https://tailwindcss.com/docs
