import {get,put} from "@vercel/blob";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const clean=(id:string)=>id.replace(/[^a-zA-Z0-9_-]/g,"").slice(0,80);
const path=(id:string)=>`weapon-desk/workspaces/${id}.json`;
export async function GET(req:Request){
 const id=clean(new URL(req.url).searchParams.get("id")||"");
 if(!id)return Response.json({error:"missing_id"},{status:400});
 try{const r=await get(path(id),{access:"private",useCache:false}); if(!r)return Response.json({error:"not_found"},{status:404}); return new Response(await new Response(r.stream).text(),{headers:{"content-type":"application/json","cache-control":"no-store"}})}catch{return Response.json({error:"not_found"},{status:404})}
}
export async function PUT(req:Request){
 const id=clean(new URL(req.url).searchParams.get("id")||""); if(!id)return Response.json({error:"missing_id"},{status:400});
 try{await put(path(id),JSON.stringify(await req.json()),{access:"private",addRandomSuffix:false,contentType:"application/json"});return Response.json({ok:true})}catch{return Response.json({error:"save_failed"},{status:500})}
}