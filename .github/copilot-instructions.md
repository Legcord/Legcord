# Contributing to Legcord

Legcord is an opinionated project. We welcome contributions from everyone, but we want your effort to land successfully and match the direction of the project.

This guide explains what maintainers look for in pull requests, based on existing code patterns and CI rules.

## How to contribute

Contributions are accepted through pull requests.

Pull requests should target the `dev` branch. If you are fixing a critical bug or security issue, you may open fixes for both `stable` and `dev`.

## Before you start a feature

- Check open pull requests for overlap.
- Check GitHub enhancement issues and the feature requests Discord channel.
- If the feature does not exist yet, open an issue, say you want to implement it, and wait for feedback before writing large changes.
- Familiarize yourself with the codebase rules below.

## Codebase rules

### Tooling and quality

- Use modern ESM, not CommonJS `require`, where possible.
- Use `pnpm` as defined in `package.json`.
- Run `pnpm lint` before opening a pull request.
- Run `pnpm build` when your change touches runtime code, build output, bundling, or packaging behavior.
- Avoid introducing new dependencies unless absolutely necessary.

### TypeScript and linting expectations

- Keep TypeScript strictness intact. Do not weaken compiler settings.
- Avoid `@ts-ignore` and broad type escapes. If suppression is unavoidable, use the narrowest suppression possible and include a short reason.
- Any lint suppression such as `biome-ignore` or `eslint-disable` must include a clear explanation and preferably a tracking issue or URL when relevant.

### Electron security expectations

- Follow Electron security best practices.
- Keep preload APIs minimal and explicit when exposing APIs through `contextBridge`.
- Do not add broad permissions or relax security defaults without a strong reason.
- Be careful with injected JavaScript and user-controlled strings. Sanitize inputs and prefer safe serialization patterns.
- Be extra cautious when changing CSP handling, protocol handling, permission handlers, or web request hooks.

### Performance expectations

- Preserve existing performance patterns such as config, lang, theme, and window-state caching, debounce behavior, and startup order.
- Avoid changes that add repeated synchronous I/O in hot paths.
- Be careful with startup flow. Some existing operations intentionally use `void` or deferred execution to avoid startup hangs.

### Config and migration expectations

- If you change settings shape or defaults, update related migration logic and defaults together.
- Keep backward compatibility with older config formats where possible.
- If your pull request changes user data behavior, explain migration and fallback behavior in the pull request description.

### Cross-platform expectations

- Legcord ships on Linux, macOS, and Windows. Keep platform-specific behavior safe and scoped.
- If your change is platform-specific, explicitly mention tested platform or platforms in your pull request.
- If you cannot test a platform, state that clearly so reviewers know what remains unverified.

### i18n expectations

- Add manual translation changes only to `assets/lang/en-US.json`.
- Update other translations on Weblate.

## Pull request rules

### Scope and size

- Keep pull requests focused on one concern.
- Split unrelated refactors from feature or bugfix work.
- Prefer small, reviewable pull requests over large mixed changes.

### Pull request description

Include these sections in your pull request body:

- Problem: what user or developer issue is being solved.
- Solution: what changed and why this approach was chosen.
- Risk: what might regress.
- Validation: what you tested, including `pnpm lint`, `pnpm build`, manual scenarios, and platform coverage.

### Verification checklist

Before requesting review, verify:

- `pnpm lint` passes.
- `pnpm build` passes for runtime or build-affecting changes.
- Manual smoke testing for affected flows is done, for example startup, settings save and load, themes or mods behavior, tray or window behavior, and CSP or other security-sensitive paths if touched.
- For UI changes, include screenshots or short recordings.

### Review readiness

- Mark breaking changes clearly.
- Call out follow-up work explicitly if a workaround is temporary.
- Reference related issues and prior discussions.
- If you added a workaround or suppression, include the reason in code comments and in the pull request description.

## Documentation

We are still improving project and codebase documentation. If you have experience building docs systems or contributor docs, contact `@smartfrigde` on Discord.

## Help users in the Discord community

We have an open support channel in our Discord community. Helping users there is always appreciated.