import React from 'react';
import {
  Button,
  Card,
  CardBody,
  Col,
  Collapse,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import brace from 'brace';
import AceEditor from 'react-ace';
import 'brace/mode/javascript';

interface IProps {
  inputValues: string[];
  addValue(value: string): void;
}

interface IState {
  modalOpen: boolean;
  inputValue: string;
  showJSTransform: boolean;
  jsValue: string;
  useJSFunction: boolean;
}

class AddInput extends React.Component<IProps, IState> {
  public state: IState = {
    modalOpen: false,
    inputValue: '',
    showJSTransform: false,
    jsValue: 'function transform(input) {\n    return input;\n}',
    useJSFunction: false,
  };

  public toggleModal = () => {
    this.setState((state) => ({
      modalOpen: !state.modalOpen,
    }));
  };

  public changeInputValue = (e: any) => {
    this.setState({ inputValue: e.target.value });
  };

  public onChangeJS = (val: string, e: any) => {
    this.setState({ jsValue: val });
  };

  public render() {
    return (
      <>
        <Button color="primary" size="sm" onClick={this.toggleModal}>
          Add Input field
        </Button>
        <Modal
          isOpen={this.state.modalOpen}
          toggle={this.toggleModal}
          size="lg"
        >
          <ModalHeader toggle={this.toggleModal}>Add input field</ModalHeader>
          <ModalBody>
            Choose a value from the list of "-input" properties:
            <Input type="select" name="select" onChange={this.changeInputValue}>
              {this.props.inputValues.map((val, i) => (
                <option key={i}>{val}</option>
              ))}
            </Input>
            <hr />
            Transform the value with Javascript (advanced){' '}
            <span
              onClick={() =>
                this.setState((state) => ({
                  showJSTransform: !state.showJSTransform,
                  useJSFunction: !state.showJSTransform,
                }))
              }
            >
              <FontAwesomeIcon
                className="cursor-hand"
                icon={this.state.showJSTransform ? 'angle-up' : 'angle-down'}
                size="lg"
              />
            </span>
            <Collapse isOpen={this.state.showJSTransform}>
              <div
                style={{
                  padding: '10px',
                }}
              >
                Write a JavaScript function that will transform your input
                value:
                <div
                  style={{
                    border: '1px solid lightgrey',
                    resize: 'vertical',
                    height: '300px',
                    minHeight: '100px',
                    overflow: 'auto',
                    paddingBottom: '10px',
                    paddingTop: '15px',
                  }}
                >
                  <AceEditor
                    mode="javascript"
                    theme="tomorrow"
                    onChange={this.onChangeJS}
                    name="editor-js"
                    editorProps={{ $blockScrolling: Infinity }}
                    fontSize={14}
                    height="100px"
                    width="100%"
                    value={this.state.jsValue}
                  />
                </div>
              </div>
              <FormGroup check={true}>
                <Label check={true}>
                  <Input
                    type="checkbox"
                    checked={this.state.useJSFunction}
                    onChange={() =>
                      this.setState((state) => ({
                        useJSFunction: !state.useJSFunction,
                      }))
                    }
                  />{' '}
                  Use JavaScript function
                </Label>
              </FormGroup>
              <hr />
              <b>Test it!</b>
              <span
                style={{
                  color: 'grey',
                  fontStyle: 'italic',
                  fontSize: '0.8em',
                  paddingLeft: '15px',
                }}
              >
                (The JavaScript will run in your browser, don't do anything
                stupid :) )
              </span>
              <FormGroup row={true} style={{ padding: '10px 0' }}>
                <Label for="input-val" md={2} style={{ padding: 0 }}>
                  Input value:
                </Label>
                <Col md={8} style={{ padding: '0px 5px' }}>
                  <Input type="text" placeholder="value" id="input-val" />
                </Col>
                <Col md={2} style={{ padding: '0px 5px' }}>
                  <Button color="primary" style={{ width: '100%' }}>
                    Run JS
                  </Button>
                </Col>
              </FormGroup>
              <FormGroup>
                <Label for="baseUrl">Output:</Label>
                <Input
                  type="text"
                  readOnly={true}
                  style={{ backgroundColor: 'white' }}
                />
              </FormGroup>
            </Collapse>
          </ModalBody>
          <ModalFooter>
            <Button color="success" onClick={this.toggleModal}>
              Add
            </Button>
            <Button color="secondary" onClick={this.toggleModal}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default AddInput;
