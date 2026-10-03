#!/usr/bin/env node
// Read copies of installed PF2e packs; never open Foundry's live databases.
import {createRequire} from 'node:module';
import {cp,mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
const [appRoot,systemRoot,outputRoot]=process.argv.slice(2);
if(!appRoot||!systemRoot||!outputRoot)throw Error('Usage: node tools/export-installed-test-fixtures.mjs FOUNDRY_APP PF2E_SYSTEM OUTPUT');
const require=createRequire(path.resolve(appRoot,'package.json'));
const {ClassicLevel}=require('classic-level');
const temp=await mkdtemp(path.join(tmpdir(),'pf2e-fixtures-'));
const packs={};
try{
 for(const name of ['spells','spell-effects','feats']){
  const target=path.join(temp,name);await cp(path.join(systemRoot,'packs',name),target,{recursive:true});
  const db=new ClassicLevel(target,{valueEncoding:'json'});packs[name]=[];
  try{for await(const [key,doc]of db.iterator())if(key.startsWith('!items!')&&doc.system)packs[name].push(doc);}finally{await db.close();}
 }
 const refs=new Map();for(const [pack,collection]of [['spell-effects','spell-effects'],['feats','feats-srd']])for(const doc of packs[pack])refs.set(`Compendium.pf2e.${collection}.Item.${doc._id}`,`Compendium.pf2e.${collection}.Item.${doc.name}`);
 const provenance={pf2e:JSON.parse(await readFile(path.join(systemRoot,'system.json'),'utf8')).version,normalization:'Description UUIDs for spell-effects and feats-srd are restored to source-name form using installed ID/name mappings. Installed-ID tests translate them back. Mechanics unchanged.',files:{}};
 for(const pack of ['spells','spell-effects'])for(const doc of packs[pack]){
  const original=JSON.stringify(doc);const slug=doc.system.slug??doc.name.toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(doc.system.description?.value)doc.system.description.value=doc.system.description.value.replace(/Compendium\.pf2e\.(?:spell-effects|feats-srd)\.Item\.[a-zA-Z0-9]{16}(?=\])/g,uuid=>refs.get(uuid)??uuid);
  const folder=pack==='spells'?`spells/spells/${doc.system.traits?.value?.includes('cantrip')?'cantrip':`rank-${doc.system.level.value}`}`:'spell-effects';
  const relative=`${folder}/${slug}.json`;await mkdir(path.join(outputRoot,folder),{recursive:true});await writeFile(path.join(outputRoot,relative),JSON.stringify(doc,null,2)+'\n');
  provenance.files[relative]={id:doc._id,installedSourceSHA256:createHash('sha256').update(original).digest('hex')};
 }
 await writeFile(path.join(outputRoot,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');console.log(`Exported ${Object.keys(provenance.files).length} fixtures for PF2e ${provenance.pf2e}`);
}finally{await rm(temp,{recursive:true,force:true});}
