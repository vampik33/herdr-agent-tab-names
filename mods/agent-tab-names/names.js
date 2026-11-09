// Which tabs to rename after their agent's title. Pure, so it runs under node --test too.

// Agents put a spinner or status glyph before their title ("⠂ Fix login", "✳ Fix login").
export const clean = (s) => (s ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();

// The pane's title when it says what the agent is doing: not its program's name,
// a path or user@host (what a shell sets), else null.
export function telling(pane) {
  const title = clean(pane.title);
  const program = pane.program ?? {};
  if (!title || title === program.name || title.toLowerCase() === program.key?.toLowerCase()) return null;
  // Paths before clean(), which would strip their leading ~ or /.
  if (/^[~/]|^[A-Za-z]:\\/.test((pane.title ?? "").trim()) || title.includes("@")) return null;
  return title;
}

// tabs: TabInfo[] of machines whose layout is ready; panes: panes(); owned: {tabId: [names]},
// the names this mod gave each tab (two while a rename is in flight). A tab someone else
// named keeps its name for good; one nobody named, or one we named, follows the title of
// its first agent pane that has a telling one.
// Returns the renames to run and the new `owned`; with keep, entries for tabs not in
// `tabs` are carried over (their machine may just be unavailable).
export function plan(tabs, panes, owned, { keep = false } = {}) {
  const titles = new Map();
  for (const p of panes) {
    if (titles.has(p.tab) || !p.terminal || !(p.program?.agent || p.status)) continue;
    const title = telling(p);
    if (title) titles.set(p.tab, title);
  }

  const renames = [];
  const next = keep ? { ...owned } : {};
  for (const tab of tabs) {
    delete next[tab.id];
    const ours = owned[tab.id] ?? [];
    if (tab.named && !ours.includes(tab.name)) continue;
    const title = titles.get(tab.id);
    if (title && title !== tab.name) {
      renames.push({ id: tab.id, name: title });
      // Keep the current name ours too: if the rename fails, the next tick retries it.
      next[tab.id] = tab.named ? [tab.name, title] : [title];
    } else if (tab.named) {
      next[tab.id] = [tab.name];
    }
  }
  return { renames, owned: next };
}
