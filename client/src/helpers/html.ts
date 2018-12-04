export const copyStrIntoClipBoard = (str: string) => {
  const dummy = document.createElement('textarea');
  document.body.appendChild(dummy);
  dummy.setAttribute('id', 'dummy_id');
  dummy.value = str;
  dummy.select();
  document.execCommand('copy');
  document.body.removeChild(dummy);
};

type colorType = 'number' | 'key' | 'string' | 'boolean' | 'null';

export const syntaxHighlightJsonStr = (jsonStr: string) => {
  const colorMatch = {
    number: '#ba6702',
    key: '#d70000',
    string: '#000514',
    boolean: 'blue',
    null: 'magenta',
  };
  const json = jsonStr
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match: any) => {
      let cls: colorType = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return `<span style="color: ${colorMatch[cls]}">${match}</span>`;
    },
  );
};
