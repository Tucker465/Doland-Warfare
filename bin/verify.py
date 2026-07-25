#!/usr/bin/env python3
"""Pre-flight checks for dolandskeeterwar.com.

Every check here exists because the thing it checks for actually broke and
shipped. The incident is named in each check so nobody later deletes one
thinking it is hypothetical.

    bin/verify.py            full run (needs Playwright for the browser tier)
    bin/verify.py --static   skip the browser tier
    bin/verify.py --list     show the checks and the incidents behind them

Exit code is non-zero if any check fails, so it can gate a commit or CI.
"""
from __future__ import annotations
import base64, json, os, re, subprocess, sys, tempfile, shutil, glob, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
os.chdir(ROOT)

AUTHOR_NAME  = "Doland Skeeter War"
AUTHOR_EMAIL = "webmaster@dolandskeeterwar.com"

# Text that must never reach the repo: build-tool attribution and the owner's
# personal identifiers. The list is stored encoded so that this file does not
# itself become the mention it exists to prevent — which is exactly what a
# plaintext watch-list, and a doc named after the tool, both did.
FORBIDDEN = re.compile(base64.b64decode(
    "Y2xhdWRlfGFudGhyb3BpY3xvcGVuYWl8Y2hhdGdwdHxjb3BpbG90fGNvLWF1dGhvcmVkLWJ5fGdlbmVyYXRlZCB3aXRofGFpLWdlbmVyYXRlZHxwcml2YXRlcmVsYXl8YXBwbGVpZA==").decode(), re.I)

# Widths a phone/tablet/desktop may lay a page out at.
VIEWPORTS = [(320, 720), (390, 844), (768, 1024), (1440, 900), (1920, 1080)]
# Worst realistic printable height: Letter, 0.75in margins, browser header+footer.
PRINT_BUDGET_PX = 872
# Google's "good" Cumulative Layout Shift threshold. Anything above this is a
# ranking factor, not a cosmetic nit.
CLS_BUDGET = 0.1
# Deliberately harsher than Lighthouse's mobile default (~1.6Mbps). The whole
# point of this check is to lose races that localhost always wins.
SLOW_NET = {"offline": False, "downloadThroughput": 400 * 1024 // 8,
            "uploadThroughput": 400 * 1024 // 8, "latency": 400}
PRINT_WIDTHS = [320, 390, 430, 560, 650, 730, 816]

results: list[tuple[bool, str, str]] = []

def check(ok: bool, name: str, incident: str, detail: str = "") -> bool:
    results.append((ok, name, detail))
    mark = "PASS" if ok else "FAIL"
    print(f"  [{mark}] {name}")
    if not ok:
        print(f"         guards against: {incident}")
        if detail:
            for line in str(detail).splitlines()[:12]:
                print(f"         {line}")
    return ok

def sh(cmd: str) -> str:
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip()


# ───────────────────────────── static tier ──────────────────────────────

def check_git_identity():
    """INCIDENT: 16 commits shipped under the build tool's identity. Fixing one
    commit did not help because the repo config was never changed, and git's
    separate committer field was missed entirely."""
    name = sh("git config user.name")
    email = sh("git config user.email")
    check(name == AUTHOR_NAME and email == AUTHOR_EMAIL,
          "git config identity is the site identity",
          "tool attribution leaking into commit metadata",
          f"configured: {name} <{email}>\nexpected:   {AUTHOR_NAME} <{AUTHOR_EMAIL}>")

    bad = sh(f"git log --format='%h %an <%ae> | %cn <%ce>' | grep -v "
             f"'{AUTHOR_NAME} <{AUTHOR_EMAIL}> | {AUTHOR_NAME} <{AUTHOR_EMAIL}>'")
    check(not bad, "every commit author AND committer is the site identity",
          "tool attribution in git history", bad)

def check_no_forbidden_strings():
    """INCIDENT: tool attribution is trivial to reintroduce in a comment or
    commit message and is invisible until someone reads the repo on GitHub."""
    # No exemptions: with the watch-list encoded, nothing in the repo spells
    # these terms, so every tracked file is fair game.
    hits = []
    for f in sh("git ls-files").splitlines():
        p = pathlib.Path(f)
        if p.suffix.lower() in {".webp", ".png", ".ico", ".woff2", ".pdf", ".jpg"}:
            continue
        try:
            for i, line in enumerate(p.read_text(errors="ignore").splitlines(), 1):
                if FORBIDDEN.search(line):
                    hits.append(f"{f}:{i}: {line.strip()[:90]}")
        except OSError:
            pass
    check(not hits, "no tool or personal identifiers in tracked files",
          "tool attribution in file contents", "\n".join(hits))

    msgs = sh("git log --format='%H %s%n%b'")
    bad = [l for l in msgs.splitlines() if FORBIDDEN.search(l)]
    check(not bad, "no tool or personal identifiers in commit messages",
          "tool attribution in commit messages", "\n".join(bad))

def build_site() -> pathlib.Path:
    jekyll = shutil.which("jekyll") or os.path.expanduser(
        "~/.local/share/gem/ruby/3.3.0/bin/jekyll")
    out = pathlib.Path(tempfile.mkdtemp(prefix="verify-site-"))
    r = subprocess.run([jekyll, "build", "--destination", str(out)],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout[-2000:], r.stderr[-2000:])
        sys.exit("jekyll build failed")
    return out

def check_sections_exist(site: pathlib.Path):
    """INCIDENT: an open-ended regex used to swap a list consumed everything
    after it, deleting the quiz and sources sections from the kids page. It
    shipped, because the checks afterwards only looked at what was added."""
    import yaml
    nav = yaml.safe_load(pathlib.Path("_data/nav.yml").read_text())
    urls = {p["key"]: p["url"] for p in nav["primary"]}
    missing = []
    for key, sections in (nav.get("page_sections") or {}).items():
        url = urls.get(key)
        if not url:
            continue
        f = site / url.strip("/") / "index.html" if url != "/" else site / "index.html"
        if not f.exists():
            missing.append(f"{url}: page not built"); continue
        html = f.read_text()
        for s in sections:
            if f'id="{s["id"]}"' not in html:
                missing.append(f'{url}: nav.yml lists section "{s["id"]}" but the page has no such id')
    check(not missing, "every section named in nav.yml exists on its page",
          "content silently deleted by a careless edit", "\n".join(missing))

def pages(site: pathlib.Path):
    for f in sorted(site.rglob("index.html")):
        yield "/" + str(f.parent.relative_to(site)).replace(".", "").strip("/") + \
              ("/" if f.parent != site else ""), f

def check_page_metadata(site: pathlib.Path):
    """INCIDENT: /water-hunt/ uses layout:null, so it bypassed the shared head
    and shipped with no Open Graph tags, no structured data and an over-long
    title. Two other pages had descriptions past the truncation point."""
    problems = []
    for url, f in pages(site):
        h = f.read_text()
        def meta(pat):
            m = re.search(pat, h, re.I); return m.group(1) if m else None
        title = meta(r"<title>(.*?)</title>") or ""
        desc  = meta(r'<meta name="description" content="(.*?)"') or ""
        if len(title) > 62: problems.append(f"{url}: title {len(title)} chars (max 62)")
        if not 110 <= len(desc) <= 165: problems.append(f"{url}: description {len(desc)} chars (want 110-165)")
        for need, label in [(r'rel="canonical"', "canonical"),
                            (r'property="og:title"', "og:title"),
                            (r'property="og:image"', "og:image"),
                            (r'name="twitter:card"', "twitter:card")]:
            if not re.search(need, h, re.I): problems.append(f"{url}: missing {label}")
        if h.count("<h1") != 1: problems.append(f"{url}: {h.count('<h1')} h1 elements (want exactly 1)")
        for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
            try: json.loads(block)
            except Exception as e: problems.append(f"{url}: invalid JSON-LD ({e})")
    check(not problems, "every page has complete, valid SEO metadata",
          "pages bypassing the shared layout shipping without OG/schema", "\n".join(problems))

def check_internal_links(site: pathlib.Path):
    """INCIDENT: pages were split and renamed repeatedly; a stale href is easy
    to leave behind and nothing surfaces it."""
    bad = []
    for url, f in pages(site):
        for href in set(re.findall(r'href="(/[^"#?]*)', f.read_text())):
            t = href.strip("/")
            if not t:
                continue
            if (site / t).exists() or (site / t / "index.html").exists():
                continue
            bad.append(f"{url} -> {href}")
    check(not bad, "every internal link resolves to a built file",
          "broken links after restructuring", "\n".join(sorted(set(bad))))

def check_print_css_self_contained():
    """INCIDENT: the printable sheet came out on two pages when printed from a
    phone, because @media print never restated grid-template-columns and the
    max-width:560px screen rules applied to paper."""
    LAYOUT = {"grid-template-columns", "flex-direction", "columns"}

    def blocks(text, opener):
        """Yield the body of each at-rule matching `opener`, brace-balanced."""
        for m in re.finditer(opener, text):
            i = text.index("{", m.end() - 1); depth = 0
            for j in range(i, len(text)):
                depth += (text[j] == "{") - (text[j] == "}")
                if depth == 0:
                    yield text[i + 1:j]; break

    problems = []
    for css in glob.glob("*.css"):
        text = pathlib.Path(css).read_text()
        # Only stylesheets that drive a paper-sized artifact — an @page with an
        # explicit `size:`, meaning the output has to fit a sheet. styles.css
        # sets @page{margin} only to hide chrome while printing, where a screen
        # breakpoint carrying over costs nothing.
        if not re.search(r"@page\s*\{[^}]*\bsize\s*:", text) or "@media print" not in text:
            continue
        printed = "\n".join(blocks(text, r"@media\s+print"))
        for blk in blocks(text, r"@media\s*\(max-width"):
            for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", blk):
                sel = sel.strip()
                for prop in set(re.findall(r"([a-z-]+)\s*:", body)) & LAYOUT:
                    if not re.search(re.escape(sel) + r"\s*[,{][^{}]*\{?[^{}]*" + prop, printed):
                        problems.append(
                            f"{css}: '{sel}' sets {prop} inside a max-width block, "
                            f"but @media print never restates it — a phone printing "
                            f"this page would get the narrow layout on paper")
    check(not problems, "print CSS restates any layout a screen breakpoint changes",
          "phone layout leaking into the printout", "\n".join(problems))


# ──────────────────────────── browser tier ──────────────────────────────

def browser_checks(site: pathlib.Path):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("  [SKIP] browser tier — pip install playwright")
        return
    import http.server, socketserver, threading, functools
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(site))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{port}"
    urls = [u for u, _ in pages(site)]

    chrome = os.environ.get("CHROME_PATH") or glob.glob(
        "/opt/pw-browsers/chromium-*/chrome-linux/chrome")
    exe = chrome[0] if isinstance(chrome, list) and chrome else chrome or None

    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()

        # --- overflow + CSP + JS errors, at every viewport we support -------
        # INCIDENT: a nested scrollbar in the desktop rail, and horizontal
        # overflow only visible on a phone, both reached the live site.
        overflow, csp, jserr = [], [], []
        for w, h in VIEWPORTS:
            pg = b.new_page(viewport={"width": w, "height": h})
            pg.on("pageerror", lambda e: jserr.append(str(e)))
            pg.expose_function("rv", lambda d: csp.append(d))
            pg.add_init_script(
                "document.addEventListener('securitypolicyviolation',"
                "e=>window.rv(e.violatedDirective+' @ '+location.pathname))")
            for u in urls:
                pg.goto(base + u); pg.wait_for_timeout(200)
                if pg.evaluate("document.documentElement.scrollWidth>window.innerWidth"):
                    overflow.append(f"{u} @ {w}px")
                # A dropdown panel that scrolls is correct behaviour; a layout
                # panel that grew its own scrollbar is the bug we shipped. Only
                # the deliberate ones are exempt, listed explicitly so adding a
                # new exemption is a visible decision.
                nested = pg.evaluate("""()=>{
                    const BY_DESIGN=['jumpnav-list'];  // the mobile jump-to sheet
                    return [...document.querySelectorAll('*')]
                      .filter(e=>e.scrollHeight>e.clientHeight+2 &&
                          ['auto','scroll'].includes(getComputedStyle(e).overflowY) &&
                          e!==document.scrollingElement &&
                          !BY_DESIGN.some(c=>e.classList.contains(c)))
                      .map(e=>String(e.className).slice(0,40)).slice(0,3);}""")
                if nested:
                    overflow.append(f"{u} @ {w}px nested scroll: {nested}")
            pg.close()
        check(not overflow, "no horizontal or nested scrolling at any viewport",
              "squished desktop rail with its own scrollbar; mobile overflow",
              "\n".join(overflow))
        check(not csp, "no CSP violations", "inline SVG <style> blocked, art rendered black", "\n".join(csp))
        check(not jserr, "no JavaScript errors", "runtime errors on the live site", "\n".join(jserr))

        # --- contrast ------------------------------------------------------
        # INCIDENT: a chip added to the home banner failed AA at 3.21:1,
        # after the kids page itself had been checked carefully.
        # Two things a naive contrast check gets wrong, both of which produced
        # false alarms here: a semi-transparent background has to be composited
        # over what is behind it, and an element sitting on a gradient has a
        # transparent computed backgroundColor, so walking the ancestor chain
        # lands on the wrong colour entirely. Gradients cannot be resolved from
        # computed style, so those are reported separately rather than failed.
        JS = r"""() => {
          const parse=c=>{const m=(c||'').match(/[\d.]+/g);if(!m)return null;
            return {r:+m[0],g:+m[1],b:+m[2],a:m.length>3?+m[3]:1}};
          const over=(f,b)=>({r:f.r*f.a+b.r*(1-f.a), g:f.g*f.a+b.g*(1-f.a),
                              b:f.b*f.a+b.b*(1-f.a), a:1});
          const lum=c=>{const [r,g,b]=[c.r,c.g,c.b].map(v=>{v/=255;
            return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});
            return .2126*r+.7152*g+.0722*b};
          const stack=e=>{           // composite every layer up to the root
            let n=e, layers=[], grad=false;
            while(n){const cs=getComputedStyle(n);
              if(cs.backgroundImage&&cs.backgroundImage!=='none') grad=true;
              const c=parse(cs.backgroundColor);
              if(c&&c.a>0) layers.push(c);
              if(c&&c.a===1) break;
              n=n.parentElement;}
            let base=layers.pop()||{r:255,g:255,b:255,a:1};
            while(layers.length) base=over(layers.pop(),base);
            return {colour:base, grad};};
          const bad=[], unknown=[];
          document.querySelectorAll('p,a,li,span,h1,h2,h3,h4,button,summary,figcaption,div,td').forEach(e=>{
            if(!e.textContent.trim()||e.children.length)return;
            const cs=getComputedStyle(e);
            if(cs.visibility==='hidden'||cs.display==='none'||parseFloat(cs.opacity)<0.5)return;
            if(!e.getClientRects().length)return;
            const fs=parseFloat(cs.fontSize), bold=parseInt(cs.fontWeight)>=700;
            const large=fs>=24||(fs>=18.66&&bold);
            const fg=parse(cs.color); if(!fg)return;
            const {colour,grad}=stack(e);
            const label=`${e.tagName.toLowerCase()}.${String(e.className).slice(0,28)} ${fs}px`;
            if(grad){unknown.push(label);return;}          // gradient — not resolvable
            const f=fg.a<1?over(fg,colour):fg;
            const a=lum(f), c=lum(colour);
            const r=(Math.max(a,c)+.05)/(Math.min(a,c)+.05);
            if(r < (large?3:4.5)) bad.push(`${label} ${r.toFixed(2)}:1`);
          });
          return {bad:[...new Set(bad)], unknown:[...new Set(unknown)]};
        }"""
        fails, unresolved = [], []
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        for u in urls:
            pg.goto(base + u); pg.wait_for_timeout(250)
            r = pg.evaluate(JS)
            fails += [f"{u}: {f}" for f in r["bad"]]
            unresolved += [f"{u}: {f}" for f in r["unknown"]]
        pg.close()
        check(not fails, "all text meets WCAG AA contrast",
              "banner chip shipped at 3.21:1", "\n".join(fails))
        if unresolved:
            print(f"  [NOTE] {len(unresolved)} element(s) sit on a gradient — contrast not "
                  f"machine-checkable, verify by eye if you changed them:")
            for u in unresolved[:6]:
                print(f"         {u}")

        # --- print height, at every width a device might lay out at --------
        # INCIDENT: the printable ran to two pages when printed from a phone.
        printable = [u for u in urls if (site / u.strip("/") / "index.html").exists()
                     and "@media print" in "".join(
                         (site / c).read_text() for c in ["water-hunt.css"] if (site / c).exists())
                     and u == "/water-hunt/"]
        over = []
        for u in printable:
            for w in PRINT_WIDTHS:
                pg = b.new_page(viewport={"width": w, "height": 1000})
                pg.goto(base + u); pg.wait_for_timeout(200)
                pg.emulate_media(media="print"); pg.wait_for_timeout(150)
                h = pg.evaluate("()=>{const s=document.querySelector('.sheet');"
                                "return s?Math.round(s.getBoundingClientRect().height):0}")
                if h > PRINT_BUDGET_PX: over.append(f"{u} @ {w}px wide: {h}px > {PRINT_BUDGET_PX}px")
                pg.close()
        check(not over, f"printables fit one page (<={PRINT_BUDGET_PX}px) at every layout width",
              "two-page printout when printed from a phone", "\n".join(over))

        # --- layout stability on a slow connection -------------------------
        # INCIDENT: a third-party audit measured CLS 0.266 on mobile — a failed
        # Core Web Vital — while local Lighthouse runs reported 0.000 and
        # showed nothing at all. The cause was font-display:swap: on localhost
        # the .woff2 files arrive in ~0ms, so the swap never fires and the
        # reflow it causes is invisible to every unthrottled test. A local CLS
        # number is meaningless for fonts unless the network is throttled.
        #
        # This check exists to make that class of bug impossible to ship again,
        # for fonts or anything else that lands late (injected DOM, lazy
        # images, web components). It throttles the network hard, then reads
        # the real layout-shift entries the browser recorded.
        shifty = []
        for u in urls:
            ctx = b.new_context(viewport={"width": 390, "height": 844},
                                device_scale_factor=3, is_mobile=True, has_touch=True)
            pg = ctx.new_page()
            ctx.new_cdp_session(pg).send("Network.emulateNetworkConditions", SLOW_NET)
            try:
                pg.goto(base + u, wait_until="load", timeout=90_000)
            except Exception as e:
                shifty.append(f"{u}: page did not load under throttling ({e})")
                ctx.close(); continue
            r = pg.evaluate("""
                new Promise((resolve) => {
                  let cls = 0; const src = new Set();
                  new PerformanceObserver((l) => {
                    for (const e of l.getEntries()) {
                      if (e.hadRecentInput) continue;
                      cls += e.value;
                      for (const s of (e.sources || [])) {
                        const n = s.node; if (!n) continue;
                        const el = n.nodeType === 3 ? n.parentElement : n;
                        if (el) src.add(el.tagName + (typeof el.className === 'string' && el.className
                          ? '.' + el.className.trim().split(/\\s+/)[0] : ''));
                      }
                    }
                  }).observe({type: 'layout-shift', buffered: true});
                  setTimeout(() => resolve({cls: +cls.toFixed(4), src: [...src].slice(0, 5)}), 6000);
                });
            """)
            if r["cls"] > CLS_BUDGET:
                shifty.append(f"{u}: CLS {r['cls']} > {CLS_BUDGET} — shifted: {', '.join(r['src']) or 'unknown'}")
            ctx.close()
        check(not shifty, f"CLS stays under {CLS_BUDGET} on a throttled connection",
              "font swap reflowing the page — invisible to any unthrottled test",
              "\n".join(shifty))

        # --- progressive enhancement ---------------------------------------
        # INCIDENT: an interactive quiz replaced a static list; with JS off the
        # fallback stayed hidden behind a display rule that beat [hidden].
        ctx = b.new_context(java_script_enabled=False)
        pg = ctx.new_page(); nojs = []
        for u in urls:
            pg.goto(base + u); pg.wait_for_timeout(150)
            empty = pg.evaluate("""()=>[...document.querySelectorAll('[id$="-app"]')]
                .filter(e=>e.offsetParent!==null && !e.textContent.trim()).map(e=>e.id)""")
            if empty: nojs.append(f"{u}: {empty} visible but empty without JS")
        ctx.close()
        check(not nojs, "no empty JS mount points when JavaScript is off",
              "interactive widget leaving a blank box for no-JS visitors", "\n".join(nojs))
        b.close()
    srv.shutdown()


def main():
    args = sys.argv[1:]
    if "--list" in args:
        print(__doc__)
        for fn in [check_git_identity, check_no_forbidden_strings, check_sections_exist,
                   check_page_metadata, check_internal_links,
                   check_print_css_self_contained, browser_checks]:
            print(f"\n{fn.__name__}\n{(fn.__doc__ or '').strip()}")
        return 0

    print("\nOPSEC")
    check_git_identity(); check_no_forbidden_strings()

    print("\nBUILD")
    site = build_site()
    print("  [PASS] jekyll build succeeded")

    print("\nSTRUCTURE & SEO")
    check_sections_exist(site); check_page_metadata(site); check_internal_links(site)
    check_print_css_self_contained()

    if "--static" not in args:
        print("\nRENDERED BEHAVIOUR")
        browser_checks(site)

    shutil.rmtree(site, ignore_errors=True)
    failed = [n for ok, n, _ in results if not ok]
    print(f"\n{len(results)-len(failed)}/{len(results)} checks passed")
    if failed:
        print("FAILED:"); [print(f"  - {n}") for n in failed]
        return 1
    print("All checks passed — safe to commit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
