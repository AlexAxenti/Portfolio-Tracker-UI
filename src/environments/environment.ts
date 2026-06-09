type RuntimeEnvironment = typeof globalThis & {
  __env?: {
    apiUrl?: string;
    PORTFOLIO_TRACKER_API_URL?: string;
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
};
