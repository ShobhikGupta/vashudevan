export const PROVIDER_METADATA={
  gemini:{
    provider:"Google Gemini",model:"gemini-3.8-flash",display_model:"Gemini 3.8 Flash",role:"Primary AI / Synthesis Engine",
    badge:"BEST FREE MODEL",free_tier:true,
    description:"Gemini 3.8 Flash is VMG's primary free-first reasoning and synthesis model. Google's standard Gemini 3.x API free tier does not include Google Search grounding, so zero-billing live web research uses Tavily's free tier unless Google grounding is separately available on the connected project.",
    pricing:{currency:"USD",input_per_million:0.75,output_per_million:3.75,free_input:true,free_output:true,grounding_free_tier:false,paid_grounding_included_monthly:5000,grounding_overage_per_1000:14},
    reset_rule:"Gemini free-tier model quotas follow the limits shown for the connected AI Studio project.",
    allowance:"Gemini 3.8 Flash input/output is available on the API free tier. Standard free-tier Google Search grounding is not available for Gemini 3.x; paid-tier projects include 5,000 Search requests/month shared across Gemini 3.x before overage pricing.",
    privacy:{free:"Google states free-tier content may be used to improve its products.",paid:"Google states paid-tier content is not used for that purpose."},
    official_reference:["https://ai.google.dev/gemini-api/docs/pricing","https://ai.google.dev/gemini-api/docs/google-search","https://ai.google.dev/gemini-api/docs/latest-model"],
    last_verified_date:"2026-09-28"
  },
  tavily:{
    provider:"Tavily",model:"Search + Extract",display_model:"Tavily Search + Extract",role:"Fallback / Independent Web Research",
    badge:"FREE TIER AVAILABLE",free_tier:true,
    description:"Tavily finds additional public web evidence when Gemini's search does not find enough reliable information.",
    pricing:{currency:"USD",free_credits_monthly:1000,payg_per_credit:0.008,project_credits:4000},
    reset_rule:"Monthly API credits reset on the first day of each month.",
    allowance:"Researcher plan includes 1,000 API credits/month with no card required. Request credit cost depends on endpoint and search depth.",
    official_reference:["https://www.tavily.com/pricing"],
    last_verified_date:"2026-09-28"
  },
  openai:{
    provider:"OpenAI",model:"gpt-5.6-luna",display_model:"GPT-5.6 Luna",role:"Optional premium AI / second research engine",
    badge:"OPTIONAL / PREMIUM",free_tier:false,
    description:"Optional second AI for difficult companies, independent analysis, web research and second-opinion synthesis.",
    models:[
      {id:"gpt-5.6-luna",name:"GPT-5.6 Luna",note:"Lowest-cost GPT-5.6 option",input_per_million:0.20,output_per_million:1.20},
      {id:"gpt-5.6-terra",name:"GPT-5.6 Terra",note:"Balanced cost and intelligence",input_per_million:2.00,output_per_million:12.00},
      {id:"gpt-5.6-sol",name:"GPT-5.6 Sol",note:"High-quality professional research",input_per_million:4.00,output_per_million:20.00},
      {id:"gpt-6-astra",name:"GPT-6 Astra",note:"Highest-capability option",input_per_million:10.00,output_per_million:50.00}
    ],
    reset_rule:"Usage and rate limits depend on the OpenAI API usage tier.",
    allowance:"OpenAI API model usage is paid for these models. Web search tool calls are also billed separately. Paid API usage must be explicitly enabled before VMG can use OpenAI automatically.",
    official_reference:["https://developers.openai.com/api/docs/models","https://developers.openai.com/api/docs/models/compare"],
    last_verified_date:"2026-09-19"
  }
} as const;

export function publicProviderMetadata(){return PROVIDER_METADATA}
