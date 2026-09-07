# AthenaBot Plugins

A collection of public AthenaBot plugins, each maintained on its own branch. This
`main` branch holds only the release automation.

## Layout

| Branch         | Contents                                             |
| -------------- | ---------------------------------------------------- |
| `main`         | Release workflows (this branch) — no plugin code     |
| `qrcodes`      | QRCodes plugin (`main.js`, `src/`, `data/`)          |
| `guildlocker`  | GuildLocker plugin (`main.js`, `src/`, `data/`)      |
| `voicestats`   | VoiceStats plugin (`main.js`, `src/`, `data/`)       |

Each plugin branch is independent (orphan history) and contains only that plugin's
files at the repository root.

## Releasing a plugin

Releases are cut manually from the **Actions** tab:

1. Open **Actions → Release &lt;Plugin&gt;**.
2. Click **Run workflow**.
3. Enter the version tag (e.g. `1.0.0.0`) and run.

Each run checks out the matching plugin branch, builds two archives, and publishes a
GitHub Release:

- `<plugin>.zip` — obfuscated build
- `<plugin>-full.zip` — full source

Release tags are namespaced by plugin (e.g. `qrcodes-1.0.0.0`) so all three plugins
can share this repository without tag collisions.

## Working on a plugin

```bash
git checkout qrcodes   # or guildlocker / voicestats
```

Because plugin branches share no history with `main`, switch to a plugin branch to
edit its code, and commit there. The release workflows always live on `main`.
