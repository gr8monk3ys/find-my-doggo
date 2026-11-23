// Layering: src/app -> src/components -> src/lib, never the other way round.
// The deep-module entry-point rules from setup-ts-deep-modules need a
// src/packages/<name>/ layout, which this app does not use yet.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'No dependency cycles. Extract the shared piece into its own module.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'lib-is-a-leaf',
      comment: 'src/lib holds framework-free logic. It must not import UI (src/components) or routes (src/app).',
      severity: 'error',
      from: { path: '^src/lib/' },
      to: { path: '^src/(components|app)/' },
    },
    {
      name: 'components-do-not-import-routes',
      comment: 'Components are reusable by routes, not the reverse. Move shared code into src/lib or src/components.',
      severity: 'error',
      from: { path: '^src/components/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'src-does-not-import-tests',
      comment: 'Production code must not import from tests/.',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^tests/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      mainFields: ['module', 'main', 'types'],
    },
  },
};
