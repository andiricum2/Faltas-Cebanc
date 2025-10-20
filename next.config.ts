import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig = {
  // Use standalone output to keep API routes working inside Tauri
  output: "standalone" as const,
  // Pin Turbopack root to this project
  turbopack: {
    root: __dirname,
  },
  // Do not copy local data directory into the standalone build output
  outputFileTracingExcludes: {
    "*": [
      ".data/**"
    ],
  },
};

export default withNextIntl(nextConfig);
