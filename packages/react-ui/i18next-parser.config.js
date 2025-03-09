module.exports = {
  locales: ['en'], // Your supported languages
  output: 'packages/react-ui/public/locales/$LOCALE/$NAMESPACE.json', // Where to output the JSON files
  input: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/features/plans/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui-components/src/**/*.{js,jsx,ts,tsx}',
  ], // Where to find your React files
  defaultNamespace: 'translation', // Default namespace if not specified
  createOldCatalogs: false, // Don’t maintain the existing structure with old keys
  lexers: {
    js: ['JavascriptLexer'],
    jsx: ['JavascriptLexer'],
    ts: ['JavascriptLexer'],
    tsx: ['JavascriptLexer'],
  },
  keepRemoved: false,
  keySeparator: false, // Disable key separator
  nsSeparator: false, // Disable namespace separator
  /* Begining of config for supporting colons in keys */
  contextSeparator: '___',
  namespaceSeparator: '___',
  allowDynamicKeys: true,
  /* End of config for supporting colons in keys */
};
