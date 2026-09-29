import type { Context, Config } from "@netlify/functions";
import { json, safeError, workspace, select } from "./lib.mts";
export default async (req:Request,_ctx:Context)=>{
  try{const ws=await workspace();const u=new URL(req.url);const id=u.searchParams.get("id");
    if(id){const rows=await select("companies",`workspace_id=eq.${ws.id}&id=eq.${encodeURIComponent(id)}&select=*&limit=1`);if(!rows?.length)return json({error:"Company not found"},404);return json({company:rows[0]})}
    const rows=await select("companies",`workspace_id=eq.${ws.id}&select=*&order=updated_at.desc`);return json({companies:rows||[]});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/companies"};