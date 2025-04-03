module.exports = {
preset: 'jest-expo',
testMatch: ['**/tests/**/*.test.js?(x)', '**/__tests__/**/*.test.js?(x)'],
moduleNameMapper: {
    '^@env$': '<rootDir>/tests/__mocks__/envMock.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/tests/__mocks__/@react-native-async-storage/async-storage.js',
    '^react-native-vector-icons/MaterialIcons$': '<rootDir>/tests/__mocks__/vectorIconsMock.js',
},
transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?|@unimodules|unimodules|sentry-expo|native-base|@react-navigation)',
],
};
  