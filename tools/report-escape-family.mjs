#!/usr/bin/env node
// Compatibility entry point for the event-lifetime batch audit.
process.argv.splice(2, 0, 'event-lifetimes');
await import('./report-rule-family.mjs');
