# Refract on macOS (current status)

Refract's launcher runs on macOS (Intel and Apple Silicon), including:

- launcher UI and local state
- Meta sign-in
- library browsing
- downloading and managing Quest game files

## Not yet supported

Running Android games from Refract on macOS is still in progress. The launcher reports
this in Setup and diagnostics, and runtime/game session actions return a clear message.

## Building the launcher shell

From `launcher/`:

```sh
npm ci
npm run tauri -- build --no-bundle
```

The resulting executable can be staged with `tools/package_release_macos.sh`.
