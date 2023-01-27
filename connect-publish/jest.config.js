module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'node',

  // NOTE: setting an empty transformIgnorePatterns is intentional
  // so that typescript and otherwise un-transpiled dependencies
  // are correctly transformed. {
  transformIgnorePatterns: []
  // }
}
