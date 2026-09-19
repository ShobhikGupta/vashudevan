export const PROVIDER_METADATA={
  gemini:{
    provider:"Google Gemini",model:"gemini-2.5-flash",display_model:"Gemini 2.5 Flash",role:"Primary AI / Research Engine",
    badge:"FREE FIRST",free_tier:true,
    description:"Gemini is the main AI brain for the free-first setup. It searches live web sources through Google Search grounding, analyses evidence and creates the structured company report.",
    pricing:{currency:"USD",input_per_million:0.30,output_per_million:2.50,free_input:true,free_output:true,grounding_free_rpd:500,paid_grounding_included_rpd:1500,grounding_overage_per_1000:35},
    reset_rule:"Gemini requests-per-day quotas reset at midnight Pacific time.",
    allowance:"Free-tier Google Search grounding: up to 500 grounded requests/day, shared with Gemini 2.5 Flash-Lite. Paid tier: 1,500 grounded requests/day included before overage pricing.",
    privacy:{free:"Google states free-tier content may be used to improve its products.",paid:"Google states paid-tier content is not used for that purpose."},
    official_reference:["https://ai.google.dev/gemini-api/docs/pricing","https://ai.google.dev/gemini-api/docs/rate-limits","https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash"],
    last_verified_date:"2026-09-19"
  },
  tavily:{
    provider:"Tavily",model:"Search + Extract",display_model:"Tavily Search + Extract",role:"Fallback / Independent Web Research",
    badge:"FREE TIER AVAILABLE",free_tier:true,
    description:"Tavily finds additional public web evidence when Gemini's search does not find enough reliable information.",
    pricing:{currency:"USD",free_credits_monthly:1000,payg_per_credit:0.008,project_credits:4000},
    reset_rule:"Monthly API credits reset on the first day of each month.",
    allowance:"Researcher plan includes 1,000 API credits/month with no card required. Request credit cost depends on endpoint and search depth.",
    official_reference:["https://www.tavily.com/pricing"],
    last_verified_date:"2026-09-19"
  },
  openai:{
    provider:"OpenAI",model:"gpt-5.6-luna",display_model:"GPT-5.6 Luna",role:"Optional premium AI / second research engine",
    badge:"OPTIONAL / PREMIUM",free_tier:false,
    description:"Optional second AI for difficult companies, independent analysis, web research and second-opinion synthesis.",
    models:[
      {id:"gpt-5.6-luna",name:"GPT-5.6 Luna",note:"Lowest-cost GPT-5.6 option",input_per_million:0.20,output_per_million:1.20},
      {id:"gpt-5.6-terra",name:"GPT-5.6 Terra",note:"Balanced cost and intelligence",input_per_million:2.00,output_per_million:12.00},
      {id:"gpt-5.6-sol",name:"GPT-5.6 Sol",note:"High-quality professional research",input_per_million:5.00,output_per_million:30.00}
    ],
    reset_rule:"Usage and rate limits depend on the OpenAI API usage tier.",
    allowance:"The official API model table shows no free API tier for GPT-5.6 Luna, Terra or Sol. Paid API usage must be explicitly enabled before VMG can use OpenAI automatically.",
    official_reference:["https://developers.openai.com/api/docs/models","https://developers.openai.com/api/docs/models/compare"],
    last_verified_date:"2026-09-19"
  }
} as const;

export function publicProviderMetadata(){return PROVIDER_METADATA}
