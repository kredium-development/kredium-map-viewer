declare module "app-env" {
  interface ENV {
    VITE_SUPABASE_ANON_KEY: string;
    VITE_SUPABASE_URL: string;
  }

  const appEnv: ENV;
  export default appEnv;
}
