import React from 'react';
// eslint-disable-next-line
import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/json';
import 'brace/snippets/json';
import 'brace/mode/xml';
import 'brace/snippets/xml';
import 'brace/mode/yaml';
import 'brace/snippets/yaml';
import 'brace/mode/javascript';
import 'brace/snippets/javascript';

import 'brace/theme/tomorrow';
import 'brace/ext/language_tools';
import { Alert, Col, FormGroup, Input, Label, Row } from 'reactstrap';

import InfoQuery from './InfoQuery';
import {
  getAnnotationCompleter,
  requestHeaderCompleter,
  responseHeaderCompleter,
} from './completers';
import './snippets';
import AddInputOutput from './AddInputOutput';
import { stringIsValidJSON } from '../../helpers/util';
import InfoPath from './InfoPath';
import InfoHeader from './InfoHeader';
import InfoPayload from './InfoPayload';
import InfoUsingInput from './InfoUsingInput';
import TestRequest from './TestRequest';
import JSONBox from '../JSONBox';
import { getIOProps } from '../../helpers/helper';
import InfoUsingOutput from './InfoUsingOutput';
import InfoHeaderResponse from './InfoHeaderResponse';
import InfoPayloadResponse from './InfoPayloadResponse';
import TestResponse from './TestResponse';

// const langTools = brace.acequire('ace/ext/language_tools');

interface IMappingEditors {
  path?: any;
  query?: any;
  header?: any;
  payload?: any;
  headerResponse?: any;
  payloadResponse?: any;
}

interface IProps {
  annotation: any;
  domIdPrefix?: string;
}

interface IState {
  httpMethod: string;
  urlVal: string;
  pathValue: string;
  pathValid: boolean;
  pathValidJSON: boolean;
  queryValue: string;
  queryValid: boolean;
  queryValidJSON: boolean;
  headerValue: string;
  headerValid: boolean;
  headerValidJSON: boolean;
  payloadValue: string;
  payloadValidJSON: boolean;
  headerResponseValue: string;
  headerResponseValid: boolean;
  headerResponseValidJSON: boolean;
  payloadResponseValue: string;
  payloadResponseValidJSON: boolean;
  payloadType: 'json' | 'xml' | 'javascript';
  payloadResponseType: 'json' | 'xml' | 'yaml';
}

const isOneLevelStringJSON = (obj: string): boolean =>
  !stringIsValidJSON(obj) ||
  Object.values(JSON.parse(obj)).every((e) => typeof e === 'string');

const isArrayOfStrings = (obj: string): boolean =>
  !stringIsValidJSON(obj) ||
  (Array.isArray(JSON.parse(obj)) &&
    JSON.parse(obj).every((e: any) => typeof e === 'string'));

const getMappingType = (str: 'json' | 'xml' | 'javascript' | 'yaml'): any =>
  ({
    json: 'json',
    xml: 'xml',
    javascript: 'js',
    yaml: 'yarrrml',
  }[str]);

class Mapping extends React.Component<IProps, IState> {
  public state: IState = {
    httpMethod: 'GET',
    urlVal: '',
    pathValue: '[\n    \n]',
    pathValid: true,
    pathValidJSON: true,
    queryValue: '{\n    \n}',
    queryValid: true,
    queryValidJSON: true,
    headerValue: '{\n    \n}',
    headerValid: true,
    headerValidJSON: true,
    payloadValue: '{\n    \n}',
    payloadValidJSON: true,
    headerResponseValue: '{\n    \n}',
    headerResponseValid: true,
    headerResponseValidJSON: true,
    payloadResponseValue: '{\n    \n}',
    payloadResponseValidJSON: true,
    payloadType: 'json',
    payloadResponseType: 'json',
  };

  public domIdPrefix = this.props.domIdPrefix || '';
  public editors: IMappingEditors = {};

  public inputProps = getIOProps(this.props.annotation, 'input');
  public outputProps = getIOProps(this.props.annotation, 'output');

  public annotationInputCompleter = getAnnotationCompleter(
    this.props.annotation,
    '-input',
  );
  public annotationOutputCompleter = getAnnotationCompleter(
    this.props.annotation,
    '-output',
  );

  public onChangePath = (value: string, event: any) => {
    this.setState({
      pathValue: value,
      pathValid: isArrayOfStrings(value),
      pathValidJSON: stringIsValidJSON(value),
    });
  };

  public onChangeQuery = (value: string, event: any) => {
    this.setState({
      queryValue: value,
      queryValid: isOneLevelStringJSON(value),
      queryValidJSON: stringIsValidJSON(value),
    });
  };

  public onChangeHeader = (value: string, event: any) => {
    this.setState({
      headerValue: value,
      headerValid: isOneLevelStringJSON(value),
      headerValidJSON: stringIsValidJSON(value),
    });
  };

  public onChangePayload = (value: string, event: any) => {
    this.setState({
      payloadValue: value,
      payloadValidJSON:
        this.state.payloadType === 'json' ? stringIsValidJSON(value) : true,
    });
  };

  public onChangeHeadersResponse = (value: string, event: any) => {
    this.setState({
      headerResponseValue: value,
      headerResponseValid: isOneLevelStringJSON(value),
      headerResponseValidJSON: stringIsValidJSON(value),
    });
  };

  public onChangePayloadResponse = (value: string, event: any) => {
    this.setState({
      payloadResponseValue: value,
      payloadResponseValidJSON:
        this.state.payloadResponseType === 'json'
          ? stringIsValidJSON(value)
          : true,
    });
  };

  public changeHTTPMethod = (e: any) => {
    this.setState({ httpMethod: e.target.value });
  };

  public changePayloadType = (e: any) => {
    this.setState({ payloadType: e.target.value });
  };

  public changePayloadResponseType = (e: any) => {
    this.setState({ payloadResponseType: e.target.value });
  };

  public addInputValue = (
    value: string,
    location:
      | 'path'
      | 'query'
      | 'header'
      | 'payload'
      | 'headerResponse'
      | 'payloadResponse',
  ) => {
    this.editors[location].session.insert(
      this.editors[location].getCursorPosition(),
      value,
    );
  };

  public componentDidUpdate = () => {
    this.inputProps = getIOProps(this.props.annotation, 'input');
    this.outputProps = getIOProps(this.props.annotation, 'output');
    this.annotationInputCompleter = getAnnotationCompleter(
      this.props.annotation,
      '-input',
    );
    this.annotationOutputCompleter = getAnnotationCompleter(
      this.props.annotation,
      '-output',
    );
    this.editors.path.completers = [this.annotationInputCompleter];
    this.editors.query.completers = [this.annotationInputCompleter];
    this.editors.header.completers = [
      this.annotationInputCompleter,
      requestHeaderCompleter,
    ];
    this.editors.payload.completers = [this.annotationInputCompleter];
    this.editors.headerResponse.completers = [this.annotationOutputCompleter];
    this.editors.payloadResponse.completers = [this.annotationOutputCompleter];
  };

  public render() {
    const inputPropsKeys = this.inputProps.map((p) => p.path);
    const outputPropKeys = this.outputProps.map((p) => p.path);
    const requestMappingIsValid =
      this.state.pathValid &&
      this.state.pathValidJSON &&
      this.state.queryValid &&
      this.state.queryValidJSON &&
      this.state.headerValid &&
      this.state.headerValidJSON &&
      this.state.payloadValidJSON;
    // is.state.urlVal !== '';
    let requestMapping;
    if (requestMappingIsValid) {
      requestMapping = {
        // method: this.state.httpMethod,
        url: this.state.urlVal,
        path: JSON.parse(this.state.pathValue),
        query: JSON.parse(this.state.queryValue),
        headers: JSON.parse(this.state.headerValue),
        body: this.state.payloadValue,
      };
    }
    const responseMappingIsValid =
      this.state.headerResponseValid &&
      this.state.headerResponseValidJSON &&
      this.state.payloadResponseValidJSON;
    let responseMapping;
    if (responseMappingIsValid) {
      responseMapping = {
        headers: JSON.parse(this.state.headerResponseValue),
        body: this.state.payloadResponseValue,
      };
    }

    const unusedInputProps = this.inputProps
      .map(({ path }) => path)
      .filter(
        (path) =>
          !(
            this.state.pathValue +
            this.state.queryValue +
            this.state.headerValue +
            this.state.payloadValue
          ).includes(path),
      );

    const unusedOutputProps = this.outputProps
      .map(({ path }) => path)
      .filter(
        (path) =>
          !(
            this.state.headerResponseValue + this.state.payloadResponseValue
          ).includes(path),
      );

    this.inputProps = getIOProps(this.props.annotation, 'input');
    this.outputProps = getIOProps(this.props.annotation, 'output');

    return (
      <div>
        <h1 className="text-center" style={{ marginTop: '40px' }}>
          Create your Mapping
        </h1>
        <h2>
          <span>1.Request</span>
          <div className="float-right">
            <InfoUsingInput />
          </div>
        </h2>
        <Row>
          <Col md="4" style={{ paddingLeft: 0 }}>
            <JSONBox object={this.props.annotation} />
            <TestRequest
              inputProps={this.inputProps}
              disabled={!requestMappingIsValid}
              requestMapping={requestMapping}
              requestMethod={this.state.httpMethod}
              requestMappingType={getMappingType(this.state.payloadType)}
            />
          </Col>
          <Col md="8" style={{ paddingRight: 0 }}>
            <Row>
              <Col md="4" style={{ paddingLeft: 0 }}>
                <FormGroup>
                  <Label for="httpSelectMethod">HTTP Method:</Label>
                  <Input
                    type="select"
                    name="select"
                    id={`${this.domIdPrefix}-httpSelectMethod`}
                    onChange={this.changeHTTPMethod}
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>PATCH</option>
                    <option>DELETE</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md="8" style={{ paddingRight: 0 }}>
                <FormGroup>
                  <Label for="baseUrl">Base URL:</Label>
                  <Input
                    type="text"
                    name="url"
                    id={`${this.domIdPrefix}-baseUrl`}
                    placeholder="https://..."
                    onChange={(e) => this.setState({ urlVal: e.target.value })}
                  />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <div style={{ paddingBottom: '5px' }}>
                <div className="float-right" style={{ marginLeft: '5px' }}>
                  <AddInputOutput
                    io="input"
                    ioValues={inputPropsKeys}
                    addValue={(v) => this.addInputValue(v, 'path')}
                  />
                </div>
                <Label for="editor-path" style={{ padding: 0 }}>
                  URL Path: <InfoPath />
                </Label>
              </div>
              <div style={{ border: '1px solid lightgrey' }}>
                <AceEditor
                  mode="json"
                  theme="tomorrow"
                  onChange={this.onChangePath}
                  name={`${this.domIdPrefix}-editor-path`}
                  editorProps={{ $blockScrolling: Infinity }}
                  fontSize={14}
                  setOptions={{ enableSnippets: true }}
                  height="100px"
                  width="100%"
                  value={this.state.pathValue}
                  enableBasicAutocompletion={true}
                  onLoad={(editor: any) => {
                    this.editors.path = editor;
                    editor.completers = [this.annotationInputCompleter];
                  }}
                />
                {!this.state.pathValid && (
                  <Alert color="warning">
                    Your mapping isn't a array of strings (see hint)
                  </Alert>
                )}
              </div>
            </FormGroup>
            <FormGroup>
              <div style={{ paddingBottom: '5px' }}>
                <div className="float-right" style={{ marginLeft: '5px' }}>
                  <AddInputOutput
                    io="input"
                    ioValues={inputPropsKeys}
                    addValue={(v) => this.addInputValue(v, 'query')}
                  />
                </div>
                <Label for="editor-query" style={{ padding: 0 }}>
                  URL Query Parameter: <InfoQuery />
                </Label>
              </div>
              <div style={{ border: '1px solid lightgrey' }}>
                <AceEditor
                  mode="json"
                  theme="tomorrow"
                  onChange={this.onChangeQuery}
                  name={`${this.domIdPrefix}-editor-query`}
                  editorProps={{ $blockScrolling: Infinity }}
                  fontSize={14}
                  setOptions={{ enableSnippets: true }}
                  height="100px"
                  width="100%"
                  value={this.state.queryValue}
                  enableBasicAutocompletion={true}
                  onLoad={(editor: any) => {
                    this.editors.query = editor;
                    editor.completers = [this.annotationInputCompleter];
                  }}
                />
                {!this.state.queryValid && (
                  <Alert color="warning">
                    Your object contains non string keys!
                  </Alert>
                )}
              </div>
            </FormGroup>
            <FormGroup>
              <div style={{ paddingBottom: '5px' }}>
                <div className="float-right" style={{ marginLeft: '5px' }}>
                  <AddInputOutput
                    io="input"
                    ioValues={inputPropsKeys}
                    addValue={(v) => this.addInputValue(v, 'header')}
                  />
                </div>
                <Label for="editor-headers" style={{ padding: 0 }}>
                  Header Properties: <InfoHeader />
                </Label>
              </div>
              <div style={{ border: '1px solid lightgrey' }}>
                <AceEditor
                  mode="json"
                  theme="tomorrow"
                  onChange={this.onChangeHeader}
                  name={`${this.domIdPrefix}-editor-header`}
                  editorProps={{ $blockScrolling: Infinity }}
                  fontSize={14}
                  height="100px"
                  width="100%"
                  value={this.state.headerValue}
                  enableBasicAutocompletion={true}
                  setOptions={{ enableSnippets: true }}
                  onLoad={(editor: any) => {
                    this.editors.header = editor;
                    editor.completers = [
                      this.annotationInputCompleter,
                      requestHeaderCompleter,
                    ];
                  }}
                />
                {!this.state.headerValid && (
                  <Alert color="warning">
                    Your object contains non string keys!
                  </Alert>
                )}
              </div>
            </FormGroup>
            <FormGroup>
              <div style={{ paddingBottom: '5px' }}>
                <div className="float-right" style={{ marginLeft: '5px' }}>
                  <AddInputOutput
                    io="input"
                    ioValues={inputPropsKeys}
                    addValue={(v) => this.addInputValue(v, 'payload')}
                  />
                </div>
                <Input
                  type="select"
                  bsSize="sm"
                  className="float-right"
                  style={{ width: '100px' }}
                  onChange={this.changePayloadType}
                >
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="javascript">JavaScript</option>
                </Input>
                <Label for="editor-query" style={{ padding: 0 }}>
                  Payload: <InfoPayload />
                </Label>
              </div>
              <div style={{ border: '1px solid lightgrey' }}>
                <AceEditor
                  mode={this.state.payloadType}
                  theme="tomorrow"
                  onChange={this.onChangePayload}
                  name={`${this.domIdPrefix}-editor-payload`}
                  editorProps={{ $blockScrolling: Infinity }}
                  fontSize={14}
                  width="100%"
                  height="400px"
                  value={this.state.payloadValue}
                  enableBasicAutocompletion={true}
                  setOptions={{
                    enableSnippets: this.state.payloadType === 'json',
                  }}
                  onLoad={(editor: any) => {
                    this.editors.payload = editor;
                    editor.completers = [this.annotationInputCompleter];
                  }}
                  cursorStart={0}
                />
              </div>
            </FormGroup>
          </Col>
        </Row>
        {unusedInputProps.length > 0 && (
          <Alert color="warning">
            Your mapping isn't using theses input properties:{' '}
            {unusedInputProps.join(', ')}
          </Alert>
        )}
        <hr />
        <h2>
          <span>2. Response</span>
          <div className="float-right">
            <InfoUsingOutput />
          </div>
        </h2>
        <FormGroup>
          <div style={{ paddingBottom: '5px' }}>
            <div className="float-right" style={{ marginLeft: '5px' }}>
              <AddInputOutput
                io="output"
                ioValues={outputPropKeys}
                addValue={(v) => this.addInputValue(v, 'headerResponse')}
              />
            </div>
            <Label for="editor-header-response" style={{ padding: 0 }}>
              General + Header Response: <InfoHeaderResponse />
            </Label>
          </div>
          <div style={{ border: '1px solid lightgrey' }}>
            <AceEditor
              mode="json"
              theme="tomorrow"
              onChange={this.onChangeHeadersResponse}
              name={`${this.domIdPrefix}-editor-header-response`}
              editorProps={{ $blockScrolling: Infinity }}
              fontSize={14}
              height="100px"
              width="100%"
              value={this.state.headerResponseValue}
              enableBasicAutocompletion={true}
              setOptions={{ enableSnippets: true }}
              onLoad={(editor: any) => {
                this.editors.headerResponse = editor;
                editor.completers = [
                  this.annotationOutputCompleter,
                  responseHeaderCompleter,
                ];
              }}
            />
            {!this.state.headerResponseValid && (
              <Alert color="warning">
                Your object contains non string keys!
              </Alert>
            )}
          </div>
        </FormGroup>
        <FormGroup>
          <div style={{ paddingBottom: '5px' }}>
            <div className="float-right" style={{ marginLeft: '5px' }}>
              <AddInputOutput
                io="output"
                ioValues={outputPropKeys}
                addValue={(v) => this.addInputValue(v, 'headerResponse')}
              />
            </div>
            <Input
              type="select"
              bsSize="sm"
              className="float-right"
              style={{ width: '100px' }}
              onChange={this.changePayloadResponseType}
            >
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="yaml">Yarrrml</option>
            </Input>
            <Label for="editor-payload-response" style={{ padding: 0 }}>
              Response Payload: <InfoPayloadResponse />
            </Label>
          </div>
          <div style={{ border: '1px solid lightgrey' }}>
            <AceEditor
              mode={this.state.payloadResponseType}
              theme="tomorrow"
              onChange={this.onChangePayloadResponse}
              name={`${this.domIdPrefix}-editor-payload-response`}
              editorProps={{ $blockScrolling: Infinity }}
              fontSize={14}
              height="400px"
              width="100%"
              value={this.state.payloadResponseValue}
              enableBasicAutocompletion={true}
              setOptions={{ enableSnippets: true }}
              onLoad={(editor: any) => {
                this.editors.payloadResponse = editor;
                editor.completers = [this.annotationOutputCompleter];
              }}
            />
          </div>
        </FormGroup>
        {unusedOutputProps.length > 0 && (
          <Alert color="warning">
            Your mapping isn't using theses output properties:{' '}
            {unusedOutputProps.join(', ')}
          </Alert>
        )}
        <TestResponse
          disabled={!responseMappingIsValid}
          responseMapping={responseMapping}
        />
        <br />
        <br />
        When you have tested your request mapping and response mapping
        individually, make sure to test your full mapping:
        <br />
        <TestRequest
          testWithResponseMapping={true}
          inputProps={this.inputProps}
          disabled={!(requestMappingIsValid && responseMappingIsValid)}
          requestMapping={requestMapping}
          requestMethod={this.state.httpMethod}
          responseMapping={responseMapping}
          requestMappingType={getMappingType(this.state.payloadType)}
          responseMappingType={getMappingType(this.state.payloadResponseType)}
        />
      </div>
    );
  }
}

export default Mapping;
