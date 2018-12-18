import React from 'react';
import AceEditor from 'react-ace';
import { FormGroup, Input, Label } from 'reactstrap';
import InfoBtnModal from './InfoBtnModal';

/* tslint:disable-next-line:variable-name */
const InfoPath = () => (
  <InfoBtnModal title="Info URL Path">
    Add your the path of your url using an Array of strings.
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
        <Label for="baseUrl-info">Base URL:</Label>
        <Input
          value={'http://example.com/api'}
          id="baseUrl-info"
          disabled={true}
          style={{ backgroundColor: 'white' }}
        />
      </FormGroup>
      <FormGroup>
        <Label for="editor-query-info">URL Path:</Label>
        <AceEditor
          name="editor-query-info"
          mode="json"
          theme="tomorrow"
          fontSize={14}
          height="30px"
          readOnly={true}
          highlightActiveLine={false}
          editorProps={{ $blockScrolling: true }}
          value={'["users", "info"]'}
          style={{ border: '1px solid lightgrey' }}
        />
      </FormGroup>
    </div>
    <br />
    Will be mapped to: <br />
    <b>{'http://example.com/api/users/info'}</b>
    <br />
    <br />
    All values will be mapped to encode URI special characters using the
    JavaScript <i>encodeURIComponent</i> function, thus e.g. <br />
    <b>Österreich, Tirol</b> <br />
    will become
    <br />
    <b>%C3%96sterreich%2C%20Tirol</b>
    <br />
    <br />
    Try out your mapping in the Tryout section.
  </InfoBtnModal>
);

export default InfoPath;
