import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, workspace, select, insert, update } from "./lib.mts";
import { requireAdmin } from "./admin-auth.mts";

export default async (req:Request,_ctx:Context)=>{
  const denied=await requireAdmin(req);if(denied)return denied;
  try{
    const ws=await workspace();
    if(req.method==="GET"){const rows=await select("workspace_settings",`workspace_id=eq.${ws.id}&select=*&limit=1`);return json({settings:rows?.[0]?.settings_json||{}})}
    if(req.method==="PATCH"){
      const b=await readJson(req);const rows=await select("workspace_settings",`workspace_id=eq.${ws.id}&select=id,settings_json&limit=1`);const merged={...(rows?.[0]?.settings_json||{}),...(b.settings||{})};
      if(rows?.length)await update("workspace_settings",`id=eq.${rows[0].id}`,{settings_json:merged,updated_at:new Date().toISOString()},false);
      else await insert("workspace_settings",{workspace_id:ws.id,settings_json:merged},false);
      return json({saved:true,settings:merged});
    }
    return json({error:"Method not allowed"},405);
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/settings"};