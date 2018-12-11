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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface IState {
  modalOpen: boolean;
}

class InfoQuery extends React.Component<{}, IState> {
  public state: IState = {
    modalOpen: false,
  };

  public toggleModal = () => {
    this.setState((state) => ({
      modalOpen: !state.modalOpen,
    }));
  };

  public render() {
    return (
      <>
        <span className="cursor-hand" onClick={this.toggleModal}>
          <FontAwesomeIcon
            className="cursor-hand"
            icon="info-circle"
            size="sm"
            color="lightblue"
          />
        </span>
        <Modal
          isOpen={this.state.modalOpen}
          toggle={this.toggleModal}
          size="lg"
        >
          <ModalHeader toggle={this.toggleModal}>
            Query Parameter Info
          </ModalHeader>
          <ModalBody>
            Add your query parameters as a json structure. Use only strings as
            values, otherwise a warning message will appear. The object will
            then be mapped to some url string.
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
            All values will be mapped to encode URI special characters, thus
            e.g. <br />
            <b>Österreich</b> <br />
            will become
            <br />
            <b>%C3%96sterreic</b>
            <br />
            <br />
            Try out your mapping in the Tryout section.
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={this.toggleModal}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default InfoQuery;
