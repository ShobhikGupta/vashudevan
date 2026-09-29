import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, workspace, select, insert } from "./lib.mts";
export default async (req:Request,_ctx:Context)=>{
  try{const ws=await workspace();
    if(req.method==="GET")return json({templates:await select("research_templates",`workspace_id=eq.${ws.id}&select=*&order=is_system.desc,created_at.asc`)||[]});
    if(req.method==="POST"){const b=await readJson(req);if(!b.name)return json({error:"name required"},400);const key=(b.template_key||b.name).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,80);const rows=await insert("research_templates",{workspace_id:ws.id,template_key:key,name:b.name,description:b.description||null,prompt_text:b.prompt_text||"",is_system:false});return json({template:rows?.[0]},201)}
    return json({error:"Method not allowed"},405);
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/templates"};