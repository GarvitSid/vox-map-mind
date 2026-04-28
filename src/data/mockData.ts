// Mock data layer — structured to swap in Supabase later.
export type VoiceNote = {
  id: string;
  title: string;
  duration: string;
  createdAt: string; // ISO
  preview: string;
};

export type MindMapNode = {
  id: string;
  label: string;
  kind: "root" | "idea" | "task";
  x: number;
  y: number;
};

export type MindMapEdge = { id: string; source: string; target: string };

export type MindMap = {
  noteId: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
};

export const mockNotes: VoiceNote[] = [
  { id: "n1", title: "Q3 Product Strategy", duration: "4:12", createdAt: "2026-04-26T09:14:00Z", preview: "Three pillars for next quarter…" },
  { id: "n2", title: "Brand voice exploration", duration: "2:48", createdAt: "2026-04-25T18:02:00Z", preview: "Warm, confident, a little playful…" },
  { id: "n3", title: "Onboarding redesign ideas", duration: "6:31", createdAt: "2026-04-24T11:40:00Z", preview: "Cut the tour, lead with value…" },
  { id: "n4", title: "Investor update outline", duration: "3:05", createdAt: "2026-04-22T15:21:00Z", preview: "Highlight retention and AI margin…" },
  { id: "n5", title: "Weekend essay draft", duration: "8:17", createdAt: "2026-04-20T08:55:00Z", preview: "On thinking out loud…" },
];

export const mockMindMap: MindMap = {
  noteId: "n1",
  nodes: [
    { id: "1", label: "Q3 Product Strategy", kind: "root", x: 0, y: 0 },
    { id: "2", label: "Activation", kind: "idea", x: -260, y: -120 },
    { id: "3", label: "Retention", kind: "idea", x: 260, y: -120 },
    { id: "4", label: "Monetization", kind: "idea", x: 0, y: 180 },
    { id: "5", label: "Rework onboarding flow", kind: "task", x: -420, y: -260 },
    { id: "6", label: "Add aha-moment metric", kind: "task", x: -100, y: -260 },
    { id: "7", label: "Weekly digest emails", kind: "task", x: 420, y: -260 },
    { id: "8", label: "Pro tier with AI quota", kind: "task", x: 200, y: 320 },
    { id: "9", label: "Annual discount test", kind: "task", x: -200, y: 320 },
  ],
  edges: [
    { id: "e1-2", source: "1", target: "2" },
    { id: "e1-3", source: "1", target: "3" },
    { id: "e1-4", source: "1", target: "4" },
    { id: "e2-5", source: "2", target: "5" },
    { id: "e2-6", source: "2", target: "6" },
    { id: "e3-7", source: "3", target: "7" },
    { id: "e4-8", source: "4", target: "8" },
    { id: "e4-9", source: "4", target: "9" },
  ],
};

// Auth/data interface — swap implementation with Supabase later.
export const dataService = {
  async listNotes(): Promise<VoiceNote[]> { return mockNotes; },
  async getMindMap(noteId: string): Promise<MindMap> {
    return { ...mockMindMap, noteId };
  },
};
