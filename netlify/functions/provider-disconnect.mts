import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError } from "./lib.mts";
import { requireAdmin } from "./admin-auth.mts";
import { disconnectProvider } from "./provider-connections-lib.mts";
export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const denied=await requireAdmin(req);if(denied)return denied;
  try{const b=await readJson(req),provider=String(b.provider||"").toLowerCase();await disconnectProvider(provider);return json({disconnected:true,provider,note:"The credential was removed from VMG Company Intelligence. Revoke the key in the provider dashboard if you also want the provider-side key permanently invalidated."})}catch(e){return json({error:safeError(e)},400)}
};
export const config:Config={path:"/api/provider-disconnect"};