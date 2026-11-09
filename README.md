# herdr-agent-tab-names

A [Herdr](https://herdr.dev) app mod that names each tab after the agent
running in it. The agents list already shows a Claude Code session as
`herdr_mods · Herdr file-open mod`. With this mod the tab bar shows the same
title, `Herdr file-open mod`, where it used to show `2`.

- A tab takes the title of its first agent pane that has a useful one. The
  title is cleaned the way the agents list cleans it: leading spinner and
  status glyphs (`✳`, `⠂`) are dropped, and the program's own name
  (`Claude Code`), paths and `user@host` titles are ignored.
- The name follows the agent. When Claude Code retitles the session, the tab
  is renamed within a second.
- When the agent exits, the tab keeps the last name.
- **A name you give a tab is yours.** If you rename a tab (double-click or
  `tab.rename`), the mod never touches it again. Renaming it to `""` (back to
  its number) hands it back to the mod.
- Tabs on a machine whose layout is unavailable are left alone until it is
  back.

## Requirements

- Herdr app 0.1.14 or later.
- An agent that sets its terminal title, such as Claude Code.

## Install

1. Copy the mod:

   ```sh
   cp -R mods/agent-tab-names ~/.config/herdr-app/mods/
   ```

2. Dock it. The mod draws nothing, but it runs only while a layout holds it,
   so add it as a floating block on the root node of your own layout
   (`~/.config/herdr-app/layouts/<yours>.json`):

   ```json
   "floating": [
     { "id": "agent-tab-names", "content": { "mod": "agent-tab-names" }, "edge": "bottom", "align": "end" }
   ]
   ```

   If the root already has a `floating` array, append the entry to it.
   Shipped layouts are read-only, so clone one first:
   `herdr-app do layout.clone '{"name":"main","as":"my-layout"}'`.

3. Check it: `herdr-app check ~/.config/herdr-app/mods/agent-tab-names`.

## Uninstall

Remove the floating entry from your layout, then
`rm -r ~/.config/herdr-app/mods/agent-tab-names`. Tabs keep the names they
have. The mod's bookkeeping is the `agent-tab-names.owned` key in
`~/.config/herdr-app/shared.json`.

## How it works

Every second it reads `spaces()` and `panes()`. For each tab that nobody else
named, it runs `tab.rename` when the agent's title differs from the tab's
name. It remembers which names it set (shared key `agent-tab-names.owned`,
persisted across restarts), so it can tell its own names from yours. It runs
no programs, reads no files and makes no network requests.

## Tests

```sh
node --test tests/
herdr-app check mods/agent-tab-names
```

## License

MIT
