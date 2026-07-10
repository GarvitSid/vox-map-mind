
<div align="center">
  <img src="src/assets/voxnode-mark.png" width="80" height="80" alt="VoxNode Logo">
  
  # VoxNode
  **Speak your mind. See your thoughts.**
  
  [![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
  [![TanStack Start](https://img.shields.io/badge/TanStack-Start-coral.svg)](https://tanstack.com/start)
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-47C78E.svg)](https://supabase.com/)
  

  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="https://vox-map-mind.lovable.app">Deployment</a>
  </p>
</div>

## 🧠 What is VoxNode?

VoxNode is a modern web application that transforms unstructured voice memos into interactive, visual mind maps in real-time. 

Built for neurodivergent thinkers, brainstormers, and visual learners, VoxNode removes the friction of formatting and typing. You just speak, and our AI pipeline transcribes, structures, and lays out your thoughts into a draggable node graph containing your core ideas and actionable tasks.
<a id="features"></a>
## ✨ Features

- **🎙️ Friction-Free Voice Capture:** Speak naturally. The app uses the native Web Speech API to capture your brainstorms.
- **🤖 AI-Powered Structuring:** Uses Gemini 2.5 Flash (via Edge Functions) to intelligently extract parent topics, child ideas, and actionable next steps from raw transcripts.
- **🗺️ Interactive Node Canvas:** Powered by React Flow and Dagre. Drag, edit, add, or delete nodes dynamically. Node positions are auto-saved to the cloud.
- **📤 Universal Export:** Export your mind maps as high-resolution PNGs or structured Markdown files to drop straight into Notion, Obsidian, or Jira.
- **🔐 Secure & Private:** Full authentication flow (Email + Google OAuth) and Row Level Security (RLS) ensures your thoughts belong only to you.
- **⚡ Edge Rendered:** Server-Side Rendering (SSR) via TanStack Start, built to be deployed on Cloudflare Workers for global low-latency performance.
<a id="tech-stack"></a>
## 🛠️ Tech Stack

**Frontend:**
- [React 19](https://react.dev/)
- [TanStack Start & Router](https://tanstack.com/router) (SSR & Routing)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- [React Flow](https://reactflow.dev/) (Canvas) + [Dagre](https://github.com/dagrejs/dagre) (Auto-layout)

**Backend & Data:**
- [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- Supabase Edge Functions (Deno)

**AI Pipeline:**
- Google Gemini 2.5 Flash (via Lovable AI Gateway)

**Deployment:**
- Cloudflare Workers (`wrangler`)
<a id="architecture"></a>
## 🏗️ Architecture & Data Flow

1. **Input:** User hits record. Audio is captured via `MediaRecorder` and transcribed live via the browser's Web Speech API.
2. **Storage:** The raw `.webm` audio blob is securely uploaded to Supabase Storage.
3. **Processing:** The transcript is sent to a Supabase Edge Function (`generate-mindmap`). The function prompts an LLM to return strict JSON detailing the `root`, `ideas`, and `tasks`. *(If the AI fails, a keyword-extraction fallback ensures the app keeps working).*
4. **Layout:** The frontend receives the JSON and uses the `Dagre` algorithm to calculate mathematical X/Y coordinates for the nodes.
5. **Persistence:** Nodes and Edges are saved to PostgreSQL. Subsequent drag-and-drop actions by the user are debounced and synced to the database.

---
<a id="getting-started"></a>
## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v20+)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Supabase Project

### 1. Clone the repository
```
git clone https://github.com/GarvitSid/vox-map-mind.git
cd voxnode
npm install
```
### 2. Set up Supabase locally

Start the local Supabase development environment:

```
supabase start
```
This will apply the migrations located in supabase/migrations/ and start your local database, auth, and storage services.
### 3. Environment Variables

Create a .env file in the root directory and populate it with your Supabase credentials (provided by supabase start or your cloud project):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Required for server-side auth middleware
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```
### 4. Run the AI Edge Function

To run the mind map generator locally, you need an AI API key.

```
# Create a .env file inside the supabase/functions directory
echo "LOVABLE_API_KEY=your_api_key_here" > supabase/functions/.env

# Serve the function locally
supabase functions serve generate-mindmap --env-file supabase/functions/.env
```
5. Start the Frontend
```
npm run dev
```
Visit http://localhost:3000 to start mapping your thoughts!

🌍 Deployment
VoxNode requires a two-part deployment: the Supabase Backend and the Cloudflare Frontend.
1. Deploy the Backend (Supabase)
Link your local project to your live Supabase project:
```
supabase link --project-ref <your-project-id>
supabase db push
supabase functions deploy generate-mindmap
supabase secrets set LOVABLE_API_KEY=your_api_key_here
```
2. Deploy the Frontend (Cloudflare Workers)
Ensure you have set your SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in your Cloudflare environment variables. Then deploy using Wrangler:
```
npx wrangler deploy
```
🗺️ Roadmap / Future Features
While the application is fully functional, development is ongoing. Upcoming features include:

Audio Playback UI: Add an audio player to the dashboard to listen back to original voice recordings stored in Supabase.

Offline Mode: Local-first caching using PWA technologies.

Multiplayer: Real-time collaborative mind mapping using Supabase Realtime.

Custom Node Colors: Allow users to tag and color-code nodes manually.

Built with ❤️ by [Garvit Singh] - Transforming the way we think.
