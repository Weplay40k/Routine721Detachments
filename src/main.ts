import './styles.css';

const factions = [
  'Space Marines','Black Templars','Blood Angels','Dark Angels','Deathwatch','Imperial Fists','Iron Hands','Raven Guard','Salamanders','Space Wolves','Ultramarines','White Scars','Astra Militarum','Adepta Sororitas','Adeptus Mechanicus','Adeptus Custodes','Grey Knights','Imperial Knights','Imperial Agents','Chaos Space Marines','Death Guard','Thousand Sons','World Eaters','Chaos Daemons','Chaos Knights',"Emperor's Children",'Aeldari','Drukhari','Genestealer Cults','Leagues of Votann','Necrons','Orks',"T'au Empire",'Tyranids'
];

type D={name:string;force:string;dp:string;rule:string;stratagems:string[];restrictions:string[]};
const data:Record<string,D[]> = Object.fromEntries(factions.map(f=>[f,[]]));
let selected=factions[0];
const app=document.querySelector('#app')!;
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function render(){const ds=data[selected];app.innerHTML=`<div class="page"><header><div class="sigil">☠</div><div><small>ROUTINE 721</small><h1>DETACHMENT ARCHIVE</h1><p>WARHAMMER 40,000 · 11TH EDITION</p></div></header><main><aside><h2>ALL FACTIONS</h2>${factions.map(f=>`<button class="f ${f===selected?'on':''}" data-f="${esc(f)}">${esc(f)}</button>`).join('')}</aside><section><div class="hero"><small>FACTION DOSSIER</small><h2>${esc(selected)}</h2></div>${ds.length?ds.map(d=>`<article><div class="top"><h3>${esc(d.name)}</h3><b>${esc(d.dp)} DP</b></div><div class="grid"><div><h4>FORCE DISPOSITION</h4><p>${esc(d.force)}</p></div><div><h4>DETACHMENT RULE</h4><p>${esc(d.rule)}</p></div><div><h4>STRATAGEMS</h4><ul>${d.stratagems.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div><h4>RESTRICTIONS</h4><ul>${d.restrictions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div></article>`).join(''):`<div class="empty"><strong>DETACHMENTS</strong><p>Structured 11th-edition data will be loaded here. No external links are used.</p></div>`}</section></main></div>`;document.querySelectorAll<HTMLButtonElement>('[data-f]').forEach(b=>b.onclick=()=>{selected=b.dataset.f!;render()})}
render();
