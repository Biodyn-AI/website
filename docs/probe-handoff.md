# PROBE handoff

For whoever is working on the evaluations programme. Written 2026-08-15, after a
redesign pass over the rest of the site. Nothing here constrains the research;
it is about where the evals pages live, what they are coupled to, and the house
style they now have to match.

## Where you work

Two repos, side by side.

```
/Volumes/Crucial X6/MacBook/Code/probe            the harness and the research
/Volumes/Crucial X6/MacBook/Code/biodyn-website   the public site
```

**Yours in the website repo:**

| file | what it is |
|---|---|
| `evals.html` | the PROBE landing page |
| `evals-standard.html` | the six rules |
| `evals-registry.html` | model / task registry |
| `evals.css` | styles for all three |
| `evals.js` | renders the leaderboards and coverage grid from JSON |
| `content/evals.json` | generated payload, **do not hand-edit** |

The payload is produced by the harness, which already knows where to put it:

```bash
probe site --out ../biodyn-website/content/evals.json
```

`evals.js` fetches it at `content/evals.json` with `cache: 'no-store'` and
degrades to a visible message if it fails, so a missing or malformed payload
shows up as text on the page rather than a blank section. Keep that property.

**Not yours.** `style.css`, `script.js`, and the modules behind the redesign:
`about-*.js/css`, `margin-*.js`, `margins.*`, `cards.*`, `cycle.*`, `impact.*`,
`hero.css`. Editing `style.css` changes all ten pages. If you need something
from it, add to `evals.css` instead.

## Three couplings that will break other pages

1. **The About page links into yours.** Case II of `about.html` links to
   `evals.html`, `evals.html#evBoards`, `evals.html#evCoverage`, and
   `evals-standard.html`. Those two anchor ids are load-bearing. Renaming a
   page or an anchor silently breaks the About page.

2. **The About page also restates your claims.** `about-core.js` has an
   `AUDIT_AREAS` block describing the elicitation gap, recoverability, the
   Standard and coverage. It currently says F is defined but not yet populated
   for the reference adapters. When that stops being true, update that copy too
   or the site will be making a stale claim in two voices.

3. **There is no templating.** Nav and footer are copy-pasted into all ten HTML
   files. A nav change means ten edits. `portfolio.html` was retired; do not
   reintroduce links to it.

## House style

These came out of a long review pass. They are preferences the site owner
stated directly, not inferences.

- **No em dashes.** Anywhere, including code comments. Use a comma, a colon, or
  restructure. The whole repo is currently clean; keep it that way.
- **No eyebrow labels** above headings. No `SECTION NAME` kickers, no `01 / 02 /
  03` numbers above sub-items, no repeated type labels like `Atlas Module` on
  every card in a group.
- **No counters.** The hero stat strip and the evals stat strip were both
  removed as uninformative. Do not add score/model/task counts as decoration.
- **One tag per card at most.** For papers that is the venue. The second tag,
  the topic or paper-type one, was removed everywhere.
- **Say what is not true yet.** This is the site's actual voice and it matches
  the Standard. Negative results and gaps get stated in the same place as the
  results, not in a footnote.

## Visual language

Typography, available on every page now:

- **Instrument Serif** for display, weight 400, one italic phrase as the accent
- **Inter** for body
- **IBM Plex Mono** for labels, venues, buttons; `--font-mono` is in `:root`

Colour: one accent per context, never a gradient across text. Gradients survive
only on the Biodyn wordmark, nav underlines and card rules. Buttons and the nav
CTA are hairline: transparent background, 1px border, 2px radius, mono
uppercase, accent colour for the primary. `.btn-primary` / `.btn-secondary` are
global and already correct, so use those classes rather than rolling your own.

Cards (`.pub-card`, and friends) get corner ticks on hover, an accent rule that
draws in along the top, and a light that follows the cursor. That behaviour
comes from `cards.css` + `cards.js`, which are **only loaded on `index.html`**.
If you want it on the evals pages, add both to the page head and script block;
`cards.js` picks up dynamically rendered cards via a MutationObserver, so
JSON-rendered rows are covered.

If you build anything with the "instrument" look, put `class="ab-scope"` on the
section and you get the full token set from `about-core.css`: `--ab-bone`,
`--ab-dim`, `--ab-faint`, `--ab-line`, `--ab-ch1..4`, the fonts. Add
`data-channel="1..4"` to pick the accent. That is how the Impact section and the
methodology loop are built; copy one of those rather than starting fresh.

Non-negotiables: both themes work (`:root[data-theme="light"]`),
`prefers-reduced-motion` is respected, and anything sticky sits at `66px`, which
is the scrolled nav height. Anything lower opens a gap that page content shows
through.

## Deploying

`main` is the live branch; GitHub Pages serves `biodynai.com` from it. A push
deploys in roughly a minute. There is no staging. Sanity-check locally first:

```bash
cd "/Volumes/Crucial X6/MacBook/Code/biodyn-website" && python3 -m http.server 8765 --bind 127.0.0.1
```

The volume is exFAT and litters `._*` AppleDouble files; they are excluded via
`.git/info/exclude`, so check `git status` before committing rather than using
`git add -A` blindly.

## What changed on the site, briefly

The About page is now an interactive argument for three cases: biological models
as model organisms for interpretability, capability audits needing internals,
and extracting biology at scale. It runs on one 3D figure that turns between
cases and morphs a level deeper when an area is opened. That same experience is
embedded on the main page below the hero.

**PROBE is case II.** It is presented as the instrument the second argument
needs, across four areas: elicitation gap, recoverability, the Standard, and
coverage. So the evals pages are not a side section any more, they carry one
third of the site's argument. Worth knowing when deciding how much a page has
to explain on its own versus lean on the About page.

The main page also gained: four rewritten research tracks, an Impact section
addressing four audiences, a five-stage methodology loop, and margin figures on
most sections. A new blog post, `real-model-organisms-for-interpretability.html`,
argues the case-I position at length.

One caveat on that post: its section on tensor-network foundation models
describes unpublished work and was written from a verbal summary. It is live and
flagged with the owner for a factual pass. Do not cite it as settled.
