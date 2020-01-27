import React from 'react';
import 'ace-builds';
import 'ace-builds/webpack-resolver';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-xml';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-yaml';

import 'ace-builds/src-noconflict/theme-tomorrow';

export type ValidityFunc = (value: string) => undefined | string;

interface EditorProps {
  mode?: string;
  height?: string;
  value: string;
  setValue?: (arg: string) => void;
  valIsValidFunc?: ValidityFunc;
  readOnly?: boolean;
  maxLines?: number;
}

const Editor = ({ value, setValue, mode, height, valIsValidFunc, readOnly, maxLines }: EditorProps) => {
  const warning = valIsValidFunc ? valIsValidFunc(value) : undefined;
  return (
    <div style={{ border: '1px solid lightgrey' }}>
      <AceEditor
        fontSize={14}
        mode={mode || 'text'}
        theme="tomorrow"
        editorProps={{ $blockScrolling: true }}
        width="100%"
        height={height || '100px'}
        value={value}
        onChange={setValue}
        readOnly={readOnly ?? false}
        maxLines={maxLines}
        // setOptions={{ useWorker: false }}
      />
      {typeof warning === 'string' && (
        <div className="alert alert-warning" role="alert">
          {warning}
        </div>
      )}
    </div>
  );
};

export default Editor;
