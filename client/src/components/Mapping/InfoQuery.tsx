import React from 'react';
import AceEditor from 'react-ace';
import {
  Button,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'reactstrap';

interface IProps {
  isOpen: boolean;
  toggleModal(): void;
}

// tslint:disable-next-line
const InfoQueryModal = ({ toggleModal, isOpen }: IProps) => (
  <div>
    <Modal isOpen={isOpen} toggle={toggleModal} size="lg">
      <ModalHeader toggle={toggleModal}>Query Parameter Info</ModalHeader>
      <ModalBody>
        Add your query parameters as a json structure. Use only strings as
        values, otherwise a warning message will appear. The object will then be
        mapped to some url string.
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
            <Label for="baseUrl-info">Base URL</Label>
            <Input
              value={'http://example.com/api'}
              id="baseUrl-info"
              readOnly={true}
            />
          </FormGroup>
          <FormGroup>
            <Label for="editor-query-info">URL Query Parameter</Label>
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
            />
          </FormGroup>
        </div>
        <br />
        Will be mapped to: <br />
        <b>{'http://example.com/api?location=Innsbruck&people=20'}</b>
        <br />
        <br />
        All values will be mapped to encode URI special characters, thus e.g.{' '}
        <b>Österreich</b> will become <b>%C3%96sterreic</b>
        <br />
        <br />
        Try out your mapping in the Tryout section.
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggleModal}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  </div>
);

export default InfoQueryModal;
