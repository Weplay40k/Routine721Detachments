import { readFile, writeFile } from 'node:fs/promises';

const API='https://api.github.com/repos/wn-mitch/40kdc-data/git/trees/main?recursive=1';
const RAW='https://raw.githubusercontent.com/wn-mitch/40kdc-data/main/data';
const headers={Accept:'application/vnd.github+json','User-Agent':'Routine721Detachments'};
const get=async url=>{const r=await fetch(url,{headers});if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json()};
const pretty=s=>s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
let old={};try{old=JSON.parse(await readFile('public/rules-data.json','utf8'))}catch{}
const tree=await get(API);
const dirs=[...new Set(tree.tree.filter(x=>x.type==='blob'&&/^data\/core\/[^/]+\/detachments\.json$/.test(x.path)).map(x=>x.path.split('/')[2]))];
const out={edition:'11th Edition',generatedFrom:'40kdc-data structured 11th-edition records',factions:{}};
for(const dir of dirs){
  try{
    const [factionRows,dets,enh,strat]=await Promise.all([
      get(`${RAW}/core/${dir}/factions.json`),get(`${RAW}/core/${dir}/detachments.json`),get(`${RAW}/core/${dir}/enhancements.json`),get(`${RAW}/core/${dir}/stratagems.json`)
    ]);
    const factionName=factionRows.find(x=>x.name)?.name||pretty(dir);
    const enhBy=new Map(), stratBy=new Map();
    for(const e of enh.filter(x=>x.game_version?.edition==='11th')){const a=enhBy.get(e.detachment_id)||[];a.push({name:e.name,points:e.cost,keywords:e.keyword_restrictions||[]});enhBy.set(e.detachment_id,a)}
    for(const s of strat.filter(x=>x.game_version?.edition==='11th'&&s.category==='detachment')){const a=stratBy.get(s.detachment_id)||[];a.push({name:s.name,cp:s.cp_cost,type:s.type,phases:s.phases||[],turn:s.player_turn});stratBy.set(s.detachment_id,a)}
    out.factions[factionName]=dets.filter(d=>d.game_version?.edition==='11th').map(d=>{const prior=(old.factions?.[factionName]||[]).find(x=>x.name===d.name);return{name:d.name,force:(d.force_dispositions||[]).join(', ')||prior?.force||'—',dp:d.detachment_points,rule:prior?.rule||`Detachment rule: ${pretty(d.detachment_rule_id||'see detachment rule')}. Review this detachment's listed force disposition, unit scope and keywords when building the army.`,enhancements:enhBy.get(d.id)||[],stratagems:stratBy.get(d.id)||[],restrictions:d.tags?.length?d.tags.map(t=>`Keyword/tag: ${t}`):(prior?.restrictions||[])}});
    console.log(`${factionName}: ${out.factions[factionName].length} detachments`);
  }catch(e){console.warn(`Skipping ${dir}: ${e.message}`)}
}
const names=Object.keys(out.factions);if(!names.length)throw new Error('Structured source returned no factions');
await writeFile('public/rules-data.json',JSON.stringify(out,null,2)+'\n');
console.log(`Wrote ${names.length} factions and ${Object.values(out.factions).reduce((n,a)=>n+a.length,0)} detachments.`);
