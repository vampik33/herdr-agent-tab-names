import { test } from "node:test";
import assert from "node:assert/strict";
import { clean, plan, telling } from "../mods/agent-tab-names/names.js";

const CLAUDE = { key: "claude", name: "Claude Code", agent: true };
const ZSH = { key: "shell", name: "zsh", agent: false };
const tab = (id, name, named = false) => ({ id, name, named });
const pane = (tab, title, program = CLAUDE, extra = {}) => ({ tab, terminal: `t-${tab}-${title}`, title, program, status: program.agent ? "idle" : null, ...extra });

test("clean strips spinner and status glyphs", () => {
  assert.equal(clean("⠂ Fix login"), "Fix login");
  assert.equal(clean("✳ Herdr file-open mod"), "Herdr file-open mod");
  assert.equal(clean(null), "");
});

test("telling skips program names, paths and user@host", () => {
  assert.equal(telling(pane("a", "✳ Claude Code")), null);
  assert.equal(telling(pane("a", "claude")), null);
  assert.equal(telling(pane("a", "~/src/repo")), null);
  assert.equal(telling(pane("a", "/home/me")), null);
  assert.equal(telling(pane("a", "C:\\Users\\me")), null);
  assert.equal(telling(pane("a", "me@host: ~")), null);
  assert.equal(telling(pane("a", "")), null);
  assert.equal(telling(pane("a", "⠐ Fix login")), "Fix login");
});

test("an unnamed tab takes its agent's title", () => {
  const r = plan([tab("a", "2")], [pane("a", "✳ Fix login")], {});
  assert.deepEqual(r.renames, [{ id: "a", name: "Fix login" }]);
  assert.deepEqual(r.owned, { a: ["Fix login"] });
});

test("a tab we named follows the title", () => {
  const r = plan([tab("a", "Fix login", true)], [pane("a", "Add tests")], { a: ["Fix login"] });
  assert.deepEqual(r.renames, [{ id: "a", name: "Add tests" }]);
  assert.deepEqual(r.owned, { a: ["Fix login", "Add tests"] });
});

test("a landed rename collapses to the one name", () => {
  const r = plan([tab("a", "Add tests", true)], [pane("a", "Add tests")], { a: ["Fix login", "Add tests"] });
  assert.deepEqual(r.renames, []);
  assert.deepEqual(r.owned, { a: ["Add tests"] });
});

test("a failed rename is retried and the tab stays ours", () => {
  const r = plan([tab("a", "Fix login", true)], [pane("a", "Add tests")], { a: ["Fix login", "Add tests"] });
  assert.deepEqual(r.renames, [{ id: "a", name: "Add tests" }]);
  assert.deepEqual(r.owned, { a: ["Fix login", "Add tests"] });
});

test("a tab someone else named is never touched, and forgotten", () => {
  const r = plan([tab("a", "mine", true)], [pane("a", "Fix login")], { a: ["Fix login"] });
  assert.deepEqual(r.renames, []);
  assert.deepEqual(r.owned, {});
  const fresh = plan([tab("b", "mine", true)], [pane("b", "Fix login")], {});
  assert.deepEqual(fresh.renames, []);
});

test("a tab reset to its number is taken again", () => {
  const r = plan([tab("a", "1")], [pane("a", "Fix login")], {});
  assert.deepEqual(r.renames, [{ id: "a", name: "Fix login" }]);
});

test("when the agent leaves, the tab keeps its name", () => {
  const r = plan([tab("a", "Fix login", true)], [pane("a", "~/src", ZSH)], { a: ["Fix login"] });
  assert.deepEqual(r.renames, []);
  assert.deepEqual(r.owned, { a: ["Fix login"] });
});

test("shells, mod panes and boring titles never name a tab", () => {
  const panes = [
    pane("a", "vim notes.md", ZSH),
    { tab: "a", terminal: null, mod: "files", title: "files", program: {}, status: null },
    pane("a", "✳ Claude Code"),
  ];
  const r = plan([tab("a", "1")], panes, {});
  assert.deepEqual(r.renames, []);
  assert.deepEqual(r.owned, {});
});

test("the first agent with a telling title wins", () => {
  const panes = [pane("a", "✳ Claude Code"), pane("a", "Second agent"), pane("a", "Third agent")];
  assert.deepEqual(plan([tab("a", "1")], panes, {}).renames, [{ id: "a", name: "Second agent" }]);
});

test("an agent with a status but no agent program still counts", () => {
  const p = pane("a", "Doing work", { key: "program", name: "node", agent: false }, { status: "working" });
  assert.deepEqual(plan([tab("a", "1")], [p], {}).renames, [{ id: "a", name: "Doing work" }]);
});

test("closed tabs are pruned, unless keep carries entries over", () => {
  assert.deepEqual(plan([], [], { gone: ["x"] }).owned, {});
  assert.deepEqual(plan([], [], { away: ["x"] }, { keep: true }).owned, { away: ["x"] });
});

test("keep still drops a seen tab someone else renamed", () => {
  const r = plan([tab("a", "mine", true)], [], { a: ["Fix login"], away: ["x"] }, { keep: true });
  assert.deepEqual(r.owned, { away: ["x"] });
});

test("an unchanged title on an unnamed tab named the same is a no-op", () => {
  const r = plan([tab("a", "Fix login")], [pane("a", "Fix login")], {});
  assert.deepEqual(r.renames, []);
  assert.deepEqual(r.owned, {});
});
