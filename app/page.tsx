"use client";
import {useEffect,useMemo,useRef,useState} from "react";

type Status="backlog"|"todo"|"doing"|"review"|"done"; type Priority="urgent"|"high"|"normal"|"low";
type Member={id:string;name:string;role:string;initials:string;online:boolean};
type Task={id:string;title:string;description:string;status:Status;priority:Priority;assignee:string;due:string;tags:string[];check:string[]};
type Activity={id:string;member:string;text:string;time:string};
type Data={id:string;project:string;members:Member[];tasks:Task[];activity:Activity[];notes:{brief:string;decisions:string;links:string}};

const seed:Data={
 id:"weapon-rng-room",project:"Weapon RNG",
 members:[
  {id:"ilan",name:"Ilan",role:"Lead / Scripter",initials:"IJ",online:true},
  {id:"nassim",name:"Nassim",role:"Builder",initials:"NA",online:true},
  {id:"yassine",name:"Yassine",role:"UI / Design",initials:"YA",online:false},
  {id:"alex",name:"Alex",role:"Game design",initials:"AL",online:false}
 ],
 tasks:[
  {id:"1",title:"Système principal de roll",description:"Roll serveur, probabilités et retour du résultat à l’interface.",status:"doing",priority:"urgent",assignee:"ilan",due:"2026-10-07",tags:["Scripting","Core"],check:["Table des probabilités","Roll serveur","Retour UI","Anti-exploit"]},
  {id:"2",title:"Maquette de l’inventaire",description:"Inventaire des armes avec rareté, favoris et tri.",status:"review",priority:"high",assignee:"yassine",due:"2026-10-06",tags:["UI","UX"],check:["Grille","Raretés","Tri"]},
  {id:"3",title:"Zone de spawn + lobby",description:"Construire le hub de départ et ses points d’interaction.",status:"todo",priority:"high",assignee:"nassim",due:"2026-10-08",tags:["Build"],check:["Entrée","Spawns","Zone d’échange"]},
  {id:"4",title:"Table des raretés",description:"Définir les paliers et une première répartition des chances.",status:"done",priority:"normal",assignee:"alex",due:"2026-10-03",tags:["Design","Balance"],check:["Commun","Rare","Épique","Légendaire"]},
  {id:"5",title:"Effets de roll",description:"Feedback visuel court quand une arme tombe.",status:"backlog",priority:"normal",assignee:"yassine",due:"",tags:["VFX","UI"],check:[]},
  {id:"6",title:"Premier test fermé",description:"Jouer une vraie session et centraliser les bugs.",status:"backlog",priority:"high",assignee:"ilan",due:"2026-10-12",tags:["Test"],check:["Build jouable","Serveur test","Checklist"]},
  {id:"7",title:"Écran des stats",description:"Afficher les stats utiles de chaque arme.",status:"todo",priority:"normal",assignee:"alex",due:"2026-10-10",tags:["UI","Design"],check:[]}
 ],
 activity:[
  {id:"a1",member:"ilan",text:"a déplacé « Système principal de roll » vers En cours",time:"2026-10-05T12:40:00Z"},
  {id:"a2",member:"yassine",text:"a envoyé « Maquette de l’inventaire » en review",time:"2026-10-04T20:10:00Z"},
  {id:"a3",member:"nassim",text:"a commencé la zone de spawn",time:"2026-10-05T09:00:00Z"},
  {id:"a4",member:"alex",text:"a terminé la table des raretés",time:"2026-10-03T17:00:00Z"}
 ],
 notes:{brief:"Roll → arme → amélioration → nouveau roll. On consolide la boucle principale avant les systèmes secondaires.",decisions:"• Les probabilités sont côté serveur.\n• Une feature doit être testable seule.\n• Pas de gros VFX avant un core stable.",links:"Roblox Studio\nTable probabilités\nChecklist test"}
};

const labels:{[K in Status]:string}={backlog:"Backlog",todo:"À faire",doing:"En cours",review:"Review",done:"Terminé"};
const pr:{[K in Priority]:string}={urgent:"Urgent",high:"Haute",normal:"Normale",low:"Basse"};
const nav=[["dashboard","Vue d’ensemble"],["board","Tâches"],["roadmap","Roadmap"],["team","Équipe"],["activity","Activité"],["notes","Notes"]];

function Icon({name}:{name:string}){const p:{[k:string]:string}= {
 dashboard:"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
 board:"M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M7 8h4M7 12h8M7 16h6",
 roadmap:"M5 20c4-4 7-8 14-16M7 4h2M15 4h2M6 10h4M14 10h4",
 team:"M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c.8-3.8 3-5.5 6-5.5s5.2 1.7 6 5.5M15 10a2.5 2.5 0 1 0 0-5M16 14c2.4.2 4 2 5 5",
 activity:"M3 12h4l2-6 4 12 2-6h6",
 notes:"M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v5h5M8 12h8M8 16h6",
 search:"M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 4 4",
 plus:"M12 5v14M5 12h14",
 bell:"M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
 chevron:"m9 6 6 6-6 6",
 close:"m6 6 12 12M18 6 6 18"
}; return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={p[name]||p.dashboard}/></svg>}

const ago=(s:string)=>{const m=Math.max(0,Math.floor((Date.now()-new Date(s).getTime())/60000));return m<1?"à l’instant":m<60?"il y a "+m+" min":m<1440?"il y a "+Math.floor(m/60)+" h":"il y a "+Math.floor(m/1440)+" j"};
const due=(s:string)=>s?new Date(s+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"}):"";
function Avatar({m,sm=false}:{m:Member;sm?:boolean}){return <div className={"avatar "+(sm?"sm":"")}><span>{m.initials}</span>{m.online&&<i/>}</div>}

export default function Home(){
 const [data,setData]=useState< Data>(seed),[page,setPage]=useState("dashboard"),[person,setPerson]=useState("ilan"),[query,setQuery]=useState(""),[sel,setSel]=useState<Task|null>(null),[memberFilter,setMemberFilter]=useState("all"),[priorityFilter,setPriorityFilter]=useState("all");
 const [share,setShare]=useState(false); const search=useRef<HTMLInputElement>(null);
 useEffect(()=>{try{const s=localStorage.getItem("weapondesk");if(s)setData(JSON.parse(s));const u=new URL(location.href).searchParams.get("workspace");if(u)fetch("/api/workspace?id="+encodeURIComponent(u),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(x=>x&&setData(x)).catch(()=>{})}catch{}},[]);
 useEffect(()=>{localStorage.setItem("weapondesk",JSON.stringify(data))},[data]);
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();search.current?.focus()}};addEventListener("keydown",k);return()=>removeEventListener("keydown",k)},[]);
 const counts=useMemo(()=>({open:data.tasks.filter(t=>t.status!=="done").length,doing:data.tasks.filter(t=>t.status==="doing").length,review:data.tasks.filter(t=>t.status==="review").length,done:data.tasks.filter(t=>t.status==="done").length}),[data.tasks]);
 const visible=data.tasks.filter(t=>(memberFilter==="all"||t.assignee===memberFilter)&&(priorityFilter==="all"||t.priority===priorityFilter)&&(!query||[t.title,t.description,...t.tags].join(" ").toLowerCase().includes(query.toLowerCase())));
 const active=data.members.find(m=>m.id===person)||data.members[0];
 const change=(id:string,patch:Partial<Task>)=>setData(d=>({...d,tasks:d.tasks.map(t=>t.id===id?{...t,...patch}:t),activity:[{id:crypto.randomUUID(),member:person,text:"a modifié une tâche",time:new Date().toISOString()},...d.activity].slice(0,40)}));
 const create=()=>{const t:Task={id:crypto.randomUUID(),title:"Nouvelle tâche",description:"Décris exactement ce qu’il faut faire et comment savoir que c’est terminé.",status:"todo",priority:"normal",assignee:person,due:"",tags:["À définir"],check:[]};setData(d=>({...d,tasks:[t,...d.tasks]}));setSel(t)};
 const sync=async()=>{await fetch("/api/workspace?id="+encodeURIComponent(data.id),{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(data)});setShare(true);setTimeout(()=>setShare(false),2200)};
 return <div className="shell">
  <aside className="sidebar"><div className="logo"><b>W</b><div><strong>WeaponDesk</strong><span>team workspace</span></div></div><div className="workspace"><div>W</div><span><b>{data.project}</b><small>Équipe privée</small></span></div><nav>{nav.map(([id,label])=><button className={page===id?"active":""} key={id} onClick={()=>setPage(id)}><Icon name={id}/><span>{label}</span>{id==="board"&&<em>{counts.open}</em>}</button>)}</nav><div className="side-bottom"><div className="next"><small>PROCHAIN JALON</small><b>Core jouable</b><div className="bar"><i style={{width:"68%"}}/></div><span>10 oct. · 68%</span></div><button className="share-side" onClick={sync}>Partager le workspace</button></div></aside>
  <main><header><div className="crumb">{data.project}<span>/</span><b>{nav.find(x=>x[0]===page)?.[1]}</b></div><div className="actions"><div className="search"><Icon name="search"/><input ref={search} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher…" /><kbd>⌘ K</kbd></div><button className="bell"><Icon name="bell"/></button><select value={person} onChange={e=>setPerson(e.target.value)}>{data.members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select><Avatar m={active} sm/><button className="new" onClick={create}><Icon name="plus"/> Nouvelle tâche</button></div></header>
  <div className="content">
   {page==="dashboard"&&<Dashboard data={data} active={active} counts={counts} onOpen={setSel} setPage={setPage}/>}
   {page==="board"&&<Board data={data} tasks={visible} memberFilter={memberFilter} priorityFilter={priorityFilter} setMemberFilter={setMemberFilter} setPriorityFilter={setPriorityFilter} onMove={(id,s)=>change(id,{status:s})} onOpen={setSel}/>}
   {page==="roadmap"&&<Roadmap data={data} onOpen={setSel}/>}
   {page==="team"&&<Team data={data} onOpen={setSel}/>}
   {page==="activity"&&<Activity data={data}/>}
   {page==="notes"&&<Notes data={data} setData={setData}/>}
  </div></main>
  {sel&&<TaskModal task={sel} members={data.members} onClose={()=>setSel(null)} onUpdate={p=>{change(sel.id,p);setSel({...sel,...p})}} onDelete={()=>{setData(d=>({...d,tasks:d.tasks.filter(t=>t.id!==sel.id)}));setSel(null)}}/>}
  {share&&<div className="toast">Workspace synchronisé</div>}
 </div>
}

function Heading({eyebrow,title,sub,action}:{eyebrow:string;title:string;sub:string;action?:React.ReactNode}){return <div className="heading"><div><small>{eyebrow}</small><h1>{title}</h1><p>{sub}</p></div>{action}</div>}
function Stat({label,value,hint}:{label:string;value:number;hint:string}){return <div className="stat"><span>{label}</span><b>{value}</b><small>{hint}</small></div>}
function Dashboard({data,active,counts,onOpen,setPage}:{data:Data;active:Member;counts:{open:number;doing:number;review:number;done:number};onOpen:(t:Task)=>void;setPage:(s:string)=>void}){
 const mine=data.tasks.filter(t=>t.assignee===active.id&&t.status!=="done").slice(0,5), cols:Status[]=["backlog","todo","doing","review","done"];
 return <><Heading eyebrow="BONJOUR, ÉQUIPE 👋" title="On en est où sur Weapon RNG ?" sub="Qui fait quoi, ce qui est bloqué, et ce qui arrive ensuite." action={<button className="outline" onClick={()=>setPage("activity")}>Voir les changements</button>}/>
 <div className="stats"><Stat label="Tâches ouvertes" value={counts.open} hint="dont priorités urgentes"/><Stat label="En cours" value={counts.doing} hint="à faire avancer"/><Stat label="En review" value={counts.review} hint="à valider"/><Stat label="Terminées" value={counts.done} hint="livrées"/></div>
 <div className="grid2"><section className="panel"><div className="panel-title"><div><small>TON FOCUS</small><h2>Ce que tu peux faire maintenant</h2></div><span className="chip">{mine.length} ouvertes</span></div><div className="list">{mine.map(t=><button key={t.id} onClick={()=>onOpen(t)}><i className={"p "+t.priority}/><span><b>{t.title}</b><small>{labels[t.status]} {t.due?"· pour "+due(t.due):""}</small></span><Icon name="chevron"/></button>)}</div></section>
 <section className="panel"><div className="panel-title"><div><small>PROCHAIN JALON</small><h2>Core jouable</h2></div><span className="date">10 oct.</span></div><p className="desc">Roll + inventaire + premières armes. Le but est d’avoir une boucle jouable avant d’empiler les features.</p><div className="percent"><b>68%</b><span>avancement estimé</span></div><div className="bar big"><i style={{width:"68%"}}/></div><div className="avatars">{data.members.map(m=><Avatar key={m.id} m={m} sm/>)}</div></section></div>
 <section className="panel"><div className="panel-title"><div><small>FLUX DE TRAVAIL</small><h2>Le board en un coup d’œil</h2></div><button className="text" onClick={()=>setPage("board")}>Ouvrir le board <Icon name="chevron"/></button></div><div className="mini-board">{cols.map(s=><div key={s}><header><span className={"dot "+s}/>{labels[s]}<em>{data.tasks.filter(t=>t.status===s).length}</em></header>{data.tasks.filter(t=>t.status===s).slice(0,3).map(t=><button key={t.id} onClick={()=>onOpen(t)}><b>{t.title}</b><small>{pr[t.priority]}</small></button>)}</div>)}</div></section>
 </>}
function Board({data,tasks,memberFilter,priorityFilter,setMemberFilter,setPriorityFilter,onMove,onOpen}:{data:Data;tasks:Task[];memberFilter:string;priorityFilter:string;setMemberFilter:(s:string)=>void;setPriorityFilter:(s:string)=>void;onMove:(id:string,s:Status)=>void;onOpen:(t:Task)=>void}){
 const cols:Status[]=["backlog","todo","doing","review","done"];
 return <><Heading eyebrow="BOARD" title="Tâches" sub="Faites glisser les tâches. Ouvrez une carte pour changer responsable, priorité, date ou checklist."/><div className="filters"><select value={memberFilter} onChange={e=>setMemberFilter(e.target.value)}><option value="all">Toute l’équipe</option>{data.members.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}</select><select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option value="all">Toutes priorités</option>{Object.keys(pr).map(k=><option value={k} key={k}>{pr[k as Priority]}</option>)}</select></div><div className="board">{cols.map(s=><div className="col" key={s} onDragOver={e=>e.preventDefault()} onDrop={e=>{const id=e.dataTransfer.getData("id");if(id)onMove(id,s)}}><header><span><i className={"dot "+s}/>{labels[s]}<em>{tasks.filter(t=>t.status===s).length}</em></span></header>{tasks.filter(t=>t.status===s).map(t=>{const m=data.members.find(x=>x.id===t.assignee)||data.members[0];return <article draggable key={t.id} onDragStart={e=>e.dataTransfer.setData("id",t.id)}><div className="cardtop"><span className={"priority "+t.priority}>{pr[t.priority]}</span><button onClick={()=>onOpen(t)}>•••</button></div><button className="cardtitle" onClick={()=>onOpen(t)}>{t.title}</button><p>{t.description}</p><div className="tags">{t.tags.map(x=><span key={x}>{x}</span>)}</div><footer><Avatar m={m} sm/>{t.due&&<small>{due(t.due)}</small>}<small>{t.check.length} checks</small></footer></article>})}</div>)}</div></>
}
function Roadmap({data,onOpen}:{data:Data;onOpen:(t:Task)=>void}){const ms=[["Core jouable","10 oct.","68%"],["Test équipe","12 oct.","35%"],["Prototype V0.1","20 oct.","18%"]];return <><Heading eyebrow="DIRECTION" title="Roadmap" sub="Des jalons simples pour savoir vers quoi le travail converge."/><div className="roadmap">{ms.map((m,i)=><section key={m[0]}><div className="node">{i+1}</div><div className="road"><div className="roadhead"><div><small>JALON {i+1}</small><h2>{m[0]}</h2></div><span>{m[1]}<b>{m[2]}</b></span></div><div className="bar big"><i style={{width:m[2]}}/></div><div className="related">{data.tasks.slice(i*2,i*2+4).map(t=><button key={t.id} onClick={()=>onOpen(t)}><i className={"dot "+t.status}/><b>{t.title}</b><small>{labels[t.status]}</small></button>)}</div></div></section>)}</div></>}
function Team({data,onOpen}:{data:Data;onOpen:(t:Task)=>void}){return <><Heading eyebrow="ÉQUIPE" title="Qui fait quoi" sub="Chacun voit sa charge, ses tâches et ce que les autres attendent."/><div className="team">{data.members.map(m=>{const own=data.tasks.filter(t=>t.assignee===m.id),open=own.filter(t=>t.status!=="done");return <section key={m.id} className="teamm"><div className="person"><Avatar m={m}/><div><h2>{m.name}</h2><span>{m.role}</span></div><b className={m.online?"online":""}>{m.online?"En ligne":"Absent"}</b></div><div className="membernums"><div><b>{open.length}</b><small>ouvertes</small></div><div><b>{own.filter(t=>t.status==="doing").length}</b><small>en cours</small></div><div><b>{own.filter(t=>t.status==="done").length}</b><small>terminées</small></div></div><div>{open.slice(0,4).map(t=><button className="membertask" onClick={()=>onOpen(t)} key={t.id}><i className={"dot "+t.status}/><span>{t.title}</span><Icon name="chevron"/></button>)}</div></section>})}</div></>}
function Activity({data}:{data:Data}){return <><Heading eyebrow="HISTORIQUE" title="Activité" sub="Ce qui a changé dans le projet, sans devoir demander dans le groupe."/><section className="panel activity">{data.activity.map(a=>{const m=data.members.find(x=>x.id===a.member)||data.members[0];return <div key={a.id}><Avatar m={m}/><span><b>{m.name}</b> {a.text}<small>{ago(a.time)}</small></span></div>})}</section></>}
function Notes({data,setData}:{data:Data;setData:React.Dispatch<React.SetStateAction<Data>>}){const upd=(k:keyof Data["notes"],v:string)=>setData(d=>({...d,notes:{...d.notes,[k]:v}}));return <><Heading eyebrow="MÉMOIRE DU PROJET" title="Notes" sub="Brief, décisions et ressources importantes au même endroit."/><div className="notes">{Object.entries(data.notes).map(([k,v])=><section key={k}><header>{k==="brief"?"Brief":k==="decisions"?"Décisions":"Liens / ressources"}</header><textarea value={v} onChange={e=>upd(k as keyof Data["notes"],e.target.value)}/></section>)}</div></>}
function TaskModal({task,members,onClose,onUpdate,onDelete}:{task:Task;members:Member[];onClose:()=>void;onUpdate:(p:Partial<Task>)=>void;onDelete:()=>void}){return <div className="backdrop" onMouseDown={e=>e.currentTarget===e.target&&onClose()}><section className="modal"><header><div><small>TÂCHE</small><h2>{task.title}</h2></div><button onClick={onClose}><Icon name="close"/></button></header><div className="modalgrid"><div><label>Description</label><textarea className="large" value={task.description} onChange={e=>onUpdate({description:e.target.value})}/><label>Checklist</label><div className="checks">{task.check.map((x,i)=><label key={i}><input type="checkbox"/><span>{x}</span></label>)}{task.check.length===0&&<small>Aucune checklist pour le moment.</small>}</div></div><aside><label>Statut</label><select value={task.status} onChange={e=>onUpdate({status:e.target.value as Status})}>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><label>Priorité</label><select value={task.priority} onChange={e=>onUpdate({priority:e.target.value as Priority})}>{Object.entries(pr).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><label>Responsable</label><select value={task.assignee} onChange={e=>onUpdate({assignee:e.target.value})}>{members.map(m=><option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}</select><label>Échéance</label><input type="date" value={task.due} onChange={e=>onUpdate({due:e.target.value})}/><label>Tags</label><input value={task.tags.join(", ")} onChange={e=>onUpdate({tags:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})}/><button className="delete" onClick={onDelete}>Supprimer la tâche</button></aside></div></section></div>}
