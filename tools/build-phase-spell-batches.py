#!/usr/bin/env python3
"""Planning-only phase and language cohorts; never imported by the runtime."""
import argparse, collections, hashlib, html, json, math, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'reports/phase-spell-batches'
PHASES = {1:'GM corrections',2:'Outcome-specific Effects and conditions',3:'Ongoing rules and recurring saves',4:'Immediate resolution and choices',5:'Transformations',6:'Summons and created creatures',7:'Spatial effects and movement',8:'Rituals',9:'Catalog completion and unresolved classification'}
# Families describe shared mechanics; a match schedules review, never enables a spell.
PATTERNS = [
 ('linked-condition',r'(?:as long as|while|until)[^.!?]{0,55}(?:sickened|frightened|slowed|stupefied|enfeebled|clumsy|paralyzed|blinded)', 'Condition-dependent lifetime'),
 ('repeat-save',r'(?:attempt|attempts|make|makes|repeat|repeats|can attempt)[^.!?]{0,65}(?:new|another|each|every|end of|start of)[^.!?]{0,65}(?:save|saving throw)|(?:end|start) of[^.!?]{0,65}(?:save|saving throw)', 'Recurring saving throw'),
 ('sustain',r'\bsustain(?:ed|ing)?\b', 'Sustain'),
 ('aura',r'\baura\b', 'Aura membership'),
 ('turn-trigger',r'(?:start|end|beginning) of (?:each|every|its|their|your|the target.s|the creature.s)[^.!?]{0,35}turn', 'Turn trigger or boundary'),
 ('exposure',r'(?:enters?|moves? into|starts? (?:its|their) turn|ends? (?:its|their) turn|once per round|once each round)', 'Area exposure'),
 ('temporary-immunity',r'(?:temporarily immune|immune[^.!?]{0,45}(?:hour|minute|day|round))', 'Temporary immunity'),
 ('spell-ending',r'(?:when|after|if)[^.!?]{0,45}(?:spell ends|spell is dismissed|effect ends)|(?:dismiss)[^.!?]{0,30}(?:spell|effect)', 'Ending or dismissal'),
 ('critical-rider',r'(?:critical failure|critically fails?)[^.!?]{0,140}', 'Save-result condition rider'),
 ('basic-save',r'\bbasic\s+(?:reflex|fortitude|will)(?:\s+save|\s+saving throw)?|(?:reflex|fortitude|will)\|basic', 'Basic-save damage'),
 ('persistent-damage',r'\bpersistent\b[^.!?]{0,30}(?:damage|bleed)|\bpersistent[ ,\]]', 'Persistent damage'),
 ('speed-grant',r'\b(?:gains?|gaining|grants?|granting|gives?)\b[^.!?]{0,45}\b(?:speed|speeds)\b', 'Granted movement speed'),
 ('condition',r'\b(?:blinded|clumsy|confused|dazzled|deafened|doomed|drained|enfeebled|fascinated|fatigued|fleeing|frightened|immobilized|off.guard|paralyzed|petrified|prone|quickened|restrained|sickened|slowed|stunned|stupefied)\b', 'Native condition'),
 ('healing',r'(?:regains?|restores?|restore|heals?)[^.!?]{0,55}(?:hit points|\bhp\b)|\bhealing\b', 'Healing / recipient mode'),
 ('attack',r'\bspell attack\b|\bmake[^.!?]{0,30}\bstrike\b', 'Attack and dependent result'),
 ('counteract',r'\bcounteract(?:ing)?\b', 'Counteract'),
 ('choice',r'\bchoose (?:one|two|a|an|the|any)|\b(?:one|two|three).action\b', 'Choice / casting variant'),
 ('form',r'\bbattle form\b|\byou (?:transform|turn) (?:yourself )?into\b|\b(?:target|creature|your body) (?:transforms?|turns?) into\b|\btransform (?:the target|a creature|one creature) into\b|\b(?:you|target|creature) (?:take|takes|assume|assumes) (?:on )?(?:the |a )?[^.!?]{0,25}\bform\b', 'Creature transformation'),
 ('incarnate',r'\b(?:arrive|depart)\b', 'Incarnate arrival/departure'),
 ('created-entity',r'\b(?:create|creates|summon|summons)\b[^.!?]{0,50}\b(?:thralls?|minions?|underlings?)\b', 'Created entities'),
 ('summon',r'\byou summon (?:an? |one |up to )?[^.!?]{0,70}(?:creature|animal|undead|elemental|fey|dragon|fiend|construct|celestial)|\b(?:create|creates) (?:an? )?(?:minion|creature)', 'Creature creation'),
 ('teleport',r'\bteleport(?:s|ed|ation)?\b', 'Teleportation'),
 ('wall',r'\b(?:create|creates|conjure|conjures|raise|raises|form|forms)\b[^.!?]{0,65}\bwall\b', 'Wall / barrier'),
 ('terrain',r'\b(?:difficult terrain|greater difficult terrain|hazardous terrain|uneven ground)\b', 'Terrain'),
 ('forced-move',r'\b(?:pushed|pulled|shoved|knocked back|push|pull)\b[^.!?]{0,65}(?:feet|foot|square)|(?:moves?|move) (?:it|the target|the creature)\b[^.!?]{0,50}(?:feet|square)', 'Forced movement'),
 ('movement',r'\b(?:you|target|creature) (?:can |must |immediately )?(?:stride|step|leap|fly|swim|burrow|climb)\b', 'Movement action'),
 ('object-create',r'\byou (?:create|conjure) (?:an? |one |up to )[^.!?]{0,60}\b(?:object|bridge|door|shelter|structure|platform|passage|pit|cage)\b', 'Object / structure creation'),
 ('affliction',r'\bstage [1-6]\b|\baffliction\b', 'Delegated affliction'),
 ('detection',r'\b(?:detect|learn|sense|information|communicate|message|scry|divination)\b', 'Information / adjudication'),
 ('bonus',r'\b(?:status|circumstance|item) (?:bonus|penalty)\b|\b(?:resistance|weakness)\b', 'Modifier / resistance'),
]
REGEX = {key:re.compile(pattern,re.I) for key,pattern,_ in PATTERNS}
LABELS = {key:label for key,_,label in PATTERNS}
TESTS = {
 'linked-condition':'Exact root grant; partial/full recovery; duplicate casts; unrelated stronger condition; immunity; removal; reload and detachment.',
 'repeat-save':'Initial versus repeated outcomes; timing and DC; incapacitation; success transitions; skipped turns; reload; no replay after uncertainty.',
 'sustain':'First versus later Sustain; action/exposure limits; missed deadline; source loss; dismissal; selective cleanup.',
 'aura':'Membership entry/exit; radius changes; exposure frequency; native modifiers; uncertain placement; owner/GM controls.',
 'turn-trigger':'Caster versus target anchor; start versus end; current versus next turn; tied initiative; skipped turns and removal ON/OFF.',
 'exposure':'Initial/enter/start/end triggers separately; repeat limits; movement and re-entry; source removal; target changes.',
 'temporary-immunity':'Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.',
 'spell-ending':'Expiry versus dismissal versus action-use; successors; permanent consequences; removal ON/OFF; interrupted cleanup.',
 'critical-rider':'All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.',
 'basic-save':'All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.',
 'persistent-damage':'Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.',
 'condition':'All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.',
 'healing':'Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.',
 'attack':'Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.',
 'counteract':'Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.',
 'choice':'Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.',
 'speed-grant':'Native speed mode/value; heightened speeds; restrictions; duration; overlap; effect ending does not move the token.',
 'form':'Every form/rank option; native statistics; restrictions; granted actions; space; recharge; preserve unrelated changes on reversion.',
 'incarnate':'Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.',
 'created-entity':'Entity statistics and placement; independent actions; control; triggered creation; limits; cleanup and source loss.',
 'summon':'Legal creature selection/rank; missing data; placement; ownership; independent cast identity; duration; detachment.',
 'teleport':'Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.',
 'wall':'Dimensions and placement; collision/sight; occupied spaces; defenses/HP; permanent versus temporary cleanup.',
 'terrain':'Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.',
 'forced-move':'Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.',
 'movement':'Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.',
 'object-create':'Object eligibility/size; placement; durability; actor/token/document identity; permanent consequences.',
 'affliction':'Initial outcomes; affliction handoff explicitly shown; no claim of delegated progression automation.',
 'detection':'Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.',
 'bonus':'Modifier type/selectors; stacking; choice predicates; native rules; duration and selective cleanup.',
 'native-effect':'Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.',
 'degree-outcome':'All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.',
 'immediate-other':'Identify deterministic effect, recipients and choices; separate adjudication; missing mechanics remain explicit.',
 'ritual':'Confirmed ceremony degree; missing DC; all rank/outcome branches; delayed triggers; source loss; independent lasting effects.',
 'timed-other':'Identify the actual retained contribution; duration grammar; source/recipient anchor; expiry versus permanent aftermath; source loss.',
 'review':'Read full source and referenced rules; decide owning workflow before implementation; identify missing mechanic or accepted exception.',
}

def plain(raw):
    raw = re.sub(r'@UUID\[[^\]]+\]\{([^}]+)\}',r'\1',raw)
    raw = re.sub(r'@UUID\[([^\]]+)\]',lambda m:'reference '+m.group(1).rsplit('.',1)[-1],raw)
    raw = re.sub(r'@(?:Check|Damage|Template)\[([^\]]+)\](?:\{([^}]+)\})?',lambda m:m.group(2) or m.group(1),raw)
    raw = re.sub(r'</(?:p|li|h\d)>|<br\s*/?>','. ',raw)
    return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',raw))).strip()

def normalized(text,name):
    text=text.lower().replace(name.lower(),'spell')
    text=re.sub(r'\b\d+d\d+(?:\s*[+-]\s*\d+)?\b',' dice ',text)
    text=re.sub(r'\b\d+(?:\.\d+)?\b',' number ',text)
    text=re.sub(r'\b(?:reflex|fortitude|will)\b','save_stat',text)
    text=re.sub(r'\b(?:blinded|clumsy|confused|dazzled|deafened|doomed|drained|enfeebled|fascinated|fatigued|fleeing|frightened|immobilized|off.guard|paralyzed|petrified|prone|quickened|restrained|sickened|slowed|stunned|stupefied)\b','condition',text)
    return re.sub(r'\s+',' ',re.sub(r'[^a-z\s]',' ',text)).strip()

def excerpt(text,match):
    start=max(text.rfind('. ',0,match.start())+2,0)
    stop=text.find('. ',match.end())
    return text[start:min(len(text),stop+1 if stop>=0 else len(text))][:300]

def features(plan,source):
    system=source['system']; description=system.get('description',{}); raw=description.get('value','')
    if description.get('gm') and description['gm']!=raw: raw+='\n'+description['gm']
    text=plain(raw)
    hits={key:excerpt(text,m) for key,_,_ in PATTERNS if (m:=REGEX[key].search(text))}
    traits=set(system.get('traits',{}).get('value',[])); save=(system.get('defense') or {}).get('save') or {}
    effects=[e for o in plan['resolution']['outcomes'].values() for e in o.get('effects',[])]
    target_text=system.get('target',{}).get('value','')
    if 'form' in hits and target_text and not re.search(r'creature|humanoid|animal|you|self|willing',target_text,re.I) and 'polymorph' not in traits:
        hits.pop('form')
    if 'aura' in hits and 'aura' not in traits and not re.search(r'(?:emit|emanate|create|radiate)[^.!?]{0,40}aura|aura[^.!?]{0,35}(?:radius|extends|emanation)',text,re.I):
        hits.pop('aura')
    # Require an affirmative operation, not a comparison, immunity or terrain-negation mention.
    if 'teleport' in hits and 'teleportation' not in traits and not re.search(r'\b(?:you|target|creature|object) (?:can |immediately |instantly |is |are )?teleport(?:s|ed)?\b|\bteleport (?:yourself|the target|a creature|the creature)',text,re.I):
        hits.pop('teleport')
    if 'terrain' in hits and not re.search(r'(?:area|ground|squares?|terrain|spaces?|floor)[^.!?]{0,80}(?:becomes?|is|are|creates?|counts?)[^.!?]{0,45}(?:difficult|hazardous) terrain',text,re.I):
        hits.pop('terrain')
    if 'forced-move' in hits and not re.search(r'(?:push|pull|shove|knock)[^.!?]{0,45}(?:target|creature|foe|enemy|enemies)|(?:target|creature|foe|enemy|enemies)[^.!?]{0,40}(?:pushed|pulled|shoved|knocked)',text,re.I):
        hits.pop('forced-move')

    # Inline prose plus structured source, not a spell-name classifier.
    flags={
      'save':bool(save.get('statistic')) or plan['resolution']['kind']=='save',
      'basic':save.get('basic') is True,
      'form':'polymorph' in traits or 'form' in hits,
      'summon':'summon' in traits or 'incarnate' in traits or 'created-entity' in hits or ('summon' in hits and bool(re.search(r'\b(?:minion|acts?|actions?|level|statistic|summoned creature)\b',text,re.I)) and not (save.get('basic') and not system.get('duration',{}).get('value'))),
      'spatial':bool({'teleport','wall','terrain','forced-move','movement','object-create'}&hits.keys()) or 'teleportation' in traits,
      'ongoing':system.get('duration',{}).get('sustained',False) or bool({'linked-condition','repeat-save','sustain','aura','exposure','spell-ending'}&hits.keys()) or 'aura' in traits,
      'timed': bool(system.get('duration',{}).get('value')) or bool({'turn-trigger','temporary-immunity','linked-condition','persistent-damage'}&hits.keys()) or any(e.get('duration') or e.get('whileCondition') for e in effects),
      'outcome':bool(effects) or bool(plan.get('nativeEffects',{}).get('onUse')) or 'condition' in hits or 'bonus' in hits,
      'immediate':bool({'attack','healing','counteract','choice','detection','speed-grant'}&hits.keys()) or (bool(system.get('damage')) and not save.get('statistic')),
    }
    return text,hits,traits,save,flags

def classify(plan,source,ritual):
    text,hits,traits,save,f=features(plan,source)
    phases=set()
    if f['save'] or f['outcome']: phases.add(2)
    if f['ongoing'] or f['timed']: phases.add(3)
    if f['immediate'] or (not f['save'] and not f['outcome']): phases.add(4)
    if f['form']: phases.add(5)
    if f['summon']: phases.add(6)
    if f['spatial']: phases.add(7)
    if ritual:
        primary=8; phases.add(8); reason='Included ritual in accepted scope manifest.'; family='ritual'
    elif f['summon']:
        primary=6; reason='Summon/incarnate trait or explicit entity-creation clause; control model must be reviewed.'; family='incarnate' if 'incarnate' in traits else 'created-entity' if 'created-entity' in hits and 'summon' not in traits else 'summon'
    elif f['form']:
        primary=5; reason='Polymorph trait or explicit transformation clause.'; family='form'
    elif f['spatial']:
        primary=7; reason='Explicit placement, terrain, teleportation or movement clause.'
        family=next(x for x in ['teleport','wall','object-create','terrain','forced-move','movement'] if x in hits or (x=='teleport' and 'teleportation' in traits))
    elif f['ongoing']:
        primary=3; reason='Explicit ongoing obligation, linked lifetime, Sustain, aura or exposure clause.'
        family=next((x for x in ['linked-condition','repeat-save','sustain','aura','exposure','spell-ending'] if x in hits),'aura')
    elif 'attack' in hits or 'healing' in hits:
        primary=4; reason='Immediate attack or healing workflow, including a dependent save/recipient branch.'; family='attack' if 'attack' in hits else 'healing'
    elif f['save'] or f['outcome']:
        primary=2; reason='Structured save, compiled outcome/native Effect, or condition/modifier clause.'
        family=next((x for x in ['affliction','temporary-immunity','persistent-damage'] if x in hits), 'critical-rider' if f['basic'] and 'condition' in hits else 'condition' if 'condition' in hits else 'basic-save' if f['basic'] else 'degree-outcome' if f['save'] else 'native-effect')
    elif f['immediate']:
        primary=4; reason='Immediate attack, healing, choice, counteract, information or damage structure.'
        family=next((x for x in ['attack','healing','counteract','speed-grant','choice','detection'] if x in hits),'immediate-other')
    elif f['timed']:
        primary=3; reason='Structured non-instant duration; exact contribution and ending need source review.'; family='timed-other'
    else:
        primary=9; reason='No sufficiently specific implemented classification signal; full-source triage needed.'; family='review'
    phases.add(primary)
    # Phases 1 and 9 are cross-cutting acceptance work, not exclusive spell families.
    duration=source['system'].get('duration',{})
    return dict(primaryPhase=primary,phases=sorted(phases),family=family,reason=reason,
        assignment='candidate — review before implementation',phaseEvidence={'sourceSave':save,'sourceDuration':duration,'sourceTraits':sorted(traits),'primaryReason':reason},matchedClauses=hits,text=text,
        normalized=normalized(' '.join(dict.fromkeys(hits.values())) or text,source['name']), save=save,
        duration=duration,traits=sorted(traits), signals=f)

def vectors(rows):
    # Adjacent words retain more rule syntax than a bag of isolated keywords.
    docs=[]; df=collections.Counter()
    stop={'the','a','an','of','to','and','or','in','is','it','you','your','its','this','that','as','for','with','on','be','can'}
    for row in rows:
        words=row['normalized'].split()
        terms=[w for w in words if w not in stop]+[' '.join(words[i:i+2]) for i in range(len(words)-1)]
        counts=collections.Counter(terms);docs.append(counts);df.update(counts.keys())
    n=len(rows)
    for row,counts in zip(rows,docs):
        v={t:(1+math.log(c))*math.log(1+n/(1+df[t])) for t,c in counts.items()}
        norm=math.sqrt(sum(x*x for x in v.values())) or 1
        row['_vector']={t:x/norm for t,x in v.items()}

def similarity(a,b):
    av,bv=a['_vector'],b['_vector']
    if len(av)>len(bv):av,bv=bv,av
    return sum(v*bv.get(k,0) for k,v in av.items())

def cohorts(rows):
    buckets=collections.defaultdict(list)
    for row in rows: buckets[(row['primaryPhase'],row['family'])].append(row)
    batches=[]
    for (phase,family),pool in sorted(buckets.items()):
        # Start with the most connected description; avoid arbitrary alphabetical anchors.
        neighbors={r['id']:sorted(((similarity(r,s),s['id']) for s in pool if s is not r),reverse=True) for r in pool}
        remaining={r['id']:r for r in pool}
        while remaining:
            anchor=max(remaining.values(),key=lambda r:(sum(s for s,i in neighbors[r['id']][:6]),r['name']))
            members=[anchor];del remaining[anchor['id']]
            for score,ident in neighbors[anchor['id']]:
                if ident in remaining and score>=.15 and len(members)<12:
                    members.append(remaining.pop(ident))
            members=[anchor]+sorted(members[1:],key=lambda r:(-similarity(anchor,r),r['name']))
            batches.append(dict(phase=phase,family=family,anchor=anchor,members=members))
    # Within a family, prioritize cohorts with unenabled members and existing test anchors.
    batches.sort(key=lambda b:(b['phase'],b['family'],-sum(not r['enabledRoute'] for r in b['members']),-len(b['members']),b['anchor']['name']))
    counters=collections.Counter()
    for batch in batches:
        counters[batch['phase']]+=1;batch['id']=f"P{batch['phase']}-{counters[batch['phase']]:03d}"
        for row in batch['members']:
            row['batch']=batch['id'];row['similarityToAnchor']=round(similarity(batch['anchor'],row),3)
    return batches

def mdcell(value):return str(value).replace('|','/').replace('\n',' ')
def table(headers,records):return '| '+' | '.join(headers)+' |\n| '+' | '.join('---' for _ in headers)+' |\n'+'\n'.join('| '+' | '.join(mdcell(x) for x in r)+' |' for r in records)+'\n'
def status(row):return 'Partial Effect' if row['nativeEffectPartial'] else 'Note only (resolved)' if row.get('noteResolved') else 'Enabled route' if row['enabledRoute'] else 'Note only' if row.get('route')=='note' else 'Effect + note' if row.get('route')=='effect-note' else 'Not enabled'
def source_link(row):return '['+row['name']+'](../../.cache/pf2e-test-fixtures/'+row['sourceFile']+')'

def main():
    parser=argparse.ArgumentParser();parser.add_argument('compiler_report');args=parser.parse_args()
    compiled=json.loads(Path(args.compiler_report).read_text())
    enabled=json.loads((ROOT/'reports/spell-enablement.json').read_text());by_id={r['id']:r for r in enabled['rows']}
    manifest=json.loads((ROOT/'docs/research/ritual-scope-manifest.json').read_text());rituals={r['id']:r for r in manifest['rituals']}
    rows=[];excluded=[]
    for plan in compiled['plans']:
        ident=plan['source']['id'];ritual=rituals.get(ident)
        if ritual and ritual['status']!='included':excluded.append(ritual);continue
        source=json.loads((ROOT/'.cache/pf2e-test-fixtures'/plan['source']['sourceFile']).read_text())
        row=dict(by_id[ident]);row.update(classify(plan,source,ritual));row['rank']=source['system']['level']['value']
        row['descriptionSha256']=hashlib.sha256(json.dumps(source['system']['description'],sort_keys=True).encode()).hexdigest()
        row['descriptionFields']=[k for k in ['value','gm'] if source['system']['description'].get(k)]
        row['conditionSignatures']=[{k:e[k] for k in ['slug','value','duration','whileCondition','endsWhen'] if k in e} for o in plan['resolution']['outcomes'].values() for e in o.get('effects',[])]
        row['target']=source['system'].get('target',{}).get('value','');row['heightening']=source['system'].get('heightening')
        rows.append(row)
    assert len(rows)==1870 and len({r['id'] for r in rows})==1870
    vectors(rows);batches=cohorts(rows);OUT.mkdir(parents=True,exist_ok=True)
    summary=[]
    for phase in range(2,10):
        primary=[r for r in rows if r['primaryPhase']==phase];associated=[r for r in rows if phase in r['phases']]
        summary.append([phase,PHASES[phase],len(primary),sum(r['enabledRoute'] for r in primary),len(primary)-sum(r['enabledRoute'] for r in primary),len(associated)])
        lines=[f'# Phase {phase}: {PHASES[phase]}','',f'{len(primary)} primary worklist entries; {len(associated)} entries with this phase signal including cross-phase dependencies. Assignments are planning candidates, not verified semantic classifications.','', 'Descriptions are grouped first by rule family, then by normalized word/bigram similarity. Each cohort has at most 12 entries. Similarity is a discovery aid; check the full source and differing values/branches before sharing implementation or evidence.','']
        family_counts=collections.Counter(r['family'] for r in primary)
        lines += ['## Rule-family index','',table(['Rule family','Spells','Not enabled','Wording cohorts'],[[LABELS.get(f,f),n,sum(not r['enabledRoute'] for r in primary if r['family']==f),sum(b['phase']==phase and b['family']==f for b in batches)] for f,n in sorted(family_counts.items())]),'']
        if phase==9:
            lines += ['Phase 9 acceptance covers **all 1,870 spells** in the [master list](all-spells.md). The primary entries below are only the unresolved classification queue, not the complete Phase 9 scope.','']
        for batch in [b for b in batches if b['phase']==phase]:
            anchor=batch['anchor'];family=batch['family'];members=batch['members']
            lines += [f"## {batch['id']} — {LABELS.get(family,family.replace('-',' ').title())}: {anchor['name']}",'',f"**{len(members)} spells; {sum(not r['enabledRoute'] for r in members)} not enabled.** Suggested source-reading anchor: {anchor['name']}. This is not a verified-test designation.",'',f"**Test contract:** {TESTS[family]}",'']
            common=collections.Counter(k for r in members for k in r['matchedClauses'])
            shared=[LABELS[k] for k,count in common.most_common() if count==len(members)]
            lines += ['**Shared signals:** '+(', '.join(shared) or 'Structured source family; inspect the descriptions.'),'']
            quote=anchor['matchedClauses'].get(family) or next(iter(anchor['matchedClauses'].values()),anchor['text'][:240])
            lines += ['**Anchor wording:** '+quote,'']
            lines += [table(['Spell / source','Rank','Module route','Other phase signals','Similarity to anchor','Mechanical differences to preserve'],[
                [source_link(r),r['rank'],status(r),', '.join(str(p) for p in r['phases'] if p!=phase) or '—',f"{r['similarityToAnchor']:.2f}",f"{r['save'].get('statistic') or 'no primary save'}; {'basic' if r['save'].get('basic') else 'non-basic/no save'}; duration {r['duration'].get('value') or 'outcome/text'}; target {r['target'] or 'source/area/text'}"] for r in members]),'']
        dependencies=[r for r in associated if r['primaryPhase']!=phase]
        if dependencies:
            lines += ['## Cross-phase dependency list','','These spells are owned by another primary worklist; reuse their listed batch instead of implementing them twice.','',table(['Spell','Primary phase / batch','Matched signals'],[[r['name'],f"P{r['primaryPhase']} / {r['batch']}",', '.join(LABELS[k] for k in r['matchedClauses'])] for r in sorted(dependencies,key=lambda r:(r['primaryPhase'],r['batch'],r['name']))])]
        (OUT/f'phase-{phase}.md').write_text('\n'.join(lines)+'\n')
    cleanrows=[{k:v for k,v in r.items() if k not in ['_vector','normalized']} for r in sorted(rows,key=lambda r:(r['primaryPhase'],r['batch'],-r['similarityToAnchor'],r['name']))]
    output={'baseline':'PF2e 8.5.0','compilerGeneratedAt':compiled['generatedAt'],'enablementGeneratedAt':enabled['generatedAt'],'scope':{'included':1870,'nonRitual':1827,'ritual':43,'excludedRitual':123,'skippedRitual':1},'classification':'Provisional planning inference from source fields and explicit clause patterns. Not executable profiles and not authoritative phase denominators.','algorithm':{'features':'normalized matched-rule-clause word and adjacent-word TF-IDF cosine','threshold':.15,'maximumCohortSize':12,'gate':'same primary phase and rule family'},'summary':summary,'batches':[{'id':b['id'],'phase':b['phase'],'family':b['family'],'anchorId':b['anchor']['id'],'memberIds':[r['id'] for r in b['members']],'testContract':TESTS[b['family']]} for b in batches],'spells':cleanrows,'excludedRituals':excluded}
    (OUT/'catalog.json').write_text(json.dumps(output,indent=2)+'\n')
    (OUT/'all-spells.md').write_text('# All in-scope spells — phase and language batch index\n\nEvery entry also belongs to Phase 9 catalog acceptance. Phase 1 correction/authority tests apply to each applicable resolution workflow. Primary assignments below are provisional work ownership; dependencies overlap.\n\n'+table(['Spell','Primary phase','Language batch','Module status','Other phase signals'],[[r['name'],r['primaryPhase'],f"[{r['batch']}](phase-{r['primaryPhase']}.md)",status(r),', '.join(map(str,[p for p in r['phases'] if p!=r['primaryPhase']]))] for r in sorted(rows,key=lambda r:r['name'])]))
    (OUT/'phase-1.md').write_text('# Phase 1 — GM corrections (cross-cutting)\n\nThis phase does not own an exclusive spell catalog. Use the [complete spell list](all-spells.md) and apply correction tests to each batch with saves, attacks, target eligibility, condition values or durations.\n\nTest provisional rerolls, effective degree overrides, exclude/restore, owner/GM authority, stale revisions, secondary-result invalidation and locking after consequences. Save-bearing and multi-step batches require their own data checks; identical UI does not prove identical mechanics.\n')
    (OUT/'excluded-rituals.md').write_text('# Rituals outside the accepted milestone\n\nThese 124 documents are separate from the 1,870 entries. Recall Past Life remains excluded by project ruling; Aspirational State remains skipped and unverified.\n\n'+table(['Ritual','Status','Reason'],[[r['name'],r['status'],r.get('reason','')] for r in excluded]))
    readme='# Spell implementation batches by phase\n\nThis is a new **planning worklist**, built from all **1,870 in-scope documents** (1,827 non-ritual spells and 43 rituals). It preserves the other 124 rituals separately. Generating this worklist does not change module behavior.\n\nEach spell has one proposed primary worklist, explicit cross-phase signals, its current module route, source description and language cohort. **Phase assignments are provisional source-based inferences, not a newly verified phase completion denominator.** Enabled counts mean any current module route; they include partial Effect automation, not necessarily the proposed phase workflow. Phase 1 corrections and Phase 9 acceptance are cross-cutting.\n\n'+table(['Phase','Worklist','Primary entries','Enabled route','Not enabled','Including dependency signals'],summary)+'\n'
    readme+='The 51 primary Phase 9 entries are the unresolved assignment queue. **Leave these 51 review entries until last; current implementation proceeds through Phase 2 rule families.** See [the rider-family checkpoint](../../docs/verification/phase-2-rider-family.md) for the first completed expansion. **Phase 9 acceptance still covers all 1,870 entries**, as does the Phase 1 authority/correction framework wherever applicable.\n\n## Browse the lists\n\n- [Phase 2–3 implementation queue](phase-2-3-queue.md) — rule families, wording groups and shared test contracts.\n- [Searchable catalog](index.html) — filter phase, rule family, status and wording; inspect source excerpts and differences.\n- [Alphabetical master list](all-spells.md) — all 1,870 entries.\n'+''.join(f'- [Phase {p}: {PHASES[p]}](phase-{p}.md)\n' for p in range(1,10))+'- [Excluded/skipped rituals](excluded-rituals.md).\n- [Machine-readable catalog and batches](catalog.json).\n\n'
    readme+=f'## How to use the {len(batches)} language cohorts\n\n1. Start with a Phase 2 or 3 cohort. Read the anchor and every member’s full description, including heightened and linked rules.\n2. Confirm the exact shared rule grammar and identify exceptions. Split a cohort whenever target predicates, degree branches, timing, recurrence, rank changes or terminal outcomes differ materially.\n3. Implement the smallest reusable rule primitive. These lists are test fixtures and planning metadata, never a spell-name dispatch table.\n4. Generate per-member source/plan assertions for every legal rank and variant. Use representative live cases only for identical behavior; add cases for distinct mechanics.\n5. Keep unsupported clauses gated and update evidence for each member. Enabled route is not full automation; partial native Effect routes remain labelled.\n\nGrouping uses the same candidate phase and mechanic family, then normalized matched-clause word/bigram similarity (numbers and dice abstracted, condition names and save statistics abstracted for matching only), threshold 0.15, maximum 12 members. Values are preserved in the original source and JSON. Singletons stay separate instead of being forced into unrelated batches. Similarity scores are linguistic, not probabilities of correctness. Large families become several nearby cohorts.\n\nPublic and GM-only source descriptions are included in this GM planning catalog; similarity uses matched rule-clause excerpts, with full text only as an unmatched fallback. Scores can miss paraphrases or overvalue reused wording. Phase signals can overmatch quoted alternatives, references or incidental movement. Review is mandatory before treating a candidate cohort as a shared implementation/test contract. The full catalog is not semantically audited by this generator.\n\nReproduce with `python3 tools/build-phase-spell-batches.py <fresh compiler report>` after refreshing `reports/spell-enablement.json`. Authoritative phase definitions remain in [the implementation plan](../../docs/planning/full-spell-implementation-plan.md).\n'
    (OUT/'README.md').write_text(readme)
    write_queue(rows,batches,enabled['generatedAt'])
    write_html(output)
    print(json.dumps({'spells':len(rows),'cohorts':len(batches),'summary':summary},indent=2))

def write_queue(rows,batches,generated_at):
    families=collections.defaultdict(list)
    for row in rows:
        families[(row['primaryPhase'],row['family'])].append(row)
    text='# Rule-family index and Phase 2–3 batch queue\n\nThe broad families below are the reusable implementation units. Close-wording cohorts split their source examples into manageable review sets. Singletons are retained when descriptions have no sufficiently close match; they can still benefit from the broader family primitive. None of these cohorts authorizes a new spell-name branch.\n\n'
    text+='## What the phases mean\n\nThese are implementation capabilities from the [full implementation plan](../../docs/planning/full-spell-implementation-plan.md), not exclusive categories of spell rules. A spell can need several phases.\n\n'
    text+=table(['Phase','Definition'],[
        [1,'GM corrections: review and adjust provisional targets, save degrees, condition values and durations before finalization.'],
        [2,'Outcome application: apply the finalized save outcome—native damage, conditions and Effects—while preserving each cast’s contributions, eligibility, damage totals and duplicate prevention.'],
        [3,'Ongoing management: maintain consequences after application—turn/world-time expiry, recurring saves, condition recovery, Sustain, dismissal, aura/exposure review and selective cleanup through reloads or GM changes.'],
        [4,'Immediate workflows: spell attacks, healing, no-roll or mixed resolution, casting choices, and explicit object/location targets.'],
        [5,'Transformations: choose legal forms, apply form mechanics and granted actions, track limits, and safely revert.'],
        [6,'Summons and created creatures: select eligible creatures, place and control them, track cast ownership and clean up the correct creations.'],
        [7,'Spatial effects: walls, objects, areas, movement and teleportation, including geometry, durability and scene placement where reliable.'],
        [8,'Rituals: take the confirmed ceremony result and resolve its immediate and delayed outcomes, saves and persistent records.'],
        [9,'Catalog completion: resolve remaining mechanical gaps and classification questions, and verify every in-scope spell and meaningful variant.']])+'\n'
    text+='**Phase 2 versus Phase 3:** creating a timed Clumsy effect or a persistent-damage condition belongs to Phase 2; expiring that effect or handling later damage/recovery belongs to Phase 3. The same spell can use both. Native PF2e may supply part of either workflow.\n\n'
    text+='The **primary worklist** assigns one place to organize implementation; cross-phase signals record other needed capabilities. Phase 1 corrections and Phase 9 acceptance apply across the catalog. The 51 entries assigned primarily to Phase 9 are the deferred classification/review list, not the entire scope of Phase 9.\n\n## Current route counts\n\n'
    text+=f'Route snapshot: {generated_at}.\n\n'
    text+='Counts are regenerated from the current module route census after each implementation batch. **Enabled means an available route, including partial native Effect routes; it is not full spell verification.** The 51 unresolved review spells remain deferred until last.\n\n'
    text+=table(['Primary worklist','Spells','Enabled','Not enabled'],[[f'Phase {p}',len(m),sum(r['enabledRoute'] for r in m),sum(not r['enabledRoute'] for r in m)] for p in (2,3) for m in [[r for r in rows if r['primaryPhase']==p]]])+'\n'
    text+=table(['Phase','Rule family','Spells','Enabled','Not enabled','Wording cohorts'],[[p,LABELS.get(f,f),len(m),sum(r['enabledRoute'] for r in m),sum(not r['enabledRoute'] for r in m),sum(b['phase']==p and b['family']==f for b in batches)] for (p,f),m in sorted(families.items())])
    blocked=[r for r in rows if r['primaryPhase']==2 and not r['enabledRoute']]
    execution_gaps=collections.Counter(code for r in blocked for code in {gap['code'] for gap in (r.get('saveExecution') or {}).get('blockers',[]) if gap['code'] not in ('compiler-gap','automation-level')})
    if execution_gaps:
        text+='\n\n## Phase 2 execution blockers\n\nThese counts come from the same capability assessment used to permit save execution. One spell can have several blockers; resolving one blocker does not imply that all listed spells become enabled. Non-save workflows still require their own route. Detailed outcome paths are stored in `catalog.json` under `saveExecution.blockers`. See the [composition family audit](composition-family-audit.md) for every direct-plus-persistent save and save-linked native Effect, including remaining blockers. The [Speed, conditions and lifetime audit](speed-cross-family-audit.md) covers the full overlapping groups used by the latest shared modifier expansion.\n\n'
        text+=table(['Shared execution gap','Blocked spells'],execution_gaps.most_common())+'\n'
    progress_path=ROOT/'docs/planning/phase-batch-progress.json'
    if progress_path.exists():
        by_id={r['id']:r for r in rows}
        completed=json.loads(progress_path.read_text())['batches']
        text+='\n## Implemented batch checkpoints\n\nThese records retain completed batches when the suggested next cohort changes. Counts below use current routes; verification links describe the exact tested scope.\n\n'
        progress_rows=[]
        for batch in completed:
            members=[by_id[spell_id] for spell_id in batch['spellIds']]
            progress_rows.append([batch['date'],batch['family'],', '.join(r['name'] for r in members),sum(r['enabledRoute'] for r in members),sum(not r['enabledRoute'] for r in members),f"[Evidence]({batch['verification']})"])
        text+=table(['Date','Shared rule batch','Spells','Enabled','Not enabled','Verification'],progress_rows)+'\n'
    text+='\n## Suggested first review batches\n\nPrioritize Phase 2–3 groups with unenabled members and an already enabled route as a regression starting point, followed by additional ongoing primitives. These are candidate priorities, not estimates of implementation effort. The enabled example is not automatically a verified live test anchor. Read all pending mechanics before reusing evidence.\n\n'
    families_order=['critical-rider','condition','linked-condition','persistent-damage','basic-save','repeat-save','temporary-immunity','sustain','aura','spell-ending']
    selected=[]
    for family in families_order:
        choices=[b for b in batches if b['phase'] in (2,3) and b['family']==family and any(not r['enabledRoute'] for r in b['members'])]
        if not choices:continue
        choices.sort(key=lambda b:(-int(any(r['enabledRoute'] for r in b['members'])),-sum(not r['enabledRoute'] for r in b['members']),-len(b['members']),b['id']))
        selected.append(choices[0])
    for b in selected:
        enabled=[r['name'] for r in b['members'] if r['enabledRoute']]
        not_enabled=[r['name'] for r in b['members'] if not r['enabledRoute']]
        pending=collections.Counter(c for r in b['members'] if not r['enabledRoute'] for c in r['pending'])
        text+=f"\n### [{b['id']} — {LABELS.get(b['family'],b['family'])}](phase-{b['phase']}.md)\n\n"
        text+='**Spells:** '+', '.join(r['name'] for r in b['members'])+'.\n\n'
        text+=f'**Status:** {len(enabled)} enabled / {len(not_enabled)} not enabled.\n\n'
        text+='**Enabled:** '+(', '.join(enabled) or 'None in this wording cohort')+'.\n\n'
        text+='**Not enabled:** '+(', '.join(not_enabled) or 'None')+'.\n\n'
        text+='**Common remaining gates:** '+(', '.join(f'{k} ({v})' for k,v in pending.most_common(5)) or 'Consult runtime/profile gates and source text.')+'.\n\n'
        text+='**Shared test contract:** '+TESTS[b['family']]+'\n'
    text+='\n## Per-spell differences that must remain in tests\n\n- Condition value versus affliction stage; initial damage versus persistent damage.\n- Primary versus secondary saves, omitted degree inheritance, and optional choices.\n- Caster versus recipient anchors; current versus next turn; start versus end.\n- Exact linked contribution versus any matching condition on the actor.\n- Native Effect availability versus complete mechanical automation.\n- Every legal rank/action variant, recipient predicate, immunity and scope restriction.\n\nCurrent classification deliberately leaves uncertain mechanics for source review. Unknown clauses must remain gated while a recognized clause is generalized.\n'
    (OUT/'phase-2-3-queue.md').write_text(text)


def write_html(data):
    payload=json.dumps(data,ensure_ascii=False).replace('<','\\u003c')
    page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PF2e spell implementation batches</title><style>
body{font:16px/1.5 system-ui,sans-serif;background:#f6f4ef;color:#202c32;margin:0}main{max-width:1250px;margin:auto;padding:32px}h1{margin-bottom:6px}p{max-width:950px}header{border-bottom:2px solid #234e52;padding-bottom:18px}label{display:inline-grid;gap:5px;margin:8px 12px 8px 0;font-size:14px}input,select{padding:10px;border:1px solid #a3afb2;border-radius:5px;background:white;font:inherit}input{min-width:260px}#count{font-weight:650}details{background:white;border:1px solid #cdd5d3;border-radius:7px;margin:12px 0;padding:14px}summary{cursor:pointer;font-weight:650}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid #e0e5e3}th{background:#edf2ef}.tag{display:inline-block;background:#e4eee7;border-radius:3px;padding:2px 7px}.muted{color:#51656d;font-size:14px}.blocked{background:#f3e8d7}.partial{background:#f3e1d4}blockquote{border-left:3px solid #57796b;padding-left:12px;margin:12px 0}.wrap{overflow-x:auto}button{padding:9px 14px;cursor:pointer}.source{font-size:13px}a{color:#235c6a}@media(max-width:700px){main{padding:16px}input{min-width:180px}td{min-width:130px}}</style><main><header><p class="muted">PF2e 8.5.0 · planning catalog · 1,870 in-scope documents</p><h1>Spell implementation batches</h1><p>Find descriptions that may share a reusable rule implementation and test contract. <strong>Phase assignments and language cohorts are candidates for review.</strong> An enabled route does not mean the entire spell is automated.</p><p><a href="README.md">Method and phase totals</a> · <a href="all-spells.md">Alphabetical list</a> · <a href="catalog.json">Complete data</a></p></header><section aria-label="Filters"><label>Search descriptions or names<input id="search" type="search" placeholder="e.g. sickened, end of its turn"></label><label>Phase<select id="phase"><option value="">All phases</option></select></label><label>Membership<select id="membership"><option value="primary">Primary worklist</option><option value="any">Include dependency signals</option></select></label><label>Rule family<select id="family"><option value="">All rule families</option></select></label><label>Module status<select id="status"><option value="">All statuses</option><option value="disabled">Not enabled</option><option value="enabled">Enabled route</option><option value="partial">Partial Effect</option></select></label></section><p id="count" aria-live="polite"></p><div id="results"></div></main><script id="data" type="application/json">PAYLOAD</script><script>
const data=JSON.parse(document.getElementById('data').textContent);const byId=new Map(data.spells.map(r=>[r.id,r]));const labels=PHASELABELS;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const p of [1,2,3,4,5,6,7,8,9])document.querySelector('#phase').add(new Option('Phase '+p+' — '+labels[p],p));
document.querySelector('#phase').value='2';
for(const f of [...new Set(data.batches.map(b=>b.family))].sort())document.querySelector('#family').add(new Option(f,f));
function render(){const q=document.querySelector('#search').value.toLowerCase(),p=Number(document.querySelector('#phase').value),membership=document.querySelector('#membership').value,f=document.querySelector('#family').value,s=document.querySelector('#status').value;let total=0;const groups=[];
for(const b of data.batches){const members=b.memberIds.map(id=>byId.get(id)).filter(r=>(!p||p===1||p===9||(membership==='primary'?r.primaryPhase===p:r.phases.includes(p)))&&(!f||r.family===f)&&(!q||(r.name+' '+r.text).toLowerCase().includes(q))&&(!s||(s==='disabled'?!r.enabledRoute:s==='partial'?r.nativeEffectPartial:r.enabledRoute)));if(!members.length)continue;total+=members.length;const anchor=byId.get(b.anchorId);groups.push('<details><summary>'+esc(b.id)+' · '+esc(b.family)+' · '+members.length+' matching spells · anchor: '+esc(anchor.name)+'</summary><p>'+esc(b.testContract)+'</p><blockquote>'+esc(anchor.matchedClauses[b.family]||Object.values(anchor.matchedClauses)[0]||anchor.text.slice(0,240))+'</blockquote><div class="wrap"><table><thead><tr><th>Spell / source</th><th>Current route</th><th>Phase / similarity</th><th>Differences to preserve</th></tr></thead><tbody>'+members.map(r=>'<tr><td><a href="../../.cache/pf2e-test-fixtures/'+encodeURI(r.sourceFile)+'">'+esc(r.name)+'</a><br><span class="muted">Rank '+r.rank+'</span><details><summary>Description and matched clauses</summary><p>'+esc(r.text)+'</p><p class="source">'+esc(r.reason)+'</p>'+Object.entries(r.matchedClauses).map(([k,v])=>'<p><strong>'+esc(k)+':</strong> '+esc(v)+'</p>').join('')+'</details></td><td><span class="tag '+(!r.enabledRoute?'blocked':r.nativeEffectPartial?'partial':'')+'">'+(!r.enabledRoute?'Not enabled':r.nativeEffectPartial?'Partial Effect':'Enabled route')+'</span><br>'+esc(r.route)+'<p class="muted">'+esc(r.pending.join(', '))+'</p></td><td>Primary P'+r.primaryPhase+'<br>Signals: '+r.phases.join(', ')+'<br>'+r.similarityToAnchor.toFixed(2)+'</td><td>'+esc(r.save.statistic||'No primary save')+'; '+(r.save.basic?'basic':'non-basic/no save')+'<br>Duration: '+esc(r.duration.value||'outcome/text')+'<br>Target: '+esc(r.target||'source/area/text')+'<br>Traits: '+esc(r.traits.join(', '))+'</td></tr>').join('')+'</tbody></table></div></details>');}
document.querySelector('#count').textContent=total+' spells in '+groups.length+' cohorts'+(p===1||p===9?' — this phase has catalog-wide acceptance work':'');document.querySelector('#results').innerHTML=groups.join('')||'<p>No matching spells.</p>';}
for(const el of document.querySelectorAll('input,select'))el.addEventListener('input',render);render();
</script></html>'''
    page=page.replace('PAYLOAD',payload).replace('PHASELABELS',json.dumps(PHASES))
    (OUT/'index.html').write_text(page)

if __name__=='__main__':main()
