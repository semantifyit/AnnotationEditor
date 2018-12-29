import React from 'react';
import { syntaxHighlightJsonStr } from '../helpers/html';

const JSONBox = ({ object }: { object: object }) => (
  <pre
    dangerouslySetInnerHTML={{
      __html: syntaxHighlightJsonStr(JSON.stringify(object, null, 2)),
    }}
    className="annotation-box"
  />
);

export default JSONBox;
