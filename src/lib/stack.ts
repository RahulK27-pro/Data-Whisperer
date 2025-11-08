import { StackClientApp } from '@stackframe/react';

const projectId = import.meta.env.VITE_STACK_PROJECT_ID;
const publishableKey = import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;

if (!projectId || !publishableKey) {
  throw new Error('Missing Stack project ID or publishable key');
}

export const stack = new StackClientApp({
  projectId,
  publishableClientKey: publishableKey,
  tokenStore: 'cookie',
});
