/// <reference types="vite/client" />


declare namespace NodeJS {
    interface ProcessEnv {
      readonly BASE_API_KEYS: string;
      readonly BAS_AUTH_DOMAIN: string;
      readonly BASE_PROJECT_ID: string;
      readonly BASE_STORAGE_BUCKET: string;
      readonly BASE_MESSAGING_SENDER_ID: string;
      readonly BASE_APP_ID: string;
      readonly BE_URL: string;
    }
  }
  
