import type { Context, Config } from "@netlify/functions";
import { json, safeError } from "./lib.mts";
import { connectionRows } from "./provider-connections-lib.mts";
import { publicProviderMetadata } from "./provider-metadata.mts";

export default async (_req:Request,_ctx:Context)=>{
  try{return json({connections:await connectionRows(),metadata:publicProviderMetadata()})}catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/provider-connections"};