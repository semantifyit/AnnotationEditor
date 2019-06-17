import brace from 'brace';

// https://stackoverflow.com/questions/51863210/manually-adding-snippets-to-react-ace-editor

// tslint:disable no-trailing-whitespace
const snippetText = `snippet ks
	"\${1:key}": "\${2:val}"
snippet ksn
	"\${1:key}": "\${2:val}",
	\${0}
snippet ko
	"\${1:key}": {
		\${0}
	}
snippet kon
	"\${1:key}": {
		\${0}
	},
snippet ka
	"\${1:key}": [\${0}]
snippet kan
	"\${1:key}": [\${0}],
`;

(brace as any).define(
  'ace/snippets/json',
  ['require', 'exports', 'module'],
  (f: any, t: any, n: any) => {
    t.snippetText = snippetText;
    t.scope = 'json';
  },
);
