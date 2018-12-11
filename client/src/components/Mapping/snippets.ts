import brace from 'brace';

// https://stackoverflow.com/questions/51863210/manually-adding-snippets-to-react-ace-editor

const customSnippetText1 = '\
snippet kv\n\
\t"${1}": ""\n\
';

(brace as any).define(
  'ace/snippets/json',
  ['require', 'exports', 'module'],
  (f: any, t: any, n: any) => {
    t.snippetText = customSnippetText1;
    t.scope = 'json';
  },
);
