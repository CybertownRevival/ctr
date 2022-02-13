/** Helper for exposing environment variables to the rest of the app */
export const environment = {
  development: process.env.NODE_ENV === 'development',
  packageVersion: process.env.PACKAGE_VERSION,
} as const;
