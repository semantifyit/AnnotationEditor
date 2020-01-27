import React from 'react';
import { FaCopy } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { copyStrIntoClipBoard, syntaxHighlightJsonStr } from '../util/html';

const copy = (o: object) => {
  copyStrIntoClipBoard(JSON.stringify(o, null, 2));
  toast.success('Copied to clipboard');
};

const JSONBox = ({ object, withCopy }: { object: object; withCopy?: boolean }) => (
  <>
    <pre
      dangerouslySetInnerHTML={{
        __html: syntaxHighlightJsonStr(JSON.stringify(object, null, 2)),
      }}
      className="annotation-box"
    />
    {withCopy && (
      <>
        <button
          className="btn btn-outline-secondary"
          style={{
            float: 'right',
            position: 'relative',
            bottom: '60px',
            right: '5px',
          }}
          onClick={() => copy(object)}
        >
          <FaCopy color="grey" /> Copy
        </button>
      </>
    )}
  </>
);

export default JSONBox;
