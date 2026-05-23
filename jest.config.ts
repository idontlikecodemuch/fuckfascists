import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/_quarantine/', '<rootDir>/.claude/'],
  moduleFileExtensions: ['ts', 'js'],
};

export default config;
