import React from 'react';
import { syntaxHighlightJsonStr } from '../helpers/html';

/* tslint:disable-next-line:variable-name */
const JSONBox = ({ object }: { object: any }) => (
  <pre
    dangerouslySetInnerHTML={{
      __html: syntaxHighlightJsonStr(JSON.stringify(object, null, 2)),
    }}
    className="annotation-box"
  />
);

export default JSONBox;
