# Local Foundry session — 2026-09-19

## Authorized test environment

The user designated `pftest` as disposable and authorized logging in as
Gamemaster without a password and modifying everything in that world.

- User Data: `/home/theholycole/.local/share/FoundryVTT/Data`.
- Local address: `http://localhost:30000` (port read from Foundry options).
- World: `pftest`, display title `PFTEST`.
- Foundry: 14.367, observed on the join page and in world metadata.
- Installed PF2e: 8.5.0, read from the installed system manifest.
- Workspace module: 0.8.2 at `92b4fd488f4d73eeed74ad77a78a65411e28bb47`.
- The installed `modules/pf2e-automatic-resolution` directory is a symlink
  to this workspace. Production runtime edits here therefore affect the
  installed module; there is no separate deployment copy to synchronize.

## Observed

The browser reached the local join page, selected Gamemaster, received a
successful-login notice, and loaded `/game`. The scene controls, chat history,
and active Gamemaster were visible. The join screen listed Gamemaster and
Player2. A second GM role/client has not been established.

No world documents or settings were changed during this connection check.
The historical chat messages are not new test evidence. Automatic-removal
settings, timed fixtures, hook traces, and expiry behavior have not yet been
verified. The expiry experiment remains open, including reload, backward-time,
and multi-client coverage.

## Prototype available for feedback

[Ongoing spell interaction prototype](../planning/ongoing-spells.prototype.html)
is a self-contained, in-memory demonstration of the accepted controls. It uses
fictional workflow examples and does not establish native lifecycle behavior.
It has six guided walkthroughs plus free-play controls and a player/GM switch.
It does not implement production automation or persist data.

Automated browser preview was blocked: the Foundry-hosted HTML URL returned
`ERR_BLOCKED_BY_CLIENT`, and the local-file URL was rejected by the browser
security policy. No browser workaround was attempted after that rejection.
The file was offered through the Codex file panel for user review. Interactive
verification and user feedback remain pending; no prototype decision is closed.

Subsequently, the user approved the demonstrated walkthrough and requested a
browser verification retry after changing permissions. The retry could list the
open local-file walkthrough tab, but `cua.getTab` was rejected by the Browser Use
URL policy. User feedback is now accepted; agent interactive verification is
still blocked. No alternate browser route was used to bypass the restriction.


## Completed baseline experiment

See [native expiry experiment](native-expiry-experiment.md) for actual observations, fixture identities, trace location, limitations, and integration requirements. Original GM, temporary GM2, and Player2 were connected for the multi-client case. Temporary GM2 (`WCHvGCPipQMSG3pB`) is now disabled: a fresh reload verified stored and effective role 0. Auxiliary clients were closed; original GM (`rW96bfNVu9Z4WVK7`) resumed native active-GM authority. Saved and effective automatic-removal settings both returned to true. Diagnostic observers were stopped. Fixtures remain in disposable pftest, with traces on `Macro.jTXt6OCb5uKf5tbK`.
