type RuntimeEnvironment = typeof globalThis & {
  __env?: {
    apiUrl?: string;
    PORTFOLIO_TRACKER_API_URL?: string;
    supabaseUrl?: string;
    supabasePublishableKey?: string;
    PORTFOLIO_TRACKER_SUPABASE_URL?: string;
    PORTFOLIO_TRACKER_SUPABASE_PUBLISHABLE_KEY?: string;
  };
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const runtimeEnvironment = globalThis as RuntimeEnvironment;

export const environment = {
  apiUrl:
    runtimeEnvironment.__env?.apiUrl ??
    runtimeEnvironment.__env?.PORTFOLIO_TRACKER_API_URL ??
    runtimeEnvironment.process?.env?.['PORTFOLIO_TRACKER_API_URL'] ??
    'http://localhost:5011',
  supabaseUrl:
    runtimeEnvironment.__env?.supabaseUrl ??
    runtimeEnvironment.__env?.PORTFOLIO_TRACKER_SUPABASE_URL ??
    runtimeEnvironment.process?.env?.['PORTFOLIO_TRACKER_SUPABASE_URL'] ??
    'https://fofxhsskfehnylunwqyh.supabase.co/',
  supabasePublishableKey:
    runtimeEnvironment.__env?.supabasePublishableKey ??
    runtimeEnvironment.__env?.PORTFOLIO_TRACKER_SUPABASE_PUBLISHABLE_KEY ??
    runtimeEnvironment.process?.env?.['PORTFOLIO_TRACKER_SUPABASE_PUBLISHABLE_KEY'] ??
    'sb_publishable_7sWtMmW5TUFuUCaP3xZ8Wg_CVj2F_XY',
};
