/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  // Os testes de unidade não acessam o banco: o PrismaClient é substituído por um simulado
  moduleNameMapper: {
    '^@prisma/client$': '<rootDir>/tests/helpers/prismaMock.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/routes/**/*.ts', 'src/middleware/**/*.ts'],
};
