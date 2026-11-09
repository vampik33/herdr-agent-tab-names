// Names each tab after its agent's title ("Herdr file-open mod"), as the agents list shows it.
// Draws nothing: dock it as a floating block (see README). A tab you name yourself stays yours.

import { View, div } from "gpui-kit";
import { machines, panes, run, setShared, shared, spaces } from "herdr";
import { plan } from "./names.js";

const OWNED = "agent-tab-names.owned";
const EVERY_MS = 1000;

export default class AgentTabNames extends View {
  init(_props, cx) {
    cx.timer.every(EVERY_MS, () => this.tick());
  }

  tick() {
    const all = machines();
    const ready = new Set(all.filter((m) => m.layout === "ready").map((m) => m.name));
    // Renames fail while a machine's layout is unavailable: leave its tabs alone till it's back.
    const tabs = spaces().flatMap((s) => (ready.has(s.machine) ? s.tabs : []));
    const owned = shared(OWNED) ?? {};
    const next = plan(tabs, panes(), owned, { keep: ready.size < all.length });
    for (const r of next.renames) {
      try {
        run("tab.rename", r);
      } catch (e) {
        console.log(`agent-tab-names: tab.rename ${r.id}: ${e}`);
      }
    }
    // Every setShared re-renders every mod: only on change.
    if (JSON.stringify(next.owned) !== JSON.stringify(owned)) setShared(OWNED, next.owned);
  }

  render() {
    return div();
  }
}
