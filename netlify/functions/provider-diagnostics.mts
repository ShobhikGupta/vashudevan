export type ProviderFailureClass="AUTH_ERROR"|"INVALID_REQUEST"|"RATE_LIMIT"|"PROVIDER_ERROR"|"TRANSIENT_ERROR";

function hex(bytes:ArrayBuffer){
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
export async function credentialDiagnostics(secret:string){
  const raw=String(secret??""),bytes=new TextEncoder().encode(raw);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return {
    char_length:raw.length,
    byte_length:bytes.byteLength,
    fingerprint_prefix:hex(digest).slice(0,16),
    trimmed_equivalent:raw===raw.trim(),
    has_control_whitespace:/[\r\n\t]/.test(raw)
  };
}
export function compareCredentialDiagnostics(a:any,b:any){
  return {
    exact_length_match:a?.char_length===b?.char_length,
    exact_byte_length_match:a?.byte_length===b?.byte_length,
    fingerprint_match:Boolean(a?.fingerprint_prefix)&&a?.fingerprint_prefix===b?.fingerprint_prefix,
    both_trimmed_equivalent:a?.trimmed_equivalent===true&&b?.trimmed_equivalent===true,
    no_control_whitespace:a?.has_control_whitespace===false&&b?.has_control_whitespace===false
  };
}
export function redactProviderText(value:any){
  let s=String(value??"").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim();
  s=s.replace(/AIza[0-9A-Za-z_-]{15,}/g,"[REDACTED_API_KEY]")
     .replace(/AQ\.[0-9A-Za-z._-]{15,}/g,"[REDACTED_AUTH_KEY]")
     .replace(/sk-[0-9A-Za-z_-]{12,}/g,"[REDACTED_KEY]")
     .replace(/tvly-[0-9A-Za-z_-]{8,}/g,"[REDACTED_KEY]");
  return s.slice(0,700);
}
function providerReason(body:any){
  const details=Array.isArray(body?.error?.details)?body.error.details:[];
  for(const d of details){
    const reason=d?.reason||d?.metadata?.reason||d?.errorInfo?.reason;
    if(reason)return redactProviderText(reason);
  }
  return "";
}
export function providerErrorDetails(provider:string,httpStatus:number,body:any){
  const providerCode=redactProviderText(body?.error?.status||body?.error?.code||body?.code||"");
  const reason=providerReason(body);
  const message=redactProviderText(body?.error?.message||body?.detail||body?.message||"Provider request failed.");
  const hay=(providerCode+" "+reason+" "+message).toUpperCase();
  let classification:ProviderFailureClass;
  if(httpStatus===429||hay.includes("RESOURCE_EXHAUSTED")||hay.includes("RATE_LIMIT"))classification="RATE_LIMIT";
  else if(httpStatus>=500)classification="TRANSIENT_ERROR";
  else if(httpStatus===401||httpStatus===403||hay.includes("API_KEY_INVALID")||hay.includes("API KEY NOT VALID")||hay.includes("UNAUTHENTICATED")||hay.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED"))classification="AUTH_ERROR";
  else if(httpStatus===400||hay.includes("INVALID_ARGUMENT")||hay.includes("INVALID_REQUEST"))classification="INVALID_REQUEST";
  else classification="PROVIDER_ERROR";
  return {provider,http_status:httpStatus,provider_code:providerCode||null,provider_reason:reason||null,message_safe:message,classification};
}
export class ProviderCallError extends Error{
  details:any;
  constructor(details:any){
    super(`${details.provider} request failed (${details.http_status}): ${details.message_safe}`);
    this.name="ProviderCallError";
    this.details=details;
  }
}
export function errorHttpStatus(classification:ProviderFailureClass){
  if(classification==="RATE_LIMIT")return 429;
  if(classification==="TRANSIENT_ERROR")return 503;
  if(classification==="AUTH_ERROR")return 401;
  if(classification==="INVALID_REQUEST")return 400;
  return 502;
}
