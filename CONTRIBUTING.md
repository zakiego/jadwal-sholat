# Contributing

Thanks for helping. Small, focused PRs are the easiest to review.

## Reporting a wrong time

Open an issue with:

- the city slug or coordinates
- the date
- the prayer that's off, with our time and the official Kemenag time
- where the official time came from (a link to bimasislam.kemenag.go.id or a screenshot)

## Making a change

1. Fork the repo and create a branch from `main`.
2. Run `pnpm i`, then `pnpm dev`.
3. Make your change.
4. Check it with `pnpm exec tsc` (it has to pass) and `pnpm build`.
5. If you touched `src/lib/prayer/`, run `pnpm dlx tsx scripts/validate.ts`. Every prayer should stay within 1 minute of Kemenag.
6. For UI changes, test a city page with `?data=worst`, `?data=after-isha` and `?data=polar`, and at 320px wide. Add before and after screenshots to the PR.
7. Open a PR against `main`.

There's no test suite or linter yet, so the typecheck and build are the bar. Adding tests for the prayer engine would be a welcome first PR.

## Conventions

- Commit messages and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/): `fix(ui): keep the countdown on one line`.
- Code style: TypeScript strict, no semicolons, double quotes, 2-space indent, `@/` imports.
- Site copy is Indonesian. The API, MCP, docs and code are English.
- Don't edit generated files: `src/routeTree.gen.ts`, `src/data/cities.json`, `worker-configuration.d.ts`, or anything in `public/`.
- Visual changes should fit the contract in [DESIGN.md](DESIGN.md).

[AGENTS.md](AGENTS.md) has more detail on the layout and commands.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
