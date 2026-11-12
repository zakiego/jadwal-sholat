# Security

Please report a vulnerability privately, not in a public issue. Use [Report a vulnerability](https://github.com/zakiego/jadwal-sholat/security/advisories/new) on GitHub.

Say what you found, how to reproduce it, and what it lets someone do.

## What's in scope

- The Worker in this repo: the website, `/api/v1`, `/mcp`, the iCal feeds and the text view.
- The live site at https://sholat.zakiego.com.

The service has no accounts, no database and no secrets, so the likely problems are injection in a response (HTML, iCal, plain text), cache poisoning, or a request that makes the Worker do too much work.

A prayer time that doesn't match the official schedule is a bug, not a vulnerability. Open a normal issue for that.
