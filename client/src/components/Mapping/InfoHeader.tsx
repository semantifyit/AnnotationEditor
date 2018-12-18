import React from 'react';
import AceEditor from 'react-ace';
import { FormGroup, Input, Label } from 'reactstrap';
import InfoBtnModal from './InfoBtnModal';

const editorValue = `{
    "Content-Type": "application/json",
    "Authorization": "token abcd"
}`;

/* tslint:disable-next-line:variable-name */
const InfoHeader = () => (
  <InfoBtnModal title="Info Header Properties">
    Add your Header properties as JSON key-value pairs. You can use Ctrl+Space
    to get a list of common request headers.
    <br />
    <br />
    For example:
    <br />
    <div
      style={{
        border: '1px solid lightgrey',
        borderRadius: '5px',
        padding: '10px',
      }}
    >
      <FormGroup>
        <Label for="editor-query-info">URL Query Parameter:</Label>
        <AceEditor
          name="editor-query-info"
          mode="json"
          theme="tomorrow"
          fontSize={14}
          maxLines={4}
          readOnly={true}
          highlightActiveLine={false}
          editorProps={{ $blockScrolling: true }}
          value={editorValue}
          style={{ border: '1px solid lightgrey' }}
        />
      </FormGroup>
    </div>
    <br />
    Will result in the following raw headers: <br />
    <pre style={{ margin: 0 }}>
      {'Content-Type: application/json\nAuthorization: token abcd'}
    </pre>
  </InfoBtnModal>
);

export default InfoHeader;
