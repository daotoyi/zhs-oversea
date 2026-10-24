module.exports = {
  apps: [
    {
      name: 'zhenhesheng',
      script: 'server.js',
      cwd: '/www/wwwroot/zhenhesheng.com',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        HOSTNAME: '127.0.0.1',
        NEXT_PUBLIC_SITE_URL: 'https://zhenhesheng.com',
      },
      max_memory_restart: '512M',
      autorestart: true,
      exp_backoff_restart_delay: 200,
      merge_logs: true,
      time: true,
    },
  ],
};
