// Fixed: Error "Cannot find type definition file for 'vite/client'"
// Added: Type definitions for process.env.API_KEY as required by the application.
declare const process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};
