import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'refactor', 'docs', 'test',
      'chore', 'perf', 'ci', 'build', 'revert', 'style',
    ]],
    'scope-enum': [1, 'always', [
      'backend', 'frontend', 'protocol', 'contracts', 'core',
      'adapters', 'platform', 'api', 'realtime', 'worker',
      'infra', 'deps', 'config',
    ]],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 120],
    'body-max-line-length': [1, 'always', 200],
  },
};

export default config;
