import React from 'react';
import brace from 'brace';
import AceEditor from 'react-ace';
import 'brace/mode/json';
import 'brace/theme/tomorrow';
import 'brace/ext/language_tools';
import { Alert, FormGroup, Input, Label } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import InfoQueryModal from './InfoQuery';
import requestHeaders from './requestHeaders.json';

const langTools = brace.acequire('ace/ext/language_tools');
const headerCompleter = {
  getCompletions: (
    editor: any,
    session: any,
    pos: any,
    prefix: any,
    callback: any,
  ) => {
    console.log(editor);
    console.log(session);
    console.log(pos);
    console.log(prefix);
    callback(
      null,
      requestHeaders.map((word) => ({
        caption: word,
        value: word,
        meta: 'static',
      })),
    );
  },
};

langTools.addCompleter(headerCompleter);

interface IProps {
  annotation: any;
  infoModalOpen: boolean;
}

interface IState {
  httpMethod: string;
  urlVal: string;
  queryValue: string;
  queryValid: boolean;
  headerValue: string;
  headerValid: boolean;
  bodyValue: string;
  bodyValid: boolean;
  infoModalOpen: boolean;
}

const isOneLevelStringJSON = (obj: any): boolean => {
  let valid = true;
  try {
    const json = JSON.parse(obj);
    valid = Object.values(json).reduce(
      (acc, cur) => typeof cur === 'string' && acc,
      true,
    ) as boolean;
  } catch (e) {
    // don't care
  }
  return valid;
};

class Mapping extends React.Component<IProps, IState> {
  public state: IState = {
    httpMethod: 'GET',
    urlVal: '',
    queryValue: '{\n\t\n}',
    queryValid: true,
    headerValue: '{\n\t\n}',
    headerValid: true,
    bodyValue: '{\n\t\n}',
    bodyValid: true,
    infoModalOpen: false,
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

  public changeHTTPMethod = (e: any) => {
    this.setState({ httpMethod: e.target.value });
  };

  public toggleInfoModal = () => {
    this.setState((state) => ({
      infoModalOpen: !state.infoModalOpen,
    }));
  };

  public render() {
    return (
      <div>
        <h1 className="text-center" style={{ marginTop: '40px' }}>
          Create your Mapping
        </h1>
        <h2>1.Request</h2>
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
        <FormGroup>
          <Label for="baseUrl">Base URL</Label>
          <Input
            type="text"
            name="url"
            id="baseUrl"
            placeholder="https://..."
          />
        </FormGroup>
        <FormGroup>
          <Label for="editor-query">
            URL Query Parameter{' '}
            <span className="cursor-hand" onClick={this.toggleInfoModal}>
              <FontAwesomeIcon
                className="cursor-hand"
                icon="info-circle"
                size="sm"
                color="lightblue"
              />
            </span>
          </Label>
          <AceEditor
            mode="json"
            theme="tomorrow"
            onChange={this.onChangeQuery}
            name="editor-query"
            editorProps={{ $blockScrolling: true }}
            fontSize={14}
            height="100px"
            width="100%"
            value={this.state.queryValue}
          />
          {!this.state.queryValid && (
            <Alert color="warning">Your object contains non string keys!</Alert>
          )}
        </FormGroup>
        <InfoQueryModal
          isOpen={this.state.infoModalOpen}
          toggleModal={this.toggleInfoModal}
        />
        <FormGroup>
          <Label for="editor-query">Header Properties</Label>
          <AceEditor
            mode="json"
            theme="tomorrow"
            onChange={this.onChangeHeader}
            name="editor-query"
            editorProps={{ $blockScrolling: true }}
            fontSize={14}
            height="100px"
            width="100%"
            value={this.state.headerValue}
            enableBasicAutocompletion={true}
          />
          {!this.state.headerValid && (
            <Alert color="warning">Your object contains non string keys!</Alert>
          )}
        </FormGroup>
      </div>
    );
  }
}

export default Mapping;
