# Vercel Deployment

This repo keeps the React frontend in `Frontend/`. The root `vercel.json` is configured so Vercel can deploy from the repo root without changing the project root directory. If you set Vercel's Root Directory to `Frontend`, the `Frontend/vercel.json` file provides the SPA route rewrite.

Vercel settings:

- Framework Preset: Create React App
- Install Command: `npm --prefix Frontend install`
- Build Command: `CI=false GENERATE_SOURCEMAP=false npm --prefix Frontend run build`
- Output Directory: `Frontend/build`

Required frontend environment variable:

- `REACT_APP_API_BASE_URL`: public URL of the Relay API, for example `https://your-api-host.example.com`

Do not use `http://localhost:3030` for a hosted Vercel deployment. That only works when the browser and API are both running on your local machine.
