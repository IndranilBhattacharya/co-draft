/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

declare module "@multiavatar/multiavatar/esm" {
  export default function multiavatar(seed: string): string;
}
