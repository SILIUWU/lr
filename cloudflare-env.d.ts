declare module "cloudflare:workers" {
  export const env: {
    [key: string]: unknown;
  };
}

interface Fetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}
