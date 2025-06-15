// Custom commitlint rules for PantryCRM project
// Based on the workflow defined in /git-workflow
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce our specific types from git workflow
    'type-enum': [
      2,
      'always',
      ['fix', 'feat', 'refactor', 'docs', 'chore', 'work', 'wip', 'merge']
    ],
    'type-case': [2, 'always', 'lower'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [0, 'always'], // No limit for bullet points
    'footer-leading-blank': [2, 'always'],
    'footer-empty': [0, 'never'], // We require TODO references
  },
  // Custom parser to check for:
  // - Bullet points in body
  // - TODO reference in footer
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)(?:\(([\w$.\-*/ ]+)\))?: (.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
      issuePrefixes: ['TODO-'],
    }
  }
};
