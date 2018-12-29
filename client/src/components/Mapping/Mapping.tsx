import React from 'react';
import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/json';
import 'brace/snippets/json';
import 'brace/mode/xml';
import 'brace/snippets/xml';
import 'brace/mode/yaml';
import 'brace/snippets/yaml';
import 'brace/mode/graphqlschema';
import 'brace/snippets/graphqlschema';

import 'brace/theme/tomorrow';
import 'brace/ext/language_tools';
import { Alert, Col, FormGroup, Input, Label, Row } from 'reactstrap';

import InfoQuery from './InfoQuery';
import { getAnnotationCompleter, requestHeaderCompleter } from './completers';
import './snippets';
import { syntaxHighlightJsonStr } from '../../helpers/html';
import AddInput from './AddInput';
import { flattenObject, stringIsValidJSON } from '../../helpers/util';
import InfoPath from './InfoPath';
import InfoHeader from './InfoHeader';
import InfoPayload from './InfoPayload';
import InfoUsingInput from './InfoUsingInput';

// const langTools = brace.acequire('ace/ext/language_tools');

const testAnnotation = {
  '@context': { '@vocab': 'http://schema.org/' },
  '@type': 'SearchAction',
  actionStatus: {
    '@id': 'http://schema.org/PotentialActionStatus',
    '@type': 'ActionStatusType',
  },
  description: 'Searches for room-availability for this hotel',
  name: 'Search for rooms and its offers',
  object: {
    '@type': 'LodgingReservation',
    'checkinTime-input': 'required',
    'checkoutTime-input': 'required',
    'numAdults-input': 'required',
    'numChildren-input': 'required',
    reservationFor: {
      '@type': 'Person',
      'name-input': {
        '@type': 'PropertyValueSpecification',
        valueRequired: 'true',
      },
    },
  },
  result: { '@type': ['Offer', 'LodgingReservation'] },
  target: {
    '@type': 'EntryPoint',
    contentType: 'application/ld+json',
    encodingType: 'application/ld+json',
    httpMethod: 'POST',
    urlTemplate: 'https://actions.semantify.it/api/easybooking/search/3896',
  },
};

const annotationCompleter = getAnnotationCompleter(testAnnotation, '-input');

interface IMappingEditors {
  path?: any;
  query?: any;
  header?: any;
  payload?: any;
}

interface IProps {
  annotation: any;
}

interface IState {
  httpMethod: string;
  urlVal: string;
  pathValue: string;
  pathValid: boolean;
  queryValue: string;
  queryValid: boolean;
  headerValue: string;
  headerValid: boolean;
  payloadValue: string;
  payloadType: 'json' | 'xml' | 'yaml' | 'graphqlschema';
}

const isOneLevelStringJSON = (obj: string): boolean =>
  !stringIsValidJSON(obj) ||
  Object.values(JSON.parse(obj)).every((e) => typeof e === 'string');

const isArrayOfStrings = (obj: string): boolean =>
  !stringIsValidJSON(obj) ||
  (Array.isArray(JSON.parse(obj)) &&
    JSON.parse(obj).every((e: any) => typeof e === 'string'));

class Mapping extends React.Component<IProps, IState> {
  public state: IState = {
    httpMethod: 'GET',
    urlVal: '',
    pathValue: '[\n    \n]',
    pathValid: true,
    queryValue: '{\n    \n}',
    queryValid: true,
    headerValue: '{\n    \n}',
    headerValid: true,
    payloadValue: '{\n    \n}',
    payloadType: 'json',
  };

  public editors: IMappingEditors = {};

  public annotation: any = testAnnotation;
  public inputProps: string[] = Object.keys(
    flattenObject(testAnnotation, '$'),
  ).filter((k) => k.endsWith('-input'));

  public onChangePath = (value: string, event: any) => {
    this.setState({
      pathValue: value,
      pathValid: isArrayOfStrings(value),
    });
  };

  public onChangeQuery = (value: string, event: any) => {
    this.setState({
      queryValue: value,
      queryValid: isOneLevelStringJSON(value),
    });
  };

  public onChangeHeader = (value: string, event: any) => {
    this.setState({
      headerValue: value,
      headerValid: isOneLevelStringJSON(value),
    });
  };

  public onChangePayload = (value: string, event: any) => {
    this.setState({
      payloadValue: value,
    });
  };

  public changeHTTPMethod = (e: any) => {
    this.setState({ httpMethod: e.target.value });
  };

  public changePayloadType = (e: any) => {
    this.setState({ payloadType: e.target.value });
  };

  public addInputValue = (
    value: string,
    location: 'path' | 'query' | 'header' | 'payload',
  ) => {
    // console.log(value);
    // console.log(location);
    // this.editors[location].setValue(value);
    this.editors[location].session.insert(
      this.editors[location].getCursorPosition(),
      value,
    );
  };

  public render() {
    return (
      <div>
        <h1 className="text-center" style={{ marginTop: '40px' }}>
          Create your Mapping
        </h1>
        <h2>1.Request</h2>
        <div className="float-right">
          <InfoUsingInput />
        </div>
        <Row>
          <Col md="4">
            <pre
              dangerouslySetInnerHTML={{
                __html: syntaxHighlightJsonStr(
                  JSON.stringify(testAnnotation, null, 2),
                ),
              }}
              style={{
                borderRadius: '4px',
                border: '1px solid lightgrey',
                fontSize: '13px',
                padding: '10px',
              }}
            />
          </Col>
          <Col md="8">
            <Row>
              <Col md="4" style={{ paddingLeft: 0 }}>
                <FormGroup>
                  <Label for="httpSelectMethod">HTTP Method:</Label>
                  <Input
                    type="select"
                    name="select"
                    id="httpSelectMethod"
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
                    id="baseUrl"
                    placeholder="https://..."
                  />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <div style={{ paddingBottom: '5px' }}>
                <div className="float-right" style={{ marginLeft: '5px' }}>
                  <AddInput
                    inputValues={this.inputProps}
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
                  name="editor-path"
                  editorProps={{ $blockScrolling: Infinity }}
                  fontSize={14}
                  setOptions={{ enableSnippets: true }}
                  height="100px"
                  width="100%"
                  value={this.state.pathValue}
                  enableBasicAutocompletion={true}
                  onLoad={(editor: any) => {
                    this.editors.path = editor;
                    editor.completers = [annotationCompleter];
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
                  <AddInput
                    inputValues={this.inputProps}
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
                  name="editor-query"
                  editorProps={{ $blockScrolling: Infinity }}
                  fontSize={14}
                  setOptions={{ enableSnippets: true }}
                  height="100px"
                  width="100%"
                  value={this.state.queryValue}
                  enableBasicAutocompletion={true}
                  onLoad={(editor: any) => {
                    this.editors.query = editor;
                    editor.completers = [annotationCompleter];
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
                  <AddInput
                    inputValues={this.inputProps}
                    addValue={(v) => this.addInputValue(v, 'header')}
                  />
                </div>
                <Label for="editor-query" style={{ padding: 0 }}>
                  Header Properties: <InfoHeader />
                </Label>
              </div>
              <div style={{ border: '1px solid lightgrey' }}>
                <AceEditor
                  mode="json"
                  theme="tomorrow"
                  onChange={this.onChangeHeader}
                  name="editor-query"
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
                      annotationCompleter,
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
                  <AddInput
                    inputValues={this.inputProps}
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
                  <option value="yaml">YAML</option>
                  <option value="graphqlschema">GraphQL</option>
                </Input>
                <Label for="editor-query" style={{ padding: 0 }}>
                  Payload: <InfoPayload />
                </Label>
              </div>
              <div
                style={{
                  border: '1px solid lightgrey',
                  resize: 'vertical',
                  height: '400px',
                  minHeight: '100px',
                  overflow: 'auto',
                  paddingBottom: '10px',
                }}
              >
                <AceEditor
                  mode={this.state.payloadType}
                  theme="tomorrow"
                  onChange={this.onChangePayload}
                  name="editor-query"
                  editorProps={{ $blockScrolling: Infinity }}
                  fontSize={14}
                  width="100%"
                  height="100%"
                  value={this.state.payloadValue}
                  enableBasicAutocompletion={true}
                  setOptions={{
                    enableSnippets: this.state.payloadType === 'json',
                  }}
                  onLoad={(editor: any) => {
                    this.editors.payload = editor;
                    editor.completers = [annotationCompleter];
                  }}
                />
              </div>
            </FormGroup>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Mapping;
