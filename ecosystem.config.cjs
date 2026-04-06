module.exports = {
  apps: [
    {
      name: "polymarket-mcp",
      script: "dist/index.js",
      args: "--http",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      watch: false,
    },
  ],
};
