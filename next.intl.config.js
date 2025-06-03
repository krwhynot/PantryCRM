module.exports = {
  locales: ['en'],
  defaultLocale: 'en',
  timeZone: 'America/Chicago', // Central Time for Kitchen Pantry CRM
  now: new Date(),
  formats: {
    dateTime: {
      short: {
        day: 'numeric',
        month: 'short', 
        year: 'numeric'
      },
      medium: {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    number: {
      currency: {
        style: 'currency',
        currency: 'USD'
      }
    }
  }
}