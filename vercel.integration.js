const { createIntegration } = require('@vercel/integration-utils');

const integration = createIntegration({});

integration.withScheduling(async (job, context) => {
  if (job.name === 'resetGenerations') {
    try {
      const res = await context.fetch('/api/resetGenerations');
      console.log('Reset generations response:', res.status, await res.text());
    } catch (error) {
      console.error('Error resetting generations:', error);
    }
  }
});

module.exports = integration.middleware;
