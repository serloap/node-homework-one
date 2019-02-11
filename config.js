// Container for all the environments
const environments = {
    staging: {
        httpPort: 3000,
        httpsPort: 3001,
        envName: 'staging',
    },
    production: {
        httpPort: 5000,
        httpsPort: 5001,
        envName: 'production',
    },
};

// Determine which environment was passed as a command line argument
// NOTE: Do we need to check if it's string?... NO, they are strings if they are set.
const currentEnvironment = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environmet is defined above, if not, default to staging.
const environmentToExport = environments[currentEnvironment] || environments.staging;

// Export the module
module.exports = environmentToExport;
