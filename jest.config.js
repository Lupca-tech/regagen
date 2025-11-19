export default {
  // Use 'node' for server-side testing
  testEnvironment: 'node',
  // Transform JavaScript files using Babel
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  // This maps imports like `import x from './file.js'` to just `import x from './file'`
  // which can sometimes help with module resolution issues in ESM test environments.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Set up module file extensions
  moduleFileExtensions: ['js', 'json', 'node'],
  // Collect coverage from files in src
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js" // Exclude test files themselves
  ],
  // Coverage reports output directory
  coverageDirectory: "coverage",
};
