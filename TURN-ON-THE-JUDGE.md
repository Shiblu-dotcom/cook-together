# Turn on the real judge (10 minutes, one time)

Right now the live site uses canned responses. These three steps switch on
the real AI — the judge, the chef, the witness, vision judging, all of it.
The API key never touches the code or the browser: it lives only in Vercel.

## 1. Import the repo into Vercel (~4 min)
- Go to https://vercel.com/new and sign in with GitHub
- Import **Shiblu-dotcom/cook-together** — accept the defaults, click Deploy

## 2. Add the key (~2 min)
- In the Vercel project: **Settings → Environment Variables**
- Name: `ANTHROPIC_API_KEY` — Value: your key from https://console.anthropic.com
- Save, then **Deployments → ⋯ → Redeploy** so the function picks it up

## 3. Point the game at the proxy (~2 min)
- Copy your Vercel URL (looks like `https://cook-together-xxxx.vercel.app`)
- In GitHub: **repo → Settings → Secrets and variables → Actions → Variables
  → New repository variable**
- Name: `VITE_PROXY_URL` — Value: `https://<your-vercel-url>/api/claude`
- Re-run the latest "Deploy to GitHub Pages" workflow (Actions tab → Re-run)

Done. The GitHub Pages site now calls your Vercel function, which holds the
key server-side. Cost control is built in: the model is pinned and token
counts are capped inside `api/claude.js`.

To verify: play a night — the judge's verdict should mention your actual
dish by name. Canned verdicts never do.

## Optional: the judge's real voice (+3 min)
Browser speech synthesis is the fallback; a neural voice makes the judge a
character. In the same Vercel project add a second environment variable:
- Name: `ELEVENLABS_API_KEY` — Value: your key from https://elevenlabs.io
- Redeploy. Done — the verdict, the Word, and Chef speak in the judge's
  voice; the calm night's witness gets a separate, gentler one.
- Optional: override the characters with `JUDGE_VOICE_ID` / `WITNESS_VOICE_ID`
  (any ElevenLabs voice id).
