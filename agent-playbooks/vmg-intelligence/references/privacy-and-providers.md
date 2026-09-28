# Privacy and Provider Rules

## Provider strategy
Primary: Gemini, currently coded as `gemini-2.5-flash`.  
Primary search: Google Search grounding.  
Optional fallback: Tavily.  
Optional paid provider: OpenAI.

V1 free-first must work without Tavily/OpenAI. Paid provider use requires explicit settings/authorization and must respect cost protection.

Use the current Google AI Studio authorization/auth credential mechanism supported by the provider. Verify the credential server-side and require a grounding-bearing test response before declaring Google Search available.

Credentials are stored server-side in Supabase Vault after successful verification. Browser responses expose status/metadata only, never decrypted credentials.

## Documents
Workspace defaults currently allow public-document AI and disallow private-document AI. File-level permission is also required. Both gates must pass before extracted private text enters external-provider context.

Local parsing is not the same as external AI processing. Parsing can proceed while external AI remains blocked.
