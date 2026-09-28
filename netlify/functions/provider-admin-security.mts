import { json, workspace } from "./lib.mts";
import { rpc } from "./provider-connections-lib.mts";

const LIMITS:Record<string,{limit:number,window:number}>={
  connect:{limit:8,window:600},
  test:{limit:20,window:600},
  disconnect:{limit:8,window:600}
};

export async function requireProviderAdminRateLimit(provider:string,operation:"connect"|"test"|"disconnect"){
  const p=String(provider||"").toLowerCase();
  if(!["gemini","tavily","openai"].includes(p))return json({error:"Unsupported provider."},400);
  const ws=await workspace(),cfg=LIMITS[operation]||LIMITS.test;
  const allowed=await rpc("vmg_provider_admin_rate_limit",{
    p_workspace_id:ws.id,
    p_provider:p,
    p_operation:operation,
    p_limit:cfg.limit,
    p_window_seconds:cfg.window
  });
  if(allowed!==true)return json({error:"Too many provider-admin attempts. Try again later.",code:"PROVIDER_ADMIN_RATE_LIMIT"},429,{"retry-after":String(cfg.window)});
  return null;
}
