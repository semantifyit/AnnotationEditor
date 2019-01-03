import React from 'react';
import {
  Button,
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

import { RunJavaScriptFunction } from './runJavaScript';

interface IProps {
  io: 'input' | 'output';
  ioValues: string[];
  addValue(value: string): void;
}

interface IState {
  modalOpen: boolean;
  selectedIOValue: string;
  showJSTransform: boolean;
  jsValue: string;
  useJSFunction: boolean;
  testInput: string;
  testOutput: string;
  testIsRunning: boolean;
}

class AddInput extends React.Component<IProps, IState> {
  public state: IState = {
    modalOpen: false,
    selectedIOValue: this.props.ioValues[0],
    showJSTransform: false,
    jsValue:
      '//input is your input string (typeof string)\nfunction transform(input) {\n    return input;\n}',
    useJSFunction: false,
    testInput: '',
    testOutput: '',
    testIsRunning: false,
  };

  public testJSFunction = new RunJavaScriptFunction();

  public addInput = () => {
    let val = this.state.selectedIOValue;
    // console.log(this.state.jsValue);
    const filteredJS = this.state.jsValue
      .replace(/\/\/.*\n/g, ' ')
      .replace(/\n/g, ' ');
    // console.log(filteredJS);
    if (this.state.useJSFunction && this.state.showJSTransform) {
      val += ` |> (${filteredJS})`;
    }
    this.props.addValue(val);
    this.toggleModal();
  };

  public toggleModal = () => {
    this.setState((state) => ({
      modalOpen: !state.modalOpen,
    }));
  };

  public changeInputValue = (e: any) => {
    this.setState({ selectedIOValue: e.target.value });
  };

  public onChangeJS = (val: string, e: any) => {
    this.setState({ jsValue: val });
  };

  public runTest = async () => {
    this.setState({ testIsRunning: true });
    const result = await this.testJSFunction.runJavaScriptFunction(
      this.state.jsValue,
      this.state.testInput,
    );

    this.setState({
      testOutput: result,
      testIsRunning: false,
    });
  };

  public stopTest = () => {
    if (this.testJSFunction.worker) {
      this.testJSFunction.worker.terminate();
    }
    this.setState({
      testOutput: 'test_stopped',
      testIsRunning: false,
    });
  };

  public render() {
    return (
      <>
        <Button color="primary" size="sm" onClick={this.toggleModal}>
          Add {this.props.io} field
        </Button>
        <Modal
          isOpen={this.state.modalOpen}
          toggle={this.toggleModal}
          size="lg"
        >
          <ModalHeader toggle={this.toggleModal}>
            Add {this.props.io} field
          </ModalHeader>
          <ModalBody>
            Choose a value from the list of "-{this.props.io}" properties:
            <Input
              type="select"
              name="select"
              onChange={this.changeInputValue}
              value={this.state.selectedIOValue}
            >
              {this.props.ioValues.map((val, i) => (
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
                    height="100%"
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
                  <Input
                    type="text"
                    placeholder="value"
                    id="input-val"
                    onChange={(e: any) =>
                      this.setState({ testInput: e.target.value })
                    }
                  />
                </Col>
                <Col md={2} style={{ padding: '0px 5px' }}>
                  {this.state.testIsRunning ? (
                    <Button
                      color="danger"
                      style={{ width: '100%' }}
                      onClick={this.stopTest}
                    >
                      Stop test
                    </Button>
                  ) : (
                    <Button
                      color="primary"
                      style={{ width: '100%' }}
                      onClick={this.runTest}
                    >
                      Run JS
                    </Button>
                  )}
                </Col>
              </FormGroup>
              <FormGroup>
                <Label for="baseUrl">Output:</Label>
                <Input
                  type="text"
                  readOnly={true}
                  style={{ backgroundColor: 'white' }}
                  value={this.state.testOutput}
                />
              </FormGroup>
            </Collapse>
          </ModalBody>
          <ModalFooter>
            <Button color="success" onClick={this.addInput}>
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
