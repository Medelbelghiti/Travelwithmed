import { readFileSync, writeFileSync, existsSync } from "node:fs";

/**
 * Generates .audit/review.html: a local contact sheet for the 12 cover images.
 *
 * Why this exists: the agent cannot view images, and the Unsplash metadata is
 * only strong enough to verify 9 of the 12 destinations. Rather than guess, the
 * remaining judgement is handed back in its smallest possible form - one click
 * per destination - with the evidence for each candidate already on screen.
 *
 * The sheet pre-selects the highest-scoring VERIFIED candidate per destination so
 * the default is defensible, and it writes .audit/approved-images.json, which
 * apply-verified-images.ts then re-validates independently (dead ids, http,
 * dimensions, and "did this id actually come from our candidates").
 */

const CANDIDATE_FILE = ".audit/image-candidates.json";
const RECOMMEND_FILE = ".audit/recommended-images.json";
const OUT = ".audit/review.html";

type Scored = {
  slug: string;
  n: number;
  photoId: string;
  score: number;
  verdict: "VERIFIED" | "UNVERIFIABLE" | "REJECTED";
  reasons: string[];
  desc: string;
  location: string;
  credit: string;
  pageUrl: string;
  dims: string;
};

if (!existsSync(CANDIDATE_FILE)) throw new Error("run --source first");
const report = JSON.parse(readFileSync(CANDIDATE_FILE, "utf8")) as Record<
  string,
  { name: string; query: string; expect: string[]; candidates: { id: string; photoId: string; credit: string; pageUrl: string; desc: string; location: string; tags: string[]; width: number; height: number; enriched?: boolean }[] }
>;
const scored: Scored[] = existsSync(RECOMMEND_FILE)
  ? (JSON.parse(readFileSync(RECOMMEND_FILE, "utf8")) as { scored: Scored[] }).scored
  : [];

const scoreOf = (slug: string, n: number) => scored.find((s) => s.slug === slug && s.n === n);

const payload = Object.entries(report).map(([slug, r]) => {
  const cands = r.candidates.map((c, i) => {
    const s = scoreOf(slug, i + 1);
    return {
      n: i + 1,
      photoId: c.photoId,
      credit: c.credit,
      pageUrl: c.pageUrl,
      desc: c.desc,
      location: c.location,
      tags: c.tags,
      dims: `${c.width}x${c.height}`,
      enriched: !!c.enriched,
      score: s?.score ?? 0,
      verdict: s?.verdict ?? "UNVERIFIABLE",
      reasons: s?.reasons ?? [],
    };
  });
  const verified = cands.filter((c) => c.verdict === "VERIFIED").sort((a, b) => b.score - a.score);
  return {
    slug,
    name: r.name,
    query: r.query,
    candidates: cands,
    preselect: verified[0]?.photoId ?? null,
  };
});

const data = JSON.stringify(payload);

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Validation images - Riversmag</title>
<style>
  :root { --line:#e5e0d6; --ink:#1a1a17; --soft:#6b6b63; --ok:#1f7a5c; --bad:#a33; --warn:#8a6d1f; }
  * { box-sizing:border-box }
  body { font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; margin:0; background:#faf8f4; color:var(--ink) }
  header { padding:20px 28px; border-bottom:1px solid var(--line); background:#fff; position:sticky; top:0; z-index:5 }
  h1 { font-size:19px; margin:0 0 6px }
  .warn { background:#fff8e6; border-left:3px solid var(--warn); padding:10px 12px; border-radius:0 6px 6px 0; font-size:13.5px; margin:10px 0 0 }
  .bar { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:12px }
  button { font:inherit; padding:8px 14px; border-radius:8px; border:1px solid var(--line); background:#fff; cursor:pointer }
  button.primary { background:var(--ink); color:#fff; border-color:var(--ink) }
  button:disabled { opacity:.45; cursor:not-allowed }
  main { padding:22px 28px 80px }
  section { margin-bottom:34px }
  h2 { font-size:17px; margin:0 0 2px }
  .q { color:var(--soft); font-size:13px; margin:0 0 12px }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(215px,1fr)); gap:14px }
  .card { background:#fff; border:1px solid var(--line); border-radius:10px; overflow:hidden; cursor:pointer; transition:border-color .12s, box-shadow .12s }
  .card:hover { border-color:#b9b2a4 }
  .card.sel { border-color:var(--ok); box-shadow:0 0 0 2px rgba(31,122,92,.22) }
  .card.rej { opacity:.4 }
  .card img { width:100%; aspect-ratio:4/3; object-fit:cover; display:block; background:#eee }
  .meta { padding:9px 11px }
  .d { font-size:12.5px; line-height:1.35; min-height:32px }
  .t { font-size:11px; color:var(--soft); margin-top:5px; word-break:break-word }
  .badge { display:inline-block; font-size:10.5px; padding:2px 7px; border-radius:20px; margin-right:5px; vertical-align:middle }
  .b-ok { background:#e3f3ec; color:var(--ok) }
  .b-no { background:#f2ece4; color:var(--warn) }
  .b-xx { background:#f7e7e7; color:var(--bad) }
  .score { float:right; font-size:11px; color:var(--soft) }
  #out { width:100%; height:130px; font:12px/1.45 ui-monospace,Consolas,monospace; padding:10px; border:1px solid var(--line); border-radius:8px; background:#fff }
  .chosen { font-size:12.5px; color:var(--ok); font-weight:600 }
  .none { color:var(--warn); font-size:12.5px }
</style></head><body>
<header>
  <h1>Validation des images de couverture &mdash; 12 destinations</h1>
  <div class="warn">
    <strong>Aucune image ci-dessous n'a ete examinee visuellement.</strong> La selection proposee repose sur les
    metadonnees Unsplash (tags du photographe, geolocalisation, texte alternatif, slug de la page). Ce sont des
    indices, pas une verification. Clique sur la photo qui represente reellement la destination.
    Les cartes marquees <span class="badge b-xx">REJETE</span> sont ecartees (cadrage, sujets risqués).
  </div>
  <div class="bar">
    <button class="primary" id="save">Enregistrer approved-images.json</button>
    <button id="copy">Copier le JSON</button>
    <span id="status" class="chosen"></span>
  </div>
</header>
<main id="main"></main>
<script>
const DATA = ${data};
const sel = {};
for (const d of DATA) if (d.preselect) sel[d.slug] = d.preselect;
const main = document.getElementById('main');

function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

for (const d of DATA) {
  const sec = document.createElement('section');
  const verified = d.candidates.filter(c => c.verdict === 'VERIFIED').sort((a,b) => b.score - a.score);
  const head = '<h2>' + esc(d.name) + ' <span class="none" style="font-weight:400">(' + d.slug + ')</span></h2>'
    + '<p class="q">recherche : "' + esc(d.query) + '" &middot; '
    + (verified.length ? verified.length + ' candidat(s) avec preuve de lieu' : 'aucune preuve de lieu dans les metadonnees : jugement humain obligatoire') + '</p>';
  const grid = document.createElement('div');
  grid.className = 'grid';
  for (const c of d.candidates) {
    const card = document.createElement('div');
    card.className = 'card' + (c.verdict === 'REJECTED' ? ' rej' : '') + (sel[d.slug] === c.photoId ? ' sel' : '');
    const b = c.verdict === 'VERIFIED' ? 'b-ok' : c.verdict === 'REJECTED' ? 'b-xx' : 'b-no';
    const lab = c.verdict === 'VERIFIED' ? 'PREUVE' : c.verdict === 'REJECTED' ? 'REJETE' : 'SANS PREUVE';
    card.innerHTML = '<img loading="lazy" src="review/' + d.slug + '-' + c.n + '.jpg" alt="' + esc(c.desc) + '">'
      + '<div class="meta">'
      + '<div><span class="score">score ' + c.score + '</span><span class="badge ' + b + '">' + lab + '</span></div>'
      + '<div class="d">' + esc(c.desc || '(pas de texte alternatif)') + '</div>'
      + (c.location ? '<div class="t">geo : ' + esc(c.location) + '</div>' : '')
      + (c.tags.length ? '<div class="t">tags : ' + esc(c.tags.slice(0,8).join(', ')) + '</div>' : (c.enriched ? '' : '<div class="t">tags non recuperees (quota API)</div>'))
      + '<div class="t">' + esc(c.credit) + ' &middot; ' + esc(c.dims) + '</div>'
      + '</div>';
    card.onclick = () => {
      if (c.verdict === 'REJECTED') return;
      if (sel[d.slug] === c.photoId) delete sel[d.slug]; else sel[d.slug] = c.photoId;
      for (const el of grid.children) el.classList.remove('sel');
      if (sel[d.slug]) card.classList.add('sel');
      refresh();
    };
    grid.appendChild(card);
  }
  sec.innerHTML = head; sec.appendChild(grid);
  main.appendChild(sec);
}

const chosen = () => Object.fromEntries(Object.entries(sel).filter(([,v]) => v));
function refresh() {
  const n = Object.keys(chosen()).length;
  document.getElementById('status').textContent = n + '/12 destinations choisies';
  document.getElementById('out') && (document.getElementById('out').value = JSON.stringify(chosen(), null, 2));
}
const out = document.createElement('textarea'); out.id = 'out'; out.readOnly = true;
main.appendChild(out);
document.getElementById('save').onclick = () => {
  const blob = new Blob([JSON.stringify(chosen(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'approved-images.json';
  document.body.appendChild(a); a.click(); a.remove();
  document.getElementById('status').textContent = 'telecharge : remplace .audit/approved-images.json';
};
document.getElementById('copy').onclick = () => { out.select(); document.execCommand('copy'); };
refresh();
</script></body></html>`;

writeFileSync(OUT, html, "utf8");
const pre = payload.filter((d) => d.preselect).length;
console.log(`${OUT} ecrit.`);
console.log(`${pre}/12 destinations pre-selectionnees sur preuve de lieu.`);
console.log(`Les ${12 - pre} autres attendent un clic humain.`);
