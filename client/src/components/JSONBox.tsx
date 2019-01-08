import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'reactstrap';
import { toast, ToastContainer } from 'react-toastify';

import { copyStrIntoClipBoard, syntaxHighlightJsonStr } from '../helpers/html';

const copy = (o: object) => {
  copyStrIntoClipBoard(JSON.stringify(o, null, 2));
  toast.success('Copied to clipboard');
};

const JSONBox = ({
  object,
  withCopy,
}: {
  object: object;
  withCopy?: boolean;
}) => (
  <>
    <pre
      dangerouslySetInnerHTML={{
        __html: syntaxHighlightJsonStr(JSON.stringify(object, null, 2)),
      }}
      className="annotation-box"
    />
    {withCopy && (
      <>
        <Button
          color="secondary"
          style={{
            float: 'right',
            position: 'relative',
            bottom: '60px',
            right: '5px',
          }}
          outline={true}
          onClick={() => copy(object)}
        >
          {' '}
          <FontAwesomeIcon icon="copy" size="lg" color="grey" /> Copy
        </Button>
        <ToastContainer hideProgressBar={true} autoClose={3000} />
      </>
    )}
  </>
);

export default JSONBox;
