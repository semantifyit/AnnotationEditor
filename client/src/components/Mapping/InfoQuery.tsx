import React from 'react';
import AceEditor from 'react-ace';
import { FormGroup, Input, Label } from 'reactstrap';
import ButtonModal from './ButtonModal';

const InfoQuery = () => (
  <ButtonModal modalTitle="Info URL Query Parameter" triggerType="icon">
    Add your query parameters as a json structure. Use only strings as values,
    otherwise a warning message will appear. The object will then be mapped to
    some url string.
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
          value={'{\n\t"location": "Innsbruck",\n\t"people": "20"\n}'}
          style={{ border: '1px solid lightgrey' }}
        />
      </FormGroup>
    </div>
    <br />
    Will be mapped to: <br />
    <b>{'http://example.com/api?location=Innsbruck&people=20'}</b>
    <br />
    <br />
    Similar to the URL path, all values will be mapped to encode URI special
    characters (see Url Path hint)
  </ButtonModal>
);

export default InfoQuery;
