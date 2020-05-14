import React, { useEffect, PropsWithChildren } from 'react';

import split from 'split.js';

import Editor from './Editor';

interface Props {
  isOpen: boolean;
  value: string | (() => string);
}

const WithCodeSplit = ({ isOpen, value, children }: PropsWithChildren<Props>) => {
  useEffect(() => {
    if (isOpen) {
      split([`#split1`, `#split2`], { sizes: [60, 40], minSize: [100, 100] });
    }
  }, [isOpen]);

  return (
    <>
      {isOpen ? (
        <div className="d-flex">
          <div className="split" id="split1">
            {children}
          </div>
          <div className="split" id="split2">
            <Editor
              mode="json"
              readOnly={true}
              height="100%"
              maxLines={Infinity}
              value={typeof value === 'string' ? value : value()}
            />
          </div>
        </div>
      ) : (
        children
      )}
    </>
  );
};

export default WithCodeSplit;
