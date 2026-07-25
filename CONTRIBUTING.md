# Working rules for this repo

Read this before changing anything. Every rule below is here because the
thing it prevents already happened and shipped to the live site.

## Run the checks before you commit

```sh
bin/verify.py            # full run
bin/verify.py --static   # no browser needed
bin/verify.py --list     # what each check guards against
```

A `pre-commit` hook runs the fast tier automatically (`git config core.hooksPath
.githooks`). Run the full tier yourself before pushing anything that touches
layout, print CSS, images, or page structure.

## Identity

Commits are authored as **Doland Skeeter War <webmaster@dolandskeeterwar.com>**.
Nothing in this repo — files, comments, commit messages, image metadata — may
mention the tools used to build it or the owner's personal details.

This leaked twice. The first fix corrected a single commit's author and left
the repo config alone, so every later commit reverted; it also missed that git
stores **author and committer separately**. Set the config, and check both
fields.

## Editing content files

**Never use an open-ended regex to replace a block of markup.** A `.*?` that
ends on a common token like `</div>` will eat everything to the next match. One
such edit deleted an entire quiz section and a sources section from the kids
page and shipped, because the checks afterwards only looked at what had been
added.

Use exact-string replacement, assert the match count is 1, and afterwards
confirm the things you did *not* intend to touch are still present.

## Verify what you might have broken, not just what you built

After any structural edit, check that every section listed in `_data/nav.yml`
still exists on its page. `bin/verify.py` does this; it exists because the
manual check that ran instead confirmed "3 figures present, ids unique, CSP
clean" and never noticed two sections had vanished.

## Print CSS must be self-contained

Printing from a phone lays the page out at the **phone's** width, so screen
breakpoints still apply on paper. Any layout property a `@media (max-width:…)`
block sets — `grid-template-columns`, `flex-direction`, `columns` — must be
restated inside `@media print`.

Test printables by measuring rendered height under `emulate_media(media="print")`
at layout widths from 320px up, against an **872px** budget (Letter, 0.75in
margins, browser header and footer). Do not test only at paper width; that is
what hid a two-page printout through three rounds of "fixes".

## New pages

A page using `layout: null` bypasses `_includes/head.html` and gets **no**
title/description conventions, Open Graph tags, structured data or canonical
unless you write them yourself. `/water-hunt/` shipped without any of it.

Whenever pages are added, split or renamed, update `llms.txt` — it describes
the site to agents and silently goes stale.

## Measure, don't assume

Several confident statements in this repo's history turned out to be wrong:
that the printable fit on one page, that an image was correctly sized, that
contrast was fine. Where a number decides the outcome — pixel heights, contrast
ratios, file sizes — measure it and paste the number into the commit message.

## Measure the right thing, on the right connection

Measuring is not enough if the environment cannot produce the failure.

Local Lighthouse reported **CLS 0.000** on every page while the live site was
actually scoring **0.266** on mobile — a failed Core Web Vital. The test was
run correctly; it simply could not reproduce the bug. On localhost the fonts
arrive in ~0ms, so `font-display: swap` never fires and the reflow it causes
does not exist. No amount of re-running that test would ever have found it.

Then the *fix* repeated the mistake one level down. Font metrics were measured
properly — Oswald renders 17% narrower than its fallback, Public Sans within 3%
— and the small-delta faces were left on `swap` on the strength of those
numbers. Throttled testing then failed `/build/` at 0.1023, traced to the
Public Sans swap. The ratios were measured against *this container's* fallback
(DejaVu Sans), not the Arial or Roboto a real phone uses. A number measured
against the wrong baseline is not evidence.

So:

- **Before trusting a green result, ask what would have to be true for this
  test to fail.** If the answer is "a condition my environment never creates",
  the result means nothing.
- **Throttle the network** for anything about loading, layout stability, or
  perceived speed. `bin/verify.py` now does this and gates on CLS 0.1.
- **Metric overrides (`size-adjust`, `ascent-override`) were considered and
  rejected** for exactly this reason: they must be tuned to one platform's
  fallback font and are wrong on every other. `font-display: optional` needs no
  such guess, so all nine faces use it. Do not put them back to `swap`.

## Accessibility

WCAG AA is the floor. Two traps the naive check misses, both of which produced
wrong answers here:

- **Semi-transparent backgrounds** must be composited over what is behind them.
- **Gradient backgrounds** cannot be resolved from computed style at all;
  `bin/verify.py` reports those separately and they need a human eye.

## Deliberate decisions worth not re-litigating

- **Render-blocking CSS is intentional.** Deferring `styles.css` was measured
  and made things worse: CLS went from 0.06 to 0.77 and Lighthouse performance
  from 89 to 60. See the comment in `_includes/head.html`.
- **CSS/JS are not minified.** It needs a build step GitHub Pages will not run,
  and the gain after gzip is small.
- **Cache lifetimes** are a Cloudflare rule, not a repo change.
- **Security headers live in the Cloudflare Transform Rule, not in markup.**
  The `<meta>` CSP and `<meta name="referrer">` were removed from
  `_includes/head.html`. The header always wins when both are present, and the
  meta CSP could never carry `frame-ancestors` (browsers ignore it there), so
  it enforced nothing while making scanners correctly report the two policies
  as different. Pages with `layout: null` (`/water-hunt/`, `/flyer/`) keep
  their own meta CSP, because they bypass the shared head and would otherwise
  ship no policy at all if the rule were ever removed.
- **Scanner findings are triaged, not obeyed.** `/security-policy/` documents
  what this project declines and why. Before acting on an audit item, confirm
  it against the code: recent reports have claimed Bootstrap (not present),
  HTTP/1.1 (it serves HTTP/3), and a CSP mismatch that was a spec behaviour.
  Equally, do not dismiss a report without reading all of it — the same batch
  contained a real unfriendly-URL finding and a real flat-heading finding that
  a first skim missed.
- **Off-page SEO recommendations are declined on purpose.** Social profiles, a
  business address and phone, Local Business Schema, and analytics all conflict
  with the anonymity stated in `about.html`. The "Links: F" grade is a backlink
  score; it is earned by the flyer and the printable, not by a code change.
