import './styles.css';

type Stratagem = string | { name: string; cp: number };
type Detachment = {
  name: string;
  force: string;
  dp: number;
  rule: string;
  stratagems: Stratagem[];
  restrictions: string[];
};
type RulesData = { edition: string; factions: Record<string, Detachment[]> };

const factions = [
  'Space Marines','Black Templars','Blood Angels','Dark Angels','Deathwatch','Imperial Fists','Iron Hands','Raven Guard','Salamanders','Space Wolves','Ultramarines','White Scars','Astra Militarum','Adepta Sororitas','Adeptus Mechanicus','Adeptus Custodes','Grey Knights','Imperial Knights','Imperial Agents','Chaos Space Marines','Death Guard','Thousand Sons','World Eaters','Chaos Daemons','Chaos Knights',"Emperor's Children",'Aeldari','Drukhari','Genestealer Cults','Leagues of Votann','Necrons','Orks',"T'au Empire",'Tyranids'
];

let data: RulesData = { edition: '11th Edition', factions: {} };
let selectedFaction = factions[0];
let selectedDetachment = '';
const app = document.querySelector('#app')!;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));

async function boot() {
  try {
    const response = await fetch('./data/rules-data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    console.error(error);
  }
  render();
}

function render() {
  const detachments = data.factions[selectedFaction] ?? [];
  if (selectedDetachment && !detachments.some(d => d.name === selectedDetachment)) selectedDetachment = '';
  const active = detachments.find(d => d.name === selectedDetachment);

  app.innerHTML = `<div class="page">
    <header><div class="sigil">☠</div><div><small>ROUTINE 721</small><h1>DETACHMENT ARCHIVE</h1><p>WARHAMMER 40,000 · ${esc(data.edition)}</p></div></header>
    <main>
      <aside><h2>ALL FACTIONS</h2>${factions.map(f => `<button class="f ${f===selectedFaction?'on':''}" data-f="${esc(f)}">${esc(f)}${data.factions[f]?.length ? `<span>${data.factions[f].length}</span>` : ''}</button>`).join('')}</aside>
      <section>
        <div class="hero"><small>FACTION DOSSIER</small><h2>${esc(selectedFaction)}</h2><p>${detachments.length ? `${detachments.length} detachments in the local registry` : 'Detachment records are being added to the local registry.'}</p></div>
        ${active ? dossier(active) : detachments.length ? `<div class="det-list">${detachments.map(d => `<button class="det-card" data-d="${esc(d.name)}"><div><small>${esc(d.force)}</small><h3>${esc(d.name)}</h3></div><b>${d.dp} DP</b></button>`).join('')}</div>` : `<div class="empty"><strong>DETACHMENTS</strong><p>No detachment records are stored for this faction yet. The site has no external data dependency.</p></div>`}
      </section>
    </main>
  </div>`;

  document.querySelectorAll<HTMLButtonElement>('[data-f]').forEach(b => b.onclick = () => { selectedFaction = b.dataset.f!; selectedDetachment = ''; render(); });
  document.querySelectorAll<HTMLButtonElement>('[data-d]').forEach(b => b.onclick = () => { selectedDetachment = b.dataset.d!; render(); });
}

function dossier(d: Detachment) {
  return `<div class="back"><button data-back="1">← All detachments</button></div>
    <article><div class="top"><div><small>${esc(d.force)}</small><h3>${esc(d.name)}</h3></div><b>${d.dp} DP</b></div>
      <div class="grid">
        <div><h4>FORCE DISPOSITION</h4><p>${esc(d.force)}</p></div>
        <div><h4>DP</h4><p>${d.dp} Detachment Points</p></div>
        <div class="wide"><h4>DETACHMENT RULE</h4><p>${esc(d.rule)}</p></div>
        <div><h4>STRATAGEMS</h4>${d.stratagems.length ? `<ul>${d.stratagems.map(s => `<li>${esc(typeof s === 'string' ? s : `${s.name} — ${s.cp}CP`)}</li>`).join('')}</ul>` : '<p class="muted">Stratagem registry pending for this detachment.</p>'}</div>
        <div><h4>RESTRICTIONS</h4>${d.restrictions.length ? `<ul>${d.restrictions.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">No additional restriction recorded.</p>'}</div>
      </div>
    </article>`;
}

app.addEventListener('click', e => { const target = e.target as HTMLElement; if (target.closest('[data-back]')) { selectedDetachment = ''; render(); } });
boot();
