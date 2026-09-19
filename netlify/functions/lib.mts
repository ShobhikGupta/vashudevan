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

export const TEMPLATE_GROUPS:Record<string,string[]>={
  vmg_full_due_diligence:["identity","business","financial","legal","trade","market"],
  credit_counterparty_safety:["identity","financial","legal","trade"],
  supplier_due_diligence:["identity","business","financial","legal","market"],
  buyer_intelligence:["identity","business","financial","legal","trade"],
  procurement_opportunity:["identity","business","trade","market"],
  quick_company_check:["identity","business","financial","legal"]
};

export function templateInstruction(key:string){return TEMPLATE_RULES[key]||TEMPLATE_RULES.vmg_full_due_diligence}
export function templateGroups(key:string){return TEMPLATE_GROUPS[key]||TEMPLATE_GROUPS.vmg_full_due_diligence}
export function enabledStagesForGroup(g:any,defaults:any){
  const map:Record<number,boolean>={
    2:true,3:defaults.directors_promoters!==false,4:true,
    5:true,6:true,7:true,8:true,9:true,
    10:defaults.debt_charges!==false,11:defaults.debt_charges!==false,12:defaults.credit_ratings!==false,
    13:defaults.litigation_insolvency!==false,14:defaults.litigation_insolvency!==false,21:defaults.negative_signals!==false,
    15:defaults.imports_exports!==false,16:defaults.buyers_suppliers!==false,17:defaults.buyers_suppliers!==false,
    18:defaults.competitors!==false,19:defaults.procurement!==false,20:defaults.procurement!==false
  };
  return g.stages.filter((n:number)=>map[n]!==false);
}

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
  const settings=await workspaceSettings(),strategy=settings.ai_strategy||"free_first",cost=settings.cost_protection||{},paid=cost.allow_paid_api_usage===true,freeOnly=cost.free_only_mode!==false;
  const gemini=Boolean(await providerSecret("gemini")),openai=Boolean(await providerSecret("openai")),geminiConn=await providerConnection("gemini");
  const ensureGemini=()=>{if(!gemini)throw new Error("Gemini is not connected.");if(freeOnly&&geminiConn?.billing_mode==="paid")throw new Error("Gemini is connected as a paid provider, but Free-only mode is enabled.");return{provider:"gemini",model:"gemini-2.5-flash",settings}};
  const ensureOpenAI=(model:string)=>{if(!paid)throw new Error("OpenAI is a paid API provider. Paid API usage is currently disabled.");if(!openai)throw new Error("OpenAI is not connected.");return{provider:"openai",model,settings}};
  if(strategy==="openai_only")return ensureOpenAI(settings.openai_model||"gpt-5.6-luna");
  if(strategy==="gemini_only")return ensureGemini();
  if(strategy==="best_available"){if(paid&&openai)return ensureOpenAI(settings.openai_model||"gpt-5.6-sol");return ensureGemini()}
  if(strategy==="custom"){
    const primary=settings.primary_ai||"gemini";
    if(primary==="openai")return ensureOpenAI(settings.openai_model||"gpt-5.6-luna");
    return ensureGemini();
  }
  if(!gemini)throw new Error("Gemini is not connected. Free First requires Gemini.");
  return ensureGemini();
}
export async function uploadStorage(path:string,bytes:ArrayBuffer,mime:string){const c=config();if(!c.supabaseUrl||!c.supabaseSecret)throw new Error("Supabase is not configured.");const r=await fetch(`${c.supabaseUrl}/storage/v1/object/company-documents/${path}`,{method:"POST",headers:{apikey:c.supabaseSecret,authorization:`Bearer ${c.supabaseSecret}`,"content-type":mime||"application/octet-stream","x-upsert":"false"},body:bytes});const t=await r.text();if(!r.ok)throw new Error(`Storage ${r.status}: ${t.slice(0,500)}`);return t?JSON.parse(t):{}}

export async function recordUsage(provider:string,operation:string,success:boolean,meta:any={}){
  try{const ws=await workspace();await insert("provider_usage",{
    workspace_id:ws.id,research_job_id:meta.research_job_id||null,usage_day:dayKey(),provider,model:meta.model||null,operation,
    request_count:1,search_calls:meta.search_calls||0,tavily_credits:meta.tavily_credits||0,success,
    prompt_tokens:meta.prompt_tokens||null,output_tokens:meta.output_tokens||null,duration_ms:meta.duration_ms||meta.metadata?.duration_ms||null,
    estimated_cost_usd:meta.estimated_cost_usd??null,metadata:meta.metadata||{}
  },false)}catch{}
}
function geminiText(p:any){return (p?.candidates?.[0]?.content?.parts||[]).map((x:any)=>x.text||"").join("\n").trim()}
function geminiSources(p:any){const out:any[]=[],seen=new Set<string>();for(const ch of p?.candidates?.[0]?.groundingMetadata?.groundingChunks||[]){const w=ch?.web;if(w?.uri&&!seen.has(w.uri)){seen.add(w.uri);out.push({title:w.title||w.uri,url:w.uri,publisher:w.title||""})}}return out}
export async function geminiGrounded(prompt:string,researchJobId:string|null=null){
  const key=await providerSecret("gemini");if(!key)throw new Error("Research provider is not configured. Connect Gemini in Settings.");
  const start=Date.now();const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],tools:[{google_search:{}}],generationConfig:{temperature:.15}})});const p=await r.json();if(!r.ok){await recordUsage("gemini","grounded_search",false,{research_job_id:researchJobId,model:"gemini-2.5-flash",search_calls:1,metadata:{status:r.status}});throw new Error(`Gemini ${r.status}: ${JSON.stringify(p).slice(0,600)}`)}const u=p?.usageMetadata||{};const gc=await providerConnection("gemini");const geminiCost=gc?.billing_mode==="paid"?(Number(u.promptTokenCount||0)/1e6*.30+Number(u.candidatesTokenCount||0)/1e6*2.50):0;await recordUsage("gemini","grounded_search",true,{research_job_id:researchJobId,model:"gemini-2.5-flash",search_calls:1,prompt_tokens:u.promptTokenCount,output_tokens:u.candidatesTokenCount,duration_ms:Date.now()-start,estimated_cost_usd:geminiCost});return{text:geminiText(p),sources:geminiSources(p)}
}
export async function geminiJson(prompt:string,researchJobId:string|null=null){
  const key=await providerSecret("gemini");if(!key)throw new Error("Research provider is not configured. Connect Gemini in Settings.");
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:.05,responseMimeType:"application/json"}})});const p=await r.json();if(!r.ok){await recordUsage("gemini","structured_synthesis",false,{research_job_id:researchJobId,model:"gemini-2.5-flash",metadata:{status:r.status}});throw new Error(`Gemini ${r.status}: ${JSON.stringify(p).slice(0,600)}`)}const u=p?.usageMetadata||{};const gc=await providerConnection("gemini");const geminiCost=gc?.billing_mode==="paid"?(Number(u.promptTokenCount||0)/1e6*.30+Number(u.candidatesTokenCount||0)/1e6*2.50):0;await recordUsage("gemini","structured_synthesis",true,{research_job_id:researchJobId,model:"gemini-2.5-flash",prompt_tokens:u.promptTokenCount,output_tokens:u.candidatesTokenCount,estimated_cost_usd:geminiCost});const t=geminiText(p);try{return JSON.parse(t)}catch{const m=t.match(/\{[\s\S]*\}/);if(!m)throw new Error("Gemini returned invalid JSON.");return JSON.parse(m[0])}}
export async function tavily(query:string,researchJobId:string|null=null){const key=await providerSecret("tavily");if(!key)return{text:"",sources:[]};const r=await fetch("https://api.tavily.com/search",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({query,search_depth:"advanced",max_results:8,include_answer:true})});const p=await r.json();if(!r.ok){await recordUsage("tavily","search",false,{research_job_id:researchJobId,model:"advanced-search",search_calls:1,tavily_credits:2,metadata:{status:r.status}});throw new Error(`Tavily ${r.status}`)}const tc=await providerConnection("tavily");await recordUsage("tavily","search",true,{research_job_id:researchJobId,model:"advanced-search",search_calls:1,tavily_credits:2,estimated_cost_usd:tc?.billing_mode==="paid"?.016:0});const sources=(p.results||[]).map((x:any)=>({title:x.title||x.url,url:x.url,publisher:(()=>{try{return new URL(x.url).hostname}catch{return""}})(),snippet:String(x.content||"").slice(0,500)}));return{text:[p.answer||"",...sources.map((s:any)=>`${s.title}: ${s.snippet}`)].join("\n"),sources}}

function openAIText(p:any){if(typeof p?.output_text==="string")return p.output_text;return (p?.output||[]).flatMap((o:any)=>o?.content||[]).map((c:any)=>c?.text||"").join("\n").trim()}
function openAISources(p:any){const out:any[]=[],seen=new Set<string>();for(const o of p?.output||[])for(const c of o?.content||[])for(const a of c?.annotations||[]){const u=a?.url||a?.url_citation?.url,t=a?.title||a?.url_citation?.title||u;if(u&&!seen.has(u)){seen.add(u);out.push({title:t||u,url:u,publisher:(()=>{try{return new URL(u).hostname}catch{return""}})()})}}return out}
function openAICost(model:string,input=0,output=0){const m:any={"gpt-5.6-luna":[.20,1.20],"gpt-5.6-terra":[2,12],"gpt-5.6-sol":[4,20],"gpt-6-astra":[10,50]};const p=m[model]||m["gpt-5.6-luna"];return input/1e6*p[0]+output/1e6*p[1]}
export async function openAIGrounded(prompt:string,model="gpt-5.6-luna",researchJobId:string|null=null){
  const key=await providerSecret("openai");if(!key)throw new Error("OpenAI is not connected.");
  const started=Date.now();const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({model,input:prompt,tools:[{type:"web_search"}]})});const p=await r.json();
  const u=p?.usage||{};if(!r.ok){await recordUsage("openai","web_research",false,{research_job_id:researchJobId,model,search_calls:1,metadata:{status:r.status,model}});throw new Error(`OpenAI ${r.status}: ${safeError(p?.error?.message||"request failed")}`)}
  await recordUsage("openai","web_research",true,{research_job_id:researchJobId,model,search_calls:1,prompt_tokens:u.input_tokens,output_tokens:u.output_tokens,duration_ms:Date.now()-started,estimated_cost_usd:openAICost(model,u.input_tokens,u.output_tokens),metadata:{model}});
  return{text:openAIText(p),sources:openAISources(p)};
}
export async function openAIJson(prompt:string,model="gpt-5.6-luna",researchJobId:string|null=null){
  const key=await providerSecret("openai");if(!key)throw new Error("OpenAI is not connected.");
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({model,input:prompt})});const p=await r.json();const u=p?.usage||{};
  if(!r.ok){await recordUsage("openai","structured_synthesis",false,{research_job_id:researchJobId,model,metadata:{status:r.status,model}});throw new Error(`OpenAI ${r.status}: ${safeError(p?.error?.message||"request failed")}`)}
  await recordUsage("openai","structured_synthesis",true,{research_job_id:researchJobId,model,prompt_tokens:u.input_tokens,output_tokens:u.output_tokens,estimated_cost_usd:openAICost(model,u.input_tokens,u.output_tokens),metadata:{model}});
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
Use stable explicit finding_key values wherever applicable, including:
company.identity.legal_name, company.identity.registration_id, company.identity.tax_id,
financial.revenue.latest, financial.ebitda.latest, financial.pat.latest, financial.operating_cash_flow.latest,
financial.net_worth.latest, debt.current, operations.capacity, credit.latest_rating,
legal.material_cases, trade.top_buyers, trade.top_suppliers, procurement.primary_inputs,
risk.credit_safety, risk.biggest_concern.
Never rely on evidence array position to identify a metric.
FINANCIAL NUMERIC SCHEMA:
For each financial period, keep period/fy as text and represent numeric metrics as structured objects:
{"value":487,"currency":"INR","unit":"crore","evidence_class":"VERIFIED","confidence":"HIGH","source_keys":["..."]}
Use this for revenue, ebitda, pat, operating_cash_flow, net_worth, debt, working_capital, receivable_days, creditor_days and other numeric financial metrics when known.
The "value" field must be a raw number without currency symbols or commas. If a comparable numeric value cannot be verified, use null/UNKNOWN rather than parsing or inventing it.
`}

async function stagePatch(jobId:string,n:number,patch:any){await update("research_job_stages",`research_job_id=eq.${encodeURIComponent(jobId)}&stage_no=eq.${n}`,patch,false)}
async function stageMany(jobId:string,nums:number[],status:string,result:any=null){for(const n of nums)await stagePatch(jobId,n,{status,result_json:result??undefined,started_at:status==="RUNNING"?new Date().toISOString():undefined,completed_at:["COMPLETE","PARTIAL","NO RELIABLE DATA","FAILED","SKIPPED"].includes(status)?new Date().toISOString():undefined})}
export function uniqueSources(arr:any[]){const m=new Map<string,any>();for(const s of arr||[])if(s?.url&&!m.has(s.url))m.set(s.url,s);return [...m.values()]}
export function coverage(stages:any[]){const a:any={identity:[1,2,3,4],business:[5,6],operations:[7,8],financials:[9],debt:[10,11,12],legal:[13,14,21],trade:[15,16,17],market:[18],procurement:[19,20],evidence:[22,23,24]};const score=(s:string)=>s==="COMPLETE"?1:s==="PARTIAL"?.6:s==="NO RELIABLE DATA"?.25:0;const b:any={};for(const[k,ns]of Object.entries(a)){const applicable=(ns as number[]).map(n=>stages.find(x=>x.stage_no===n)).filter(x=>x&&x.status!=="SKIPPED");if(!applicable.length){b[k]=null;continue}const vals=applicable.map(x=>score(x.status||""));b[k]=Math.round(vals.reduce((x:number,y:number)=>x+y,0)/vals.length*100)}const scored=Object.values(b).filter((x:any)=>typeof x==="number") as number[];return{overall:scored.length?Math.round(scored.reduce((x,y)=>x+y,0)/scored.length):0,breakdown:b,formula:"COMPLETE=100%, PARTIAL=60%, NO RELIABLE DATA=25%, FAILED/UNRUN=0%; SKIPPED stages are excluded from coverage denominators."}}

async function estimatedSpendUsd(q:string){
  try{const ws=await workspace();const rows=await select("provider_usage",`workspace_id=eq.${ws.id}&${q}&select=estimated_cost_usd`);return (rows||[]).reduce((a:number,x:any)=>a+Number(x.estimated_cost_usd||0),0)}catch{return 0}
}
async function paidBudgetStatus(jobId:string,settings:any){
  const cost=settings.cost_protection||{};if(cost.allow_paid_api_usage!==true)return{allowed:false,reason:"Paid API usage is disabled."};
  const fx=Number(cost.usd_inr_reference||0);if(!(fx>0))return{allowed:false,reason:"Set a USD/INR cost conversion reference in Cost Protection before paid API use."};
  const now=new Date(),week=new Date(now.getTime()-7*86400000).toISOString(),month=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)).toISOString();
  const [jobUsd,dayUsd,weekUsd,monthUsd]=await Promise.all([
    estimatedSpendUsd(`research_job_id=eq.${encodeURIComponent(jobId)}`),
    estimatedSpendUsd(`usage_day=eq.${dayKey()}`),
    estimatedSpendUsd(`created_at=gte.${encodeURIComponent(week)}`),
    estimatedSpendUsd(`created_at=gte.${encodeURIComponent(month)}`)
  ]);
  const checks=[
    ["Maximum cost / report",Number(cost.max_cost_per_report_inr||0),jobUsd*fx],
    ["Daily API budget",Number(cost.daily_budget_inr||0),dayUsd*fx],
    ["Weekly API budget",Number(cost.weekly_budget_inr||0),weekUsd*fx],
    ["Monthly API budget",Number(cost.monthly_budget_inr||0),monthUsd*fx]
  ];
  for(const [label,cap,spent] of checks as any[])if(cap<=0||spent>=cap)return{allowed:false,reason:`RESEARCH STOPPED BY COST PROTECTION — ${label} reached or not configured.`,fx,spent_inr:spent,cap_inr:cap};
  return{allowed:true,fx,job_inr:jobUsd*fx,day_inr:dayUsd*fx,week_inr:weekUsd*fx,month_inr:monthUsd*fx};
}
function metricNumber(v:any){if(typeof v==="number"&&Number.isFinite(v))return v;if(v&&typeof v==="object"&&typeof v.value==="number"&&Number.isFinite(v.value))return v.value;return null}
function metricMeta(v:any){return v&&typeof v==="object"?v:{}}
async function persistFinancials(job:any,row:any,report:any){
  const periods=Array.isArray(report?.financials?.periods)?report.financials.periods:[],keys=["revenue","ebitda","pat","operating_cash_flow","net_worth","debt","working_capital","receivable_days","creditor_days","inventory_days","interest","assets","liabilities","inventory","receivables","payables"];
  for(const p of periods){
    const label=String(p?.period||p?.fy||p?.year||"").trim();if(!label)continue;
    const fp=await insert("financial_periods",{workspace_id:job.workspace_id,company_id:job.company_id,report_id:row.id,period_label:label});const periodRow=fp?.[0];if(!periodRow)continue;
    for(const key of keys){const raw=p?.[key],num=metricNumber(raw);if(num==null)continue;const m=metricMeta(raw);await insert("financial_metrics",{workspace_id:job.workspace_id,company_id:job.company_id,financial_period_id:periodRow.id,metric_key:key,value_numeric:num,value_text:null,currency:m.currency||p.currency||null,unit:m.unit||p.unit||null,evidence_class:m.evidence_class||null,confidence:m.confidence||null,source_keys:Array.isArray(m.source_keys)?m.source_keys:[]},false)}
  }
}
export async function runResearchJob(jobId:string){
  const route=await researchStrategy();
  const js=await select("research_jobs",`id=eq.${encodeURIComponent(jobId)}&select=*&limit=1`);if(!js?.length)throw new Error("Research job not found.");const job=js[0];
  const cs=await select("companies",`id=eq.${encodeURIComponent(job.company_id)}&select=*&limit=1`);if(!cs?.length)throw new Error("Company not found.");const company={...cs[0],...(job.input_seed?.confirmed_entity||{})};
  const settings=route.settings||{},defaults=settings.research_defaults||{},privacy=settings.privacy||{},cost=settings.cost_protection||{},active=new Set(templateGroups(job.template_key));
  const extra=[templateInstruction(job.template_key),job.custom_prompt?("USER CUSTOM INSTRUCTIONS (cannot override VMG evidence/safety rules):\n"+job.custom_prompt):""].filter(Boolean).join("\n\n");
  const isPaid=route.provider==="openai"||(await providerConnection(route.provider))?.billing_mode==="paid";
  const budget=async()=>isPaid?await paidBudgetStatus(job.id,settings):({allowed:true});
  const mainResearch=async(prompt:string)=>{
    const b=await budget();if(!b.allowed)throw Object.assign(new Error(b.reason),{code:"COST_PROTECTION"});
    return route.provider==="openai"?await openAIGrounded(prompt,route.model,job.id):await geminiGrounded(prompt,job.id)
  };
  const synth=async(prompt:string)=>{
    const b=await budget();if(!b.allowed)throw Object.assign(new Error(b.reason),{code:"COST_PROTECTION"});
    return route.provider==="openai"?await openAIJson(prompt,route.model,job.id):await geminiJson(prompt,job.id)
  };
  const tavilyKey=await providerSecret("tavily"),tavilyConn=await providerConnection("tavily");
  const tavilyAllowed=Boolean(tavilyKey)&&defaults.tavily_when_weak!==false&&!(cost.free_only_mode!==false&&tavilyConn?.billing_mode==="paid");
  try{await insert("activity_logs",{workspace_id:job.workspace_id,action:"research_started",company_id:job.company_id,research_job_id:job.id,metadata:{template_key:job.template_key,provider:route.provider,model:route.model}},false)}catch{}
  await update("research_jobs",`id=eq.${job.id}`,{status:"RUNNING",started_at:new Date().toISOString(),provider:route.provider+":"+route.model},false);await stageMany(job.id,[1],"COMPLETE",{entity:job.input_seed?.confirmed_entity||company});
  const groups:any[]=[],all:any[]=[];
  for(const g of GROUPS){
    if(!active.has(g.key)){await stageMany(job.id,g.stages,"SKIPPED",{reason:"Disabled by selected research template."});continue}
    const enabled=enabledStagesForGroup(g,defaults),disabled=g.stages.filter((n:number)=>!enabled.includes(n));
    if(disabled.length)await stageMany(job.id,disabled,"SKIPPED",{reason:"Disabled by Research Defaults."});
    if(!enabled.length)continue;
    await stageMany(job.id,enabled,"RUNNING");
    try{
      const scope=`SETTINGS SCOPE: Research only enabled stage numbers ${enabled.join(", ")} for this track. Do not spend research effort on disabled stage numbers ${disabled.join(", ")||"none"}. Follow related entities only when ${defaults.follow_related_entities!==false?"materially relevant":"necessary to resolve the exact target entity; otherwise do not expand related entities"}.`;
      const p=await mainResearch(groupPrompt(company,g,extra+"\n"+scope));let bodyText=p.text,sources=uniqueSources(p.sources);
      if((sources.length<Number(defaults.minimum_preferred_sources||5)||bodyText.length<300)&&tavilyAllowed){
        try{const t=await tavily(`"${company.legal_name}" ${g.title}`,job.id);bodyText+="\n\nINDEPENDENT FALLBACK SEARCH:\n"+t.text;sources=uniqueSources([...sources,...t.sources])}catch{}
      }
      const sourceKeys:string[]=[];
      for(const src of sources){
        const rows=await insert("sources",{workspace_id:job.workspace_id,company_id:job.company_id,research_job_id:job.id,title:src.title,url:src.url,publisher:src.publisher||null,retrieved_at:new Date().toISOString(),source_type:"web",metadata:{stage_group:g.key,research_provider:route.provider}});
        const row=rows?.[0];if(row){sourceKeys.push(row.id);if(privacy.store_source_snapshots!==false&&src.snippet)await insert("source_snapshots",{workspace_id:job.workspace_id,source_id:row.id,excerpt:String(src.snippet).slice(0,1200)},false)}
      }
      const st=!bodyText.trim()&&!sources.length?"NO RELIABLE DATA":sources.length<2?"PARTIAL":"COMPLETE";
      await stageMany(job.id,enabled,st,{summary:bodyText.slice(0,12000),source_count:sources.length,research_provider:route.provider});
      groups.push({key:g.key,title:g.title,text:bodyText,source_keys:sourceKeys});all.push(...sources.map((x:any,i:number)=>({...x,source_key:sourceKeys[i]})));
    }catch(e:any){
      if(e?.code==="COST_PROTECTION"||String(e?.message||"").includes("COST PROTECTION")){
        await stageMany(job.id,enabled,"PARTIAL",{error:safeError(e),reason:"cost_protection"});
        for(const future of GROUPS.slice(GROUPS.indexOf(g)+1)){const en=enabledStagesForGroup(future,defaults);if(active.has(future.key)&&en.length)await stageMany(job.id,en,"SKIPPED",{reason:"Research stopped by cost protection."})}
        await stageMany(job.id,[22],"PARTIAL",{reason:"Research stopped by cost protection.",unique_source_count:uniqueSources(all).length});await stageMany(job.id,[23,24],"SKIPPED",{reason:"Research stopped before synthesis."});
        await update("research_jobs",`id=eq.${job.id}`,{status:"PARTIAL",error_message:safeError(e),completed_at:new Date().toISOString(),source_count:uniqueSources(all).length},false);
        try{await insert("activity_logs",{workspace_id:job.workspace_id,action:"research_stopped_cost_protection",company_id:job.company_id,research_job_id:job.id,metadata:{reason:safeError(e)}},false)}catch{}
        return;
      }
      await stageMany(job.id,enabled,"FAILED",{error:safeError(e)});groups.push({key:g.key,title:g.title,text:"",source_keys:[]})
    }
  }
  await stageMany(job.id,[22],"RUNNING");const uniq=uniqueSources(all);await stageMany(job.id,[22],uniq.length>=Number(defaults.minimum_preferred_sources||5)?"COMPLETE":"PARTIAL",{unique_source_count:uniq.length});
  await stageMany(job.id,[23,24],"RUNNING");let report:any;
  try{report=await synth(synthPrompt(company,groups,all.filter(x=>x.source_key).map(x=>({source_key:x.source_key,title:x.title,url:x.url,publisher:x.publisher||""}))));await stageMany(job.id,[23],"COMPLETE")}
  catch(e:any){
    if(e?.code==="COST_PROTECTION"||String(e?.message||"").includes("COST PROTECTION")){await stageMany(job.id,[23],"PARTIAL",{error:safeError(e)});await stageMany(job.id,[24],"SKIPPED",{reason:"Research stopped before final report generation."});await update("research_jobs",`id=eq.${job.id}`,{status:"PARTIAL",error_message:safeError(e),completed_at:new Date().toISOString(),source_count:uniq.length},false);return}
    await stageMany(job.id,[23,24],"FAILED",{error:safeError(e)});await update("research_jobs",`id=eq.${job.id}`,{status:"FAILED",error_message:safeError(e),completed_at:new Date().toISOString()},false);throw e
  }
  const sts=await select("research_job_stages",`research_job_id=eq.${job.id}&select=*&order=stage_no.asc`);const cov=coverage(sts||[]);
  report.research_metadata={...(report.research_metadata||{}),job_id:job.id,company_id:job.company_id,template_key:job.template_key,researched_at:new Date().toISOString(),provider:route.provider,model:route.model,evidence_coverage:cov};
  const prev=await select("research_reports",`company_id=eq.${job.company_id}&select=version_no&order=version_no.desc&limit=1`);const version=(prev?.[0]?.version_no||0)+1;
  const rr=await insert("research_reports",{workspace_id:job.workspace_id,company_id:job.company_id,research_job_id:job.id,version_no:version,template_key:job.template_key,report_json:report,evidence_coverage:cov.overall,source_count:uniq.length,created_at:new Date().toISOString()});const row=rr?.[0];
  if(row){
    await insert("report_versions",{workspace_id:job.workspace_id,company_id:job.company_id,report_id:row.id,version_no:version},false);
    await update("companies",`id=eq.${job.company_id}`,{current_report_id:row.id,updated_at:new Date().toISOString()},false);
    for(const ev of Array.isArray(report.evidence)?report.evidence:[])await insert("evidence_items",{workspace_id:job.workspace_id,company_id:job.company_id,research_job_id:job.id,report_id:row.id,finding_key:ev.finding_key||ev.label||crypto.randomUUID(),label:ev.label||ev.finding_key||"Finding",value_json:ev.value??null,period:ev.period||null,evidence_class:ev.evidence_class||"UNKNOWN",confidence:ev.confidence||"INSUFFICIENT",notes:ev.notes||null,conflict_status:ev.conflict_status||"NONE",source_keys:Array.isArray(ev.source_keys)?ev.source_keys:[]},false);
    await persistFinancials(job,row,report);
  }
  await stageMany(job.id,[24],"COMPLETE",{report_id:row?.id,version_no:version});await update("research_jobs",`id=eq.${job.id}`,{status:"COMPLETE",completed_at:new Date().toISOString(),source_count:uniq.length,evidence_coverage:cov.overall,report_id:row?.id||null},false);
  try{await insert("activity_logs",{workspace_id:job.workspace_id,action:"research_completed",company_id:job.company_id,research_job_id:job.id,metadata:{report_id:row?.id||null,version_no:version,source_count:uniq.length,evidence_coverage:cov.overall,provider:route.provider,model:route.model}},false)}catch{}
}

export async function exportReport(report:any,type:string){
  const r=report.report_json||{},company=r.identity?.legal_name||report.company?.legal_name||"Company",evidence=report.evidence_rows||r.evidence||[],sources=report.source_rows||[];
  const periods=Array.isArray(r.financials?.periods)?r.financials.periods:[];
  const last=periods.at(-1)||{};
  const pick=(obj:any,keys:string[])=>{for(const k of keys)if(obj?.[k]!=null&&obj[k]!=="")return obj[k];return"UNKNOWN"};
  const val=(v:any)=>v==null||v===""?"UNKNOWN":typeof v==="object"?Array.isArray(v)?v.map((x:any)=>typeof x==="object"?(x.name||x.material||x.finding||JSON.stringify(x)):x).join(", "):JSON.stringify(v):String(v);
  const keyFinancials=[
    ["Revenue",pick(last,["revenue","turnover","sales"])],["EBITDA",pick(last,["ebitda"])],["PAT",pick(last,["pat","net_profit","profit_after_tax"])],
    ["Operating Cash Flow",pick(last,["operating_cash_flow","ocf","cash_from_operations"])],["Net Worth",pick(last,["net_worth","networth"])],["Debt",r.debt?.summary||pick(last,["debt","total_debt","borrowings"])]
  ];
  const mainConcern=(r.risks||[])[0]?.finding||(r.information_gaps||[])[0]?.item||(r.information_gaps||[])[0]?.label||(r.information_gaps||[])[0]||"UNKNOWN";
  const credit=(evidence.find((x:any)=>x.finding_key==="risk.credit_safety")?.value_json)||"CREDIT SAFETY NOT SUFFICIENTLY VERIFIED";
  const opportunity=(r.opportunities||[])[0]?.finding||(r.opportunities||[])[0]?.opportunity||(r.procurement||[])[0]?.material||"UNKNOWN";
  const sections:any[]=[
    ["Identity",r.identity],["Directors & Ownership",{directors:r.directors,ownership:r.ownership}],["Business",r.business],["Operations",r.operations],
    ["Financials",r.financials],["Debt & Charges",{debt:r.debt,charges:r.charges}],["Credit Ratings",r.credit_ratings],["Legal & Insolvency",{legal:r.legal,insolvency:r.insolvency}],
    ["Trade",{trade:r.trade,buyers:r.buyers,suppliers:r.suppliers}],["Competitors",r.competitors],["Procurement",r.procurement],["Commercial Opportunity",r.opportunities],
    ["Risks",r.risks],["Information Gaps",r.information_gaps],["Management Takeaways",r.management_takeaways]
  ];
  const flatten=(x:any,prefix=""):{key:string,value:string}[]=>{
    if(x==null)return[{key:prefix||"Value",value:"UNKNOWN"}];
    if(Array.isArray(x))return x.flatMap((v,i)=>flatten(v,`${prefix}${prefix?" ":""}#${i+1}`));
    if(typeof x!=="object")return[{key:prefix||"Value",value:String(x)}];
    return Object.entries(x).flatMap(([k,v])=>typeof v==="object"&&v!==null?flatten(v,prefix?`${prefix} · ${k.replace(/_/g," ")}`:k.replace(/_/g," ")):[{key:prefix?`${prefix} · ${k.replace(/_/g," ")}`:k.replace(/_/g," "),value:val(v)}]);
  };

  if(type==="pdf"){
    const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
    const W=595.28,H=841.89,margin=42;
    let page=pdf.addPage([W,H]),y=H-44;
    const newPage=()=>{page=pdf.addPage([W,H]);y=H-44};
    const text=(t:string,size=9,b=false,x=margin)=>{const F=b?bold:font;for(const raw of String(t||"").split("\n")){const words=raw.split(/\s+/),max=W-margin-x;let line="";for(const w of words){const test=line?line+" "+w:w;if(F.widthOfTextAtSize(test,size)>max&&line){page.drawText(line,{x,y,size,font:F,color:rgb(.09,.12,.18)});y-=size+4;line=w}else line=test}if(line){page.drawText(line,{x,y,size,font:F,color:rgb(.09,.12,.18)});y-=size+4}if(y<58)newPage()}};
    const rule=()=>{page.drawLine({start:{x:margin,y},end:{x:W-margin,y},thickness:.6,color:rgb(.82,.79,.74)});y-=10};
    text("VMG COMPANY INTELLIGENCE",9,true);text(company,21,true);text(`Research date: ${String(report.created_at||"").slice(0,10)}   •   Evidence coverage: ${report.evidence_coverage??"N/A"}%   •   Sources: ${report.source_count??sources.length}`,9);y-=7;rule();
    text("KEY FINANCIALS",10,true);for(const [k,v] of keyFinancials){text(`${k}: ${val(v)}`,10,k==="Revenue"||k==="Debt")}y-=4;
    text("CREDIT / PAYMENT SAFETY",10,true);text(val(credit),10);y-=4;text("MAIN CONCERN",10,true);text(val(mainConcern),10);y-=4;text("MAIN COMMERCIAL OPPORTUNITY",10,true);text(val(opportunity),10);
    if(periods.length>=2){
      newPage();text("FINANCIAL TRENDS",15,true);text("Charts use only numeric values present in the structured report. Missing values are not fabricated.",8);y-=10;
      const drawChart=(title:string,keys:string[])=>{const vals=periods.map((p:any,i:number)=>({label:p.period||p.fy||p.year||String(i+1),value:Number(pick(p,keys))})).filter((x:any)=>Number.isFinite(x.value));text(title,10,true);if(vals.length<2){text("Insufficient Verified Data",9);y-=14;return}const cw=480,ch=110,cx=margin,cy=y-ch;const min=Math.min(...vals.map((x:any)=>x.value)),max=Math.max(...vals.map((x:any)=>x.value)),span=max-min||1;const pts=vals.map((x:any,i:number)=>({x:cx+i*(cw/(vals.length-1)),y:cy+15+(x.value-min)/span*(ch-30)}));for(let i=1;i<pts.length;i++)page.drawLine({start:pts[i-1],end:pts[i],thickness:1.7,color:rgb(.19,.37,.62)});for(const p of pts)page.drawCircle({x:p.x,y:p.y,size:2.4,color:rgb(.19,.37,.62)});for(let i=0;i<vals.length;i++)page.drawText(String(vals[i].label),{x:pts[i].x-8,y:cy,size:7,font,color:rgb(.45,.49,.55)});y=cy-18;if(y<170)newPage()};
      drawChart("Revenue Trend",["revenue","turnover","sales"]);drawChart("Profit Trend",["pat","net_profit","profit_after_tax"]);drawChart("Operating Cash Flow",["operating_cash_flow","ocf","cash_from_operations"]);
    }
    for(const [title,data] of sections){newPage();text(String(title).toUpperCase(),14,true);rule();for(const row of flatten(data).slice(0,80)){text(row.key,8,true);text(row.value,9);y-=2}}
    newPage();text("SOURCE / EVIDENCE REGISTER",14,true);rule();for(const ev of evidence.slice(0,100)){text(`${ev.label||ev.finding_key||"Finding"} [${ev.evidence_class||"UNKNOWN"} | ${ev.confidence||"INSUFFICIENT"}]`,8,true);text(`${val(ev.value_json??ev.value)}${ev.period?" • "+ev.period:""}`,8)}if(sources.length){y-=7;text("SOURCES",10,true);for(const src of sources.slice(0,100)){text(src.title||src.url,8,true);text(`${src.publisher||""} ${src.url||""}`,7)}}
    return{bytes:await pdf.save(),mime:"application/pdf",ext:"pdf"};
  }

  if(type==="docx"){
    const children:any[]=[
      new Paragraph({text:"VMG Company Intelligence",heading:HeadingLevel.TITLE}),
      new Paragraph({text:company,heading:HeadingLevel.HEADING_1}),
      new Paragraph({text:`Research date: ${String(report.created_at||"").slice(0,10)} | Evidence coverage: ${report.evidence_coverage??"N/A"}% | Sources: ${report.source_count??sources.length}`}),
      new Paragraph({text:"Executive Summary",heading:HeadingLevel.HEADING_1}),
      ...keyFinancials.map(([k,v])=>new Paragraph({text:`${k}: ${val(v)}`})),
      new Paragraph({text:"Credit / Payment Safety",heading:HeadingLevel.HEADING_2}),new Paragraph({text:val(credit)}),
      new Paragraph({text:"Main Concern",heading:HeadingLevel.HEADING_2}),new Paragraph({text:val(mainConcern)}),
      new Paragraph({text:"Main Commercial Opportunity",heading:HeadingLevel.HEADING_2}),new Paragraph({text:val(opportunity)})
    ];
    for(const [title,data] of sections){children.push(new Paragraph({text:String(title),heading:HeadingLevel.HEADING_1}));for(const row of flatten(data).slice(0,120))children.push(new Paragraph({text:`${row.key}: ${row.value}`}))}
    children.push(new Paragraph({text:"Evidence Register",heading:HeadingLevel.HEADING_1}));for(const ev of evidence.slice(0,150))children.push(new Paragraph({text:`${ev.label||ev.finding_key||"Finding"} | ${ev.evidence_class||"UNKNOWN"} | ${ev.confidence||"INSUFFICIENT"} | ${val(ev.value_json??ev.value)}`}));
    children.push(new Paragraph({text:"Sources",heading:HeadingLevel.HEADING_1}));for(const src of sources.slice(0,150))children.push(new Paragraph({text:`${src.title||src.url} — ${src.url||""}`}));
    return{bytes:await Packer.toBuffer(new Document({sections:[{children}]})),mime:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",ext:"docx"};
  }

  if(type==="xlsx"){
    const wb=XLSX.utils.book_new();
    const add=(name:string,rows:any[])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?rows:[{Status:"No verified data"}]),name.slice(0,31));
    const arr=(v:any)=>Array.isArray(v)?v:(v==null?[]:[v]);const objRows=(v:any)=>arr(v).map((x:any)=>typeof x==="object"?x:{value:x});
    add("Executive Summary",[{Company:company,ResearchDate:report.created_at,EvidenceCoverage:report.evidence_coverage,SourceCount:report.source_count,CreditSafety:val(credit),MainConcern:val(mainConcern),MainOpportunity:val(opportunity)}]);
    add("Identity",objRows(r.identity));add("Directors",objRows(r.directors));add("Ownership",objRows(r.ownership));add("Financials",objRows(periods));add("Ratios",objRows(r.financials?.ratios));add("Debt & Charges",[...objRows(r.debt?.borrowings),...objRows(r.charges)]);add("Credit Ratings",objRows(r.credit_ratings));add("Legal",[...objRows(r.legal),...objRows(r.insolvency)]);add("Trade",[...objRows(r.trade?.imports),...objRows(r.trade?.exports)]);add("Buyers",objRows(r.buyers));add("Suppliers",objRows(r.suppliers));add("Competitors",objRows(r.competitors));add("Procurement",objRows(r.procurement));add("Evidence",objRows(evidence));add("Sources",objRows(sources));
    return{bytes:XLSX.write(wb,{type:"buffer",bookType:"xlsx"}),mime:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",ext:"xlsx"};
  }
  throw new Error("type must be pdf, docx or xlsx");
}
