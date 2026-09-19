import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import * as XLSX from "xlsx";

export const STAGES = [
"Entity Resolution","Official Identity / Registry","Directors / Promoters","Ownership","Business Model","Products","Plants / Offices","Capacity / Operations","Five-Year Financials","Debt / Borrowings","Charges / Lenders","Credit Ratings","Legal / Litigation","Insolvency / Defaults","Import / Export Activity","Customers / Buyers","Suppliers","Competitors","Procurement Requirements","Commercial Opportunity","Negative News","Source Validation","Evidence Classification","Final Report Generation"
];

export const SYSTEM_RULES = `
You are the research engine for VMG Company Intelligence, an internal counterparty due-diligence system.
The user's input is an entity seed, not a primary source. Resolve the exact legal entity before deeper research.
Use simple professional business English.
A large company is not automatically a safe credit counterparty. High turnover is not proof of liquidity. Profit is not cash.
Registered bank charge amount is not current debt. No negative web result is not proof of timely payment.
Never invent turnover, loans, customers, suppliers, shipment volumes, production, margin, ownership, employees, capacity, legal cases or payment behaviour.
UNKNOWN is valid. PARTIAL is valid. Company websites support company claims but do not independently prove financial safety.
Separate business opportunity from payment/credit safety. Research negative evidence as deeply as positive evidence.
Every material finding must remain source-linked and dated where possible.
`;

export const GROUPS = [
{key:"identity",stages:[2,3,4],title:"Identity, directors and ownership",prompt:"Verify legal identity, registration/tax identifiers, incorporation, registered office, directors/promoters, ownership if public, aliases/brands, former names and related entities. Flag unresolved conflicts."},
{key:"business",stages:[5,6,7,8],title:"Business and operations",prompt:"Explain the actual business model, products/services, markets, plants/offices, machinery where public, installed capacity, actual production/utilisation if public, expansions and operational changes. Do not infer machine counts or production without evidence."},
{key:"financial",stages:[9,10,11,12],title:"Financials, debt, charges and ratings",prompt:"Find up to five years of revenue, EBITDA, PAT, operating cash flow, net worth, assets, liabilities, receivables, payables, inventory, working capital, debt, interest, charges/lenders and credit-rating history. Clearly distinguish current debt from charge filings."},
{key:"legal",stages:[13,14,21],title:"Legal, insolvency and negative research",prompt:"Search litigation, supplier recovery, insolvency/default, NCLT/IBC or local equivalent, DRT/SARFAESI/bank recovery where relevant, cheque dishonour, regulatory action, auditor concerns, rating downgrades, payment disputes, plant closures and credible negative developments. Absence of results is not proof of absence."},
{key:"trade",stages:[15,16,17],title:"Trade, buyers and suppliers",prompt:"Research imports/exports, countries, products, HS codes, ports, shipment patterns and evidence-supported known buyers/suppliers. Always state trade-data coverage limitations and never imply partial customs data is the full commercial book."},
{key:"market",stages:[18,19,20],title:"Competitors, procurement and commercial opportunity",prompt:"Identify meaningful competitors and comparable metrics. Map what the company regularly procures, including raw materials, fuels, metals, packaging, chemicals, maintenance and logistics. Estimate quantity/spend only with a transparent defensible basis. Identify potential buyer/supplier/partner relevance while keeping opportunity separate from credit safety."}
];

export const TEMPLATE_RULES:Record<string,string>={
  vmg_full_due_diligence:"Run the complete VMG due-diligence methodology across all applicable tracks.",
  credit_counterparty_safety:"Prioritise current debt, cash flow, creditor ageing, supplier payment behaviour, ratings, recovery/default matters, legal enforcement and documents still required before unsecured credit.",
  supplier_due_diligence:"Prioritise operational capability, plants, capacity, production reliability, product quality signals, financial resilience, supply continuity and supplier-side counterparty risk.",
  buyer_intelligence:"Prioritise buying potential, observed demand, customer scale, purchasing patterns, payment safety, decision-maker functions and practical commercial terms.",
  procurement_opportunity:"Prioritise what the target regularly consumes, defensible quantities/spend, specifications, purchase frequency, sourcing geography, procurement departments and VMG-relevant opportunities. Never invent consumption.",
  quick_company_check:"Use a lower-depth screening: exact identity, business, approximate scale only where evidenced, material red flags, latest financial/credit signals, and whether full due diligence is warranted."
};

export function templateInstruction(key:string){return TEMPLATE_RULES[key]||TEMPLATE_RULES.vmg_full_due_diligence}

export function env(name:string){ try{return Netlify.env.get(name)||""}catch{return""} }
export function config(){
  const supabaseSecret=env("SUPABASE_SECRET_KEY")||env("SUPABASE_SERVICE_ROLE_KEY");
  return {
    appEnv:env("APP_ENV")||"preview",
    geminiKey:env("GEMINI_API_KEY"),
    tavilyKey:env("TAVILY_API_KEY"),
    openAIKey:env("OPENAI_API_KEY"),
    supabaseUrl:env("SUPABASE_URL").replace(/\/$/,""),
    supabaseSecret,
    dailyLimit:Math.max(1,Number(env("RESEARCH_DAILY_COMPANY_LIMIT")||20))
  };
}
export function providerStatus(){
  const c=config();return {
    app_env:c.appEnv,
    research_daily_company_limit:c.dailyLimit,
    gemini:{configured:Boolean(c.geminiKey),role:"PRIMARY"},
    google_search_grounding:{available:Boolean(c.geminiKey)},
    tavily:{configured:Boolean(c.tavilyKey),role:"FALLBACK"},
    openai:{configured:Boolean(c.openAIKey),role:"OPTIONAL"},
    supabase:{configured:Boolean(c.supabaseUrl&&c.supabaseSecret),role:"DATABASE"}
  };
}
export function json(data:any,status=200,headers:Record<string,string>={}) {
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}});
}
export async function readJson(req:Request){ if(!(req.headers.get("content-type")||"").includes("application/json"))throw new Error("Expected application/json");return await req.json() as any; }
export function safeError(e:any){return String(e?.message||e||"Unknown error").replace(/(AIza[0-9A-Za-z_-]{20,}|tvly-[0-9A-Za-z_-]+|sb_secret_[0-9A-Za-z_-]+)/g,"[redacted]")}
export function dayKey(date=new Date()){const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);const m:any=Object.fromEntries(parts.map(p=>[p.type,p.value]));return `${m.year}-${m.month}-${m.day}`}
export function nextReset(now=new Date()){const p:any=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).formatToParts(now).map(x=>[x.type,x.value]));const localAsUtc=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);const offset=now.getTime()-localAsUtc;return new Date(Date.UTC(+p.year,+p.month-1,+p.day+1,0,0,0)+offset).toISOString()}

function dbHeaders(extra:Record<string,string>={}){const c=config();if(!c.supabaseUrl||!c.supabaseSecret)throw new Error("Supabase is not configured.");return {apikey:c.supabaseSecret,authorization:`Bearer ${c.supabaseSecret}`,"content-type":"application/json",...extra}}
export async function rest(path:string,init:RequestInit={}){const c=config();if(!c.supabaseUrl||!c.supabaseSecret)throw new Error("Supabase is not configured.");const r=await fetch(`${c.supabaseUrl}/rest/v1/${path}`,{...init,headers:{...dbHeaders(),...(init.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(`Supabase ${r.status}: ${t.slice(0,500)}`);if(!t)return null;try{return JSON.parse(t)}catch{return t}}
export async function rpc(name:string,body:any){return await rest(`rpc/${name}`,{method:"POST",body:JSON.stringify(body)})}
export async function providerSecret(provider:"gemini"|"tavily"|"openai"){
  const c=config();const envKey=provider==="gemini"?c.geminiKey:provider==="tavily"?c.tavilyKey:c.openAIKey;if(envKey)return envKey;
  try{const ws=await workspace();const v=await rpc("vmg_get_provider_secret",{p_workspace_id:ws.id,p_provider:provider});return typeof v==="string"?v:""}catch{return""}
}
export async function providerConnections(){
  try{const ws=await workspace();return await select("provider_connections",`workspace_id=eq.${ws.id}&select=provider,masked_suffix,status,selected_model,billing_mode,connected_at,last_verified_at,last_latency_ms,health,provider_metadata,updated_at`)||[]}catch{return[]}
}
export async function select(table:string,q=""){return await rest(`${table}?${q}`,{method:"GET"})}
export async function insert(table:string,rows:any,returnRows=true){return await rest(table,{method:"POST",headers:{Prefer:returnRows?"return=representation":"return=minimal"},body:JSON.stringify(rows)})}
export async function update(table:string,q:string,patch:any,returnRows=true){const clean=Object.fromEntries(Object.entries(patch).filter(([,v])=>v!==undefined));return await rest(`${table}?${q}`,{method:"PATCH",headers:{Prefer:returnRows?"return=representation":"return=minimal"},body:JSON.stringify(clean)})}
export async function workspace(){const r=await select("workspaces","slug=eq.VMG&select=id,slug,name&limit=1");if(!r?.length)throw new Error("VMG workspace is not initialized. Apply the Supabase migration first.");return r[0]}
export async function workspaceSettings(){try{const ws=await workspace();const r=await select("workspace_settings",`workspace_id=eq.${ws.id}&select=settings_json&limit=1`);return r?.[0]?.settings_json||{}}catch{return{}}}
export async function providerConnection(provider:string){try{const ws=await workspace();const r=await select("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.${provider}&select=provider,status,selected_model,billing_mode,health,provider_metadata&limit=1`);return r?.[0]||null}catch{return null}}
export async function researchStrategy(){
  const settings=await workspaceSettings();const strategy=settings.ai_strategy||"free_first";const paid=settings.cost_protection?.allow_paid_api_usage===true;
  const gemini=Boolean(await providerSecret("gemini")),openai=Boolean(await providerSecret("openai"));
  if(strategy==="openai_only"){if(!paid)throw new Error("OpenAI is a paid API provider. Paid API usage is currently disabled.");if(!openai)throw new Error("OpenAI is not connected.");return{provider:"openai",model:settings.openai_model||"gpt-5.6-luna",settings}}
  if(strategy==="gemini_only"){if(!gemini)throw new Error("Gemini is not connected.");return{provider:"gemini",model:"gemini-2.5-flash",settings}}
  if(strategy==="best_available"&&paid&&openai){return{provider:"openai",model:settings.openai_model||"gpt-5.6-sol",settings}}
  if(strategy==="custom"){
    const primary=settings.primary_ai||"gemini";
    if(primary==="openai"){if(!paid)throw new Error("Paid API usage is disabled.");if(!openai)throw new Error("OpenAI is not connected.");return{provider:"openai",model:settings.openai_model||"gpt-5.6-luna",settings}}
  }
  if(!gemini)throw new Error("Gemini is not connected. Free First requires Gemini.");
  return{provider:"gemini",model:"gemini-2.5-flash",settings};
}
export async function uploadStorage(path:string,bytes:ArrayBuffer,mime:string){const c=config();if(!c.supabaseUrl||!c.supabaseSecret)throw new Error("Supabase is not configured.");const r=await fetch(`${c.supabaseUrl}/storage/v1/object/company-documents/${path}`,{method:"POST",headers:{apikey:c.supabaseSecret,authorization:`Bearer ${c.supabaseSecret}`,"content-type":mime||"application/octet-stream","x-upsert":"false"},body:bytes});const t=await r.text();if(!r.ok)throw new Error(`Storage ${r.status}: ${t.slice(0,500)}`);return t?JSON.parse(t):{}}

export async function recordUsage(provider:string,operation:string,success:boolean,meta:any={}){
  try{const ws=await workspace();await insert("provider_usage",{workspace_id:ws.id,usage_day:dayKey(),provider,operation,request_count:1,success,prompt_tokens:meta.prompt_tokens||null,output_tokens:meta.output_tokens||null,estimated_cost_usd:meta.estimated_cost_usd??null,metadata:meta.metadata||{}},false)}catch{}
}
function geminiText(p:any){return (p?.candidates?.[0]?.content?.parts||[]).map((x:any)=>x.text||"").join("\n").trim()}
function geminiSources(p:any){const out:any[]=[],seen=new Set<string>();for(const ch of p?.candidates?.[0]?.groundingMetadata?.groundingChunks||[]){const w=ch?.web;if(w?.uri&&!seen.has(w.uri)){seen.add(w.uri);out.push({title:w.title||w.uri,url:w.uri,publisher:w.title||""})}}return out}
export async function geminiGrounded(prompt:string){
  const key=await providerSecret("gemini");if(!key)throw new Error("Research provider is not configured. Connect Gemini in Settings.");
  const start=Date.now();const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],tools:[{google_search:{}}],generationConfig:{temperature:.15}})});const p=await r.json();if(!r.ok){await recordUsage("gemini","grounded_search",false,{metadata:{status:r.status}});throw new Error(`Gemini ${r.status}: ${JSON.stringify(p).slice(0,600)}`)}const u=p?.usageMetadata||{};await recordUsage("gemini","grounded_search",true,{prompt_tokens:u.promptTokenCount,output_tokens:u.candidatesTokenCount,metadata:{duration_ms:Date.now()-start}});return{text:geminiText(p),sources:geminiSources(p)}
}
export async function geminiJson(prompt:string){
  const key=await providerSecret("gemini");if(!key)throw new Error("Research provider is not configured. Connect Gemini in Settings.");
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:.05,responseMimeType:"application/json"}})});const p=await r.json();if(!r.ok){await recordUsage("gemini","structured_synthesis",false,{metadata:{status:r.status}});throw new Error(`Gemini ${r.status}: ${JSON.stringify(p).slice(0,600)}`)}const u=p?.usageMetadata||{};await recordUsage("gemini","structured_synthesis",true,{prompt_tokens:u.promptTokenCount,output_tokens:u.candidatesTokenCount});const t=geminiText(p);try{return JSON.parse(t)}catch{const m=t.match(/\{[\s\S]*\}/);if(!m)throw new Error("Gemini returned invalid JSON.");return JSON.parse(m[0])}}
export async function tavily(query:string){const key=await providerSecret("tavily");if(!key)return{text:"",sources:[]};const r=await fetch("https://api.tavily.com/search",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({query,search_depth:"advanced",max_results:8,include_answer:true})});const p=await r.json();if(!r.ok){await recordUsage("tavily","search",false,{metadata:{status:r.status}});throw new Error(`Tavily ${r.status}`)}await recordUsage("tavily","search",true);const sources=(p.results||[]).map((x:any)=>({title:x.title||x.url,url:x.url,publisher:(()=>{try{return new URL(x.url).hostname}catch{return""}})(),snippet:String(x.content||"").slice(0,500)}));return{text:[p.answer||"",...sources.map((s:any)=>`${s.title}: ${s.snippet}`)].join("\n"),sources}}

function openAIText(p:any){if(typeof p?.output_text==="string")return p.output_text;return (p?.output||[]).flatMap((o:any)=>o?.content||[]).map((c:any)=>c?.text||"").join("\n").trim()}
function openAISources(p:any){const out:any[]=[],seen=new Set<string>();for(const o of p?.output||[])for(const c of o?.content||[])for(const a of c?.annotations||[]){const u=a?.url||a?.url_citation?.url,t=a?.title||a?.url_citation?.title||u;if(u&&!seen.has(u)){seen.add(u);out.push({title:t||u,url:u,publisher:(()=>{try{return new URL(u).hostname}catch{return""}})()})}}return out}
function openAICost(model:string,input=0,output=0){const m:any={"gpt-5.6-luna":[.20,1.20],"gpt-5.6-terra":[2,12],"gpt-5.6-sol":[4,20],"gpt-6-astra":[10,50]};const p=m[model]||m["gpt-5.6-luna"];return input/1e6*p[0]+output/1e6*p[1]}
export async function openAIGrounded(prompt:string,model="gpt-5.6-luna"){
  const key=await providerSecret("openai");if(!key)throw new Error("OpenAI is not connected.");
  const started=Date.now();const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({model,input:prompt,tools:[{type:"web_search"}]})});const p=await r.json();
  const u=p?.usage||{};if(!r.ok){await recordUsage("openai","web_research",false,{metadata:{status:r.status,model}});throw new Error(`OpenAI ${r.status}: ${safeError(p?.error?.message||"request failed")}`)}
  await recordUsage("openai","web_research",true,{prompt_tokens:u.input_tokens,output_tokens:u.output_tokens,estimated_cost_usd:openAICost(model,u.input_tokens,u.output_tokens),metadata:{model,duration_ms:Date.now()-started}});
  return{text:openAIText(p),sources:openAISources(p)};
}
export async function openAIJson(prompt:string,model="gpt-5.6-luna"){
  const key=await providerSecret("openai");if(!key)throw new Error("OpenAI is not connected.");
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({model,input:prompt})});const p=await r.json();const u=p?.usage||{};
  if(!r.ok){await recordUsage("openai","structured_synthesis",false,{metadata:{status:r.status,model}});throw new Error(`OpenAI ${r.status}: ${safeError(p?.error?.message||"request failed")}`)}
  await recordUsage("openai","structured_synthesis",true,{prompt_tokens:u.input_tokens,output_tokens:u.output_tokens,estimated_cost_usd:openAICost(model,u.input_tokens,u.output_tokens),metadata:{model}});
  const t=openAIText(p);try{return JSON.parse(t)}catch{const m=t.match(/\{[\s\S]*\}/);if(!m)throw new Error("OpenAI returned invalid JSON.");return JSON.parse(m[0])}
}

export function entityPrompt(seed:string){return `${SYSTEM_RULES}
Resolve this entity seed using live web evidence: ${seed}
Return only JSON:
{"resolved":true,"ambiguity":"none|low|material","candidates":[{"legal_name":"","brand":"","country":"","state_region":"","registration_id":"","tax_id":"","website":"","registered_address":"","directors":[],"confidence":"HIGH|MEDIUM|LOW","evidence_summary":""}]}
Use only real candidates supported by evidence. Never manufacture a similar entity. If unresolved: resolved=false, candidates=[].
`}
export function groupPrompt(company:any,g:any,extra=""){return `${SYSTEM_RULES}
TARGET: ${JSON.stringify(company)}
TRACK: ${g.title}
${g.prompt}
${extra}
Research iteratively. Follow newly discovered directors, plants, lenders, rating reports or related entities when relevant. Prefer authoritative/current sources. State dates/periods, gaps and conflicts.
`}
export function synthPrompt(company:any,groups:any[],catalog:any[]){return `${SYSTEM_RULES}
Create structured report JSON for ${JSON.stringify(company)}.
DOSSIER: ${JSON.stringify(groups.map(g=>({key:g.key,title:g.title,text:String(g.text||"").slice(0,9000),source_keys:g.source_keys})))}
SOURCE CATALOG: ${JSON.stringify(catalog)}
Return only valid JSON:
{"identity":{},"directors":[],"ownership":[],"business":{"summary":"","products":[],"markets":[]},"operations":{"facilities":[],"capacity":[],"machinery":[]},"financials":{"periods":[],"ratios":[]},"debt":{"borrowings":[],"summary":""},"charges":[],"credit_ratings":[],"legal":[],"insolvency":[],"trade":{"coverage":"UNKNOWN","imports":[],"exports":[]},"buyers":[],"suppliers":[],"competitors":[],"procurement":[],"opportunities":[],"risks":[],"information_gaps":[],"management_takeaways":[],"evidence":[{"finding_key":"","label":"","value":null,"period":"","evidence_class":"VERIFIED|DERIVED|ESTIMATED|PREDICTED|PARTIAL|UNKNOWN","confidence":"HIGH|MEDIUM|LOW|INSUFFICIENT","source_keys":[],"notes":"","conflict_status":"NONE|CONFLICT"}]}
Rules: source_keys must come from catalog. UNKNOWN when evidence is missing. Estimates require method/assumption. Predictions require assumptions. Keep source conflicts visible. If cash flow/current debt/bank utilisation/creditor ageing/supplier behaviour are not reasonably verified, credit safety must remain not sufficiently verified.
`}

async function stagePatch(jobId:string,n:number,patch:any){await update("research_job_stages",`research_job_id=eq.${encodeURIComponent(jobId)}&stage_no=eq.${n}`,patch,false)}
async function stageMany(jobId:string,nums:number[],status:string,result:any=null){for(const n of nums)await stagePatch(jobId,n,{status,result_json:result??undefined,started_at:status==="RUNNING"?new Date().toISOString():undefined,completed_at:["COMPLETE","PARTIAL","NO RELIABLE DATA","FAILED"].includes(status)?new Date().toISOString():undefined})}
export function uniqueSources(arr:any[]){const m=new Map<string,any>();for(const s of arr||[])if(s?.url&&!m.has(s.url))m.set(s.url,s);return [...m.values()]}
export function coverage(stages:any[]){const a:any={identity:[1,2,3,4],business:[5,6],operations:[7,8],financials:[9],debt:[10,11,12],legal:[13,14,21],trade:[15,16,17],market:[18],procurement:[19,20],evidence:[22,23,24]};const score=(s:string)=>s==="COMPLETE"?1:s==="PARTIAL"?.6:s==="NO RELIABLE DATA"?.25:0;const b:any={};for(const[k,ns]of Object.entries(a)){const vals=(ns as number[]).map(n=>score(stages.find(x=>x.stage_no===n)?.status||""));b[k]=Math.round(vals.reduce((x,y)=>x+y,0)/vals.length*100)}return{overall:Math.round(Object.values(b).reduce((x:any,y:any)=>x+y,0)/Object.keys(b).length),breakdown:b,formula:"COMPLETE=100%, PARTIAL=60%, NO RELIABLE DATA=25%, FAILED/UNRUN=0%; area averages are equally weighted."}}

export async function runResearchJob(jobId:string){
  const c=config();const geminiKey=await providerSecret("gemini");if(!geminiKey)throw new Error("Research provider is not configured.");
  const js=await select("research_jobs",`id=eq.${encodeURIComponent(jobId)}&select=*&limit=1`);if(!js?.length)throw new Error("Research job not found.");const job=js[0];
  const cs=await select("companies",`id=eq.${encodeURIComponent(job.company_id)}&select=*&limit=1`);if(!cs?.length)throw new Error("Company not found.");const company={...cs[0],...(job.input_seed?.confirmed_entity||{})};
  const extra=[templateInstruction(job.template_key),job.custom_prompt?("USER CUSTOM INSTRUCTIONS (cannot override VMG evidence/safety rules):\n"+job.custom_prompt):""].filter(Boolean).join("\n\n");
  try{await insert("activity_logs",{workspace_id:job.workspace_id,action:"research_started",company_id:job.company_id,research_job_id:job.id,metadata:{template_key:job.template_key}},false)}catch{}
  await update("research_jobs",`id=eq.${job.id}`,{status:"RUNNING",started_at:new Date().toISOString()},false);await stageMany(job.id,[1],"COMPLETE",{entity:job.input_seed?.confirmed_entity||company});
  const groups:any[]=[],all:any[]=[];
  for(const g of GROUPS){await stageMany(job.id,g.stages,"RUNNING");try{const p=await geminiGrounded(groupPrompt(company,g,extra));let text=p.text,sources=uniqueSources(p.sources);if((sources.length<2||text.length<300)&&(await providerSecret("tavily"))){try{const f=await tavily(`"${company.legal_name}" ${g.title}`);text+="\n\nFALLBACK:\n"+f.text;sources=uniqueSources([...sources,...f.sources])}catch{}}
    const sourceKeys:string[]=[];for(const s of sources){const rows=await insert("sources",{workspace_id:job.workspace_id,company_id:job.company_id,research_job_id:job.id,title:s.title,url:s.url,publisher:s.publisher||null,retrieved_at:new Date().toISOString(),source_type:"web",metadata:{stage_group:g.key}});const row=rows?.[0];if(row){sourceKeys.push(row.id);if(s.snippet)await insert("source_snapshots",{workspace_id:job.workspace_id,source_id:row.id,excerpt:String(s.snippet).slice(0,500)},false)}}
    const st=!text.trim()&&!sources.length?"NO RELIABLE DATA":sources.length<2?"PARTIAL":"COMPLETE";await stageMany(job.id,g.stages,st,{summary:text.slice(0,12000),source_count:sources.length});groups.push({key:g.key,title:g.title,text,source_keys:sourceKeys});all.push(...sources.map((s:any,i:number)=>({...s,source_key:sourceKeys[i]})));
  }catch(e:any){await stageMany(job.id,g.stages,"FAILED",{error:safeError(e)});groups.push({key:g.key,title:g.title,text:"",source_keys:[]})}}
  await stageMany(job.id,[22],"RUNNING");const uniq=uniqueSources(all);await stageMany(job.id,[22],uniq.length>=5?"COMPLETE":"PARTIAL",{unique_source_count:uniq.length});
  await stageMany(job.id,[23,24],"RUNNING");let report:any;try{report=await geminiJson(synthPrompt(company,groups,all.filter(s=>s.source_key).map(s=>({source_key:s.source_key,title:s.title,url:s.url,publisher:s.publisher||""}))));await stageMany(job.id,[23],"COMPLETE")}catch(e:any){await stageMany(job.id,[23,24],"FAILED",{error:safeError(e)});await update("research_jobs",`id=eq.${job.id}`,{status:"FAILED",error_message:safeError(e),completed_at:new Date().toISOString()},false);return}
  const sts=await select("research_job_stages",`research_job_id=eq.${job.id}&select=*&order=stage_no.asc`);const cov=coverage(sts||[]);report.research_metadata={...(report.research_metadata||{}),job_id:job.id,company_id:job.company_id,template_key:job.template_key,researched_at:new Date().toISOString(),provider:"gemini-2.5-flash",evidence_coverage:cov};
  const prev=await select("research_reports",`company_id=eq.${job.company_id}&select=version_no&order=version_no.desc&limit=1`);const version=(prev?.[0]?.version_no||0)+1;const rr=await insert("research_reports",{workspace_id:job.workspace_id,company_id:job.company_id,research_job_id:job.id,version_no:version,template_key:job.template_key,report_json:report,evidence_coverage:cov.overall,source_count:uniq.length,created_at:new Date().toISOString()});const row=rr?.[0];
  if(row){await insert("report_versions",{workspace_id:job.workspace_id,company_id:job.company_id,report_id:row.id,version_no:version},false);await update("companies",`id=eq.${job.company_id}`,{current_report_id:row.id,updated_at:new Date().toISOString()},false);for(const ev of Array.isArray(report.evidence)?report.evidence:[])await insert("evidence_items",{workspace_id:job.workspace_id,company_id:job.company_id,research_job_id:job.id,report_id:row.id,finding_key:ev.finding_key||ev.label||crypto.randomUUID(),label:ev.label||ev.finding_key||"Finding",value_json:ev.value??null,period:ev.period||null,evidence_class:ev.evidence_class||"UNKNOWN",confidence:ev.confidence||"INSUFFICIENT",notes:ev.notes||null,conflict_status:ev.conflict_status||"NONE",source_keys:Array.isArray(ev.source_keys)?ev.source_keys:[]},false)}
  await stageMany(job.id,[24],"COMPLETE",{report_id:row?.id,version_no:version});await update("research_jobs",`id=eq.${job.id}`,{status:"COMPLETE",completed_at:new Date().toISOString(),source_count:uniq.length,evidence_coverage:cov.overall,report_id:row?.id||null},false);try{await insert("activity_logs",{workspace_id:job.workspace_id,action:"research_completed",company_id:job.company_id,research_job_id:job.id,metadata:{report_id:row?.id||null,version_no:version,source_count:uniq.length,evidence_coverage:cov.overall}},false)}catch{}
}

export async function exportReport(report:any,type:string){
  const r=report.report_json||{};const lines=[`VMG Company Intelligence — Report V${report.version_no}`,`Research date: ${report.created_at}`,`Evidence coverage: ${report.evidence_coverage??"N/A"}%`,"",...Object.entries(r).filter(([k])=>!["evidence","sources","research_metadata"].includes(k)).flatMap(([k,v])=>[k.replace(/_/g," ").toUpperCase(),typeof v==="string"?v:JSON.stringify(v),""])];
  if(type==="pdf"){const pdf=await PDFDocument.create();const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);let page=pdf.addPage([595.28,841.89]),y=800;const add=(text:string,size=9,b=false)=>{for(const raw of String(text).split(/\n/)){const words=raw.split(/\s+/);let line="";for(const w of words){const test=line?line+" "+w:w;if((b?bold:font).widthOfTextAtSize(test,size)>510){page.drawText(line,{x:42,y,size,font:b?bold:font,color:rgb(.08,.11,.16)});y-=size+4;line=w}else line=test}if(line){page.drawText(line,{x:42,y,size,font:b?bold:font,color:rgb(.08,.11,.16)});y-=size+4}if(y<55){page=pdf.addPage([595.28,841.89]);y=800}}};add(lines.shift()||"",18,true);for(const l of lines)add(l,l===String(l).toUpperCase()&&String(l).length<80?11:9,l===String(l).toUpperCase()&&String(l).length<80);return{bytes:await pdf.save(),mime:"application/pdf",ext:"pdf"}}
  if(type==="docx"){const children:any[]=[new Paragraph({text:lines.shift()||"",heading:HeadingLevel.TITLE})];for(const l of lines){const h=l===String(l).toUpperCase()&&String(l).length<80&&String(l).trim();children.push(new Paragraph({text:String(l),heading:h?HeadingLevel.HEADING_2:undefined}))}return{bytes:await Packer.toBuffer(new Document({sections:[{children}]})),mime:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",ext:"docx"}}
  if(type==="xlsx"){const wb=XLSX.utils.book_new();const add=(n:string,d:any)=>{let rows:any[]=[];if(Array.isArray(d))rows=d.map(x=>typeof x==="object"?x:{value:x});else if(d&&typeof d==="object")rows=Object.entries(d).map(([key,value])=>({key,value:typeof value==="string"?value:JSON.stringify(value)}));else rows=[{value:String(d??"N/A")}];XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),n.slice(0,31))};add("Executive Summary",{version:report.version_no,created_at:report.created_at,evidence_coverage:report.evidence_coverage,source_count:report.source_count});for(const [k,v] of Object.entries(r))add(k.replace(/_/g," "),v);return{bytes:XLSX.write(wb,{type:"buffer",bookType:"xlsx"}),mime:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",ext:"xlsx"}}
  throw new Error("type must be pdf, docx or xlsx")
}
