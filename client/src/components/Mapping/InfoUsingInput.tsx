import React from 'react';
import AceEditor from 'react-ace';
import { FormGroup, Label } from 'reactstrap';
import ButtonModal from './ButtonModal';
import JSONBox from '../JSONBox';

const editorValue = JSON.stringify(
  {
    eventName: '$.result.name',
    categoryID: '123',
  },
  null,
  2,
);

const incomingAnnotation = {
  '@context': 'http://schema.org/',
  '@type': 'Action',
  name: 'Create an Event',
  object: {
    name: 'Best Event 2k19!',
  },
};

const apiCallPayload = {
  eventName: '$.result.name',
  categoryID: '123',
};

const InfoUsingInput = () => (
  <ButtonModal
    modalTitle="Using input Properties"
    triggerType="icon"
    btnSize="lg"
    btnColor="dodgerblue"
  >
    In this page you define the mapping between your schema.org Action and the
    API you wish to represent. In schema.org Actions data is only passed in the
    body. You can here define a mapping between that body and the url, the url
    path, the url query parameters, the headers, and the payload or body of your
    API.
    <br />
    In the editors you may enter the properties of the expected API call, see
    the info sections for each editor for more information.
    <br />
    The interesting part is using input fields from the schema.org Action. To
    denote some field in the editor as some incoming value we use a special
    notation, to denote some certain field in the Action:
    <br />
    <i>{'$.<dot_notation_to_path>'}</i>
    <br />
    For example:
    <br />
    <i>{'"eventCreatorName": "$.result.author.name"'}</i>
    <br />
    Would mean that the properties inside the schema.org Action with the path{' '}
    <i>result.author.name</i> would be inserted as a value of the API property
    of the API \"eventCreatorName\".
    <br />
    To facilitate the writing of mapping files you can use the Ctrl+Space
    shortcut to get a list of all defined -input properties of your schema.org
    Action.
    <br />
    You can as well use the \"Insert Input Field\" Button to add some input
    property at the current position of the editor, which lets you select some
    input property from the available -input fields via a select box.
    <br />
    <br />
    For example, with the following mapping in the editor:
    <br />
    <div
      style={{
        border: '1px solid lightgrey',
        borderRadius: '5px',
        padding: '10px',
      }}
    >
      <FormGroup>
        <Label for="editor-query-info">Payload:</Label>
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
    And the following incoming Schema.org Action: <br />
    <JSONBox object={incomingAnnotation} />
    <br />
    Will result in the following Payload/Body for the API call:
    <JSONBox object={apiCallPayload} />
  </ButtonModal>
);

export default InfoUsingInput;
