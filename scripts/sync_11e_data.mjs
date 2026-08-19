import { readFile, writeFile } from 'node:fs/promises';

const UPSTREAM = 'https://raw.githubusercontent.com/wn-mitch/40kdc-data/main/data';
const FACTIONS = [
  ['adepta-sororitas','Adepta Sororitas'],['adeptus-astartes','Space Marines'],['adeptus-custodes','Adeptus Custodes'],['adeptus-mechanicus','Adeptus Mechanicus'],
  ['astra-militarum','Astra Militarum'],['agents-of-the-imperium','Imperial Agents'],['black-templars','Black Templars'],['blood-angels','Blood Angels'],['dark-angels','Dark Angels'],['deathwatch','Deathwatch'],
  ['grey-knights','Grey Knights'],['imperial-fists','Imperial Fists'],['iron-hands','Iron Hands'],['raven-guard','Raven Guard'],['salamanders','Salamanders'],['space-wolves','Space Wolves'],['ultramarines','Ultramarines'],['white-scars','White Scars'],
  ['imperial-knights','Imperial Knights'],['chaos-space-marines','Chaos Space Marines'],['chaos-daemons','Chaos Daemons'],['chaos-knights','Chaos Knights'],['death-guard','Death Guard'],['emperor-s-children',"Emperor's Children"],['thousand-sons','Thousand Sons'],['world-eaters','World Eaters'],
  ['aeldari','Aeldari'],['drukhari','Drukhari'],['genestealer-cults','Genestealer Cults'],['leagues-of-votann','Leagues of Votann'],['necrons','Necrons'],['orks','Orks'],['tau-empire',"T'au Empire"],['tyranids','Tyranids']
];

const slug = s => s.toLowerCase().replace(/[’']/g,'-').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const pretty = s => s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
async function get(path) {
  const r = await fetch(`${UPSTREAM}/${path}`);
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

let old = {};
try { old = JSON.parse(await readFile('public/rules-data.json','utf8')); } catch {}
const out = { edition:'11th Edition', generatedFrom:'40kdc-data 11th-edition structured data', factions:{} };

for (const [dir,name] of FACTIONS) {
  try {
    const [dets, enh, strat] = await Promise.all([
      get(`core/${dir}/detachments.json`), get(`core/${dir}/enhancements.json`), get(`core/${dir}/stratagems.json`)
    ]);
    const enhBy = new Map();
    for (const e of enh.filter(x=>x.game_version?.edition==='11th')) {
      const list = enhBy.get(e.detachment_id) ?? []; list.push({name:e.name,points:e.cost,keywords:e.keyword_restrictions ?? []}); enhBy.set(e.detachment_id,list);
    }
    const stratBy = new Map();
    for (const s of strat.filter(x=>x.game_version?.edition==='11th' && x.category==='detachment')) {
      const list = stratBy.get(s.detachment_id) ?? []; list.push({name:s.name,cp:s.cp_cost,type:s.type,phases:s.phases ?? [],turn:s.player_turn}); stratBy.set(s.detachment_id,list);
    }
    out.factions[name] = dets.filter(d=>d.game_version?.edition==='11th').map(d=>{
      const prior = (old.factions?.[name] ?? []).find(x=>x.name===d.name);
      return {
        name:d.name,
        force:(d.force_dispositions ?? []).join(', ') || prior?.force || '—',
        dp:d.detachment_points,
        rule: prior?.rule && !/^Detachment rule:/i.test(prior.rule) ? prior.rule : `Detachment rule: ${pretty(d.detachment_rule_id ?? 'see detachment rule')}. This detachment is built around the listed force disposition and its associated army/unit restrictions.`,
        enhancements: enhBy.get(d.id) ?? [],
        stratagems: stratBy.get(d.id) ?? [],
        restrictions: d.tags?.length ? d.tags.map(t=>`Keyword/tag: ${t}`) : (prior?.restrictions ?? [])
      };
    });
    console.log(`${name}: ${out.factions[name].length} detachments, ${enh.filter(x=>x.game_version?.edition==='11th').length} enhancements, ${stratBy.size ? strat.filter(x=>x.game_version?.edition==='11th' && x.category==='detachment').length : 0} stratagems`);
  } catch (e) {
    console.warn(`Skipping ${name}: ${e.message}`);
    if (old.factions?.[name]) out.factions[name] = old.factions[name];
  }
}

await writeFile('public/rules-data.json', JSON.stringify(out,null,2)+'\n');
const missing = FACTIONS.filter(([,n])=>!(out.factions[n]?.length));
if (missing.length) throw new Error(`No detachment data for: ${missing.map(([,n])=>n).join(', ')}`);
console.log(`Wrote ${Object.values(out.factions).reduce((n,x)=>n+x.length,0)} detachments across ${Object.keys(out.factions).length} factions.`);
