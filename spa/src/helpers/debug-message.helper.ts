import { environment } from './environment.helper';

/** Conditionally logs the given message if the app is running in development */
export function debugMsg(...args: any[]): void {
  if (environment.development) console.log(...args);
}
