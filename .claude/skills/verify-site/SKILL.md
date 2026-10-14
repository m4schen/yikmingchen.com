---
name: verify-site
description: Prove a change to yikmingchen.com works on the real built artifact. Use before saying any change is done, and for any routing, visual, content or performance work on this site.
---

# Verify a change to yikmingchen.com

Check the change against `dist/`, the artifact GitHub Pages serves. Compiling, your
own reasoning and a dev-server glance don't count.

## 1. Run the gate

```sh
pnpm check   # lint -> build -> typecheck -> verify -> test:e2e (same as CI)
```

When iterating, run only the failing stage. `typecheck`, `verify` and `test:e2e` all
need a fresh `pnpm build` first.

| Failure                   | Where to look                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify` ERROR       | The message names the page and the problem (broken link, missing og image, unresolved `<Component>`, budget). The rules are in `scripts/verify-dist.ts`. |
| e2e failure               | `test-results/<test>/` has a screenshot and trace. Open the trace with `pnpm exec playwright show-trace <trace.zip>`.                                    |
| "Vue never mounted on /x" | The page threw while rendering; the page errors are listed under the message.                                                                            |

## 2. Look at it, if it's visible

```sh
pnpm serve:dist   # http://127.0.0.1:4173, same URL rules as GitHub Pages
```

Open the routes you touched, in light and dark mode and at about 375px wide, or
take screenshots: run `pnpm shots --no-art --out .perf/shots/before` before the
change and `--out .perf/shots/after` after it, then compare the pairs. Check
them against `docs/style-guide.md` (its reference images live in `docs/style/`). Use
`docs/feature-map.md` to find how a feature is reached and what it depends on.

## 3. Measure it, if it could affect speed

```sh
pnpm perf /affected/route /posts            # before and after; compare idleCpu, fps, jsKB
pnpm perf /affected/route --mobile --cpu 4  # mid-range phone
pnpm perf /affected/route --trace           # Chrome trace in .perf/ for https://ui.perfetto.dev
```

Headless Chromium rasterizes canvases in software, so the numbers for animated
backgrounds are pessimistic. Compare runs with each other, not with a real GPU.
`docs/feature-map.md#performance` has the current baseline.

## 4. Keep the map current

If you added or changed a route or site-wide behavior, update `docs/feature-map.md`
in the same change. If you found a new trap, add it to the map's "Traps" section.
If a check could have caught it, add the check to `scripts/verify-dist.ts` or
`tests/e2e/smoke.spec.ts`.
