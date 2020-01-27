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
    // eslint-disable-next-line  no-useless-escape
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match: any) => {
      let cls: colorType = 'number';
      // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
      if (/^"/.test(match)) {
        // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
        // eslint-disable-next-line @typescript-eslint/prefer-includes
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return `<span style="color: ${colorMatch[cls]}">${match}</span>`;
    },
  );
};

export const stripHtml = (html: string): string => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// adapted from https://gist.github.com/javilobo8/097c30a233786be52070986d8cdb1743
export const downloadContent = (data: any, filename: string) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  link.remove();
};
