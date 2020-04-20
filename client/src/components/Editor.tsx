import React, { useState } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import 'ace-builds';
import 'ace-builds/webpack-resolver';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/mode-handlebars';

import 'ace-builds/src-noconflict/theme-tomorrow';
import classNames from 'classnames';

export type ValidityFunc = (value: string) => undefined | string;

interface EditorProps {
  mode?: string;
  height?: string;
  value: string;
  setValue?: (arg: string) => void;
  valIsValidFunc?: ValidityFunc;
  readOnly?: boolean;
  maxLines?: number;
  resizable?: boolean;
}

const Editor = ({
  value,
  setValue,
  mode,
  height: defaultHeight,
  valIsValidFunc,
  readOnly,
  maxLines,
  resizable,
}: EditorProps) => {
  const [height, setHeight] = useState<number>(Number(defaultHeight) || 100);
  const warning = valIsValidFunc ? valIsValidFunc(value) : undefined;

  const onResize = (w: number, h: number) => {
    if (h > 40) setHeight(h);
  };

  return (
    <div style={{ border: '1px solid lightgrey', minHeight: '30px' }} className={classNames({ resizable })}>
      {resizable && <ReactResizeDetector handleHeight={true} onResize={onResize} />}
      <AceEditor
        fontSize={14}
        mode={mode || 'text'}
        theme="tomorrow"
        editorProps={{ $blockScrolling: true }}
        width="100%"
        height={height.toString() + 'px'}
        value={value}
        onChange={setValue}
        readOnly={readOnly ?? false}
        maxLines={maxLines}
        setOptions={{ useWorker: mode !== 'xquery' }}

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
