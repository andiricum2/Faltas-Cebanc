const nextConfig = {
  // Use standalone output to keep API routes working inside Tauri
  output: "standalone",
  // Pin Turbopack root to this project
  turbopack: {
    root: __dirname,
  },
  // Do not copy local data directory into the standalone build output
  outputFileTracingExcludes: {
    "*": [".data/**"],
  },
  // Ensure the local grupos directory is bundled with the standalone server
  outputFileTracingIncludes: {
    "*": ["grupos/**"],
  },
};

export default nextConfig;
