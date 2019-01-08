import React from 'react';
import { set } from 'lodash';
import axios, { AxiosResponse } from 'axios';
import { requestMapping } from 'api-mapping';
import {
  Button,
  Col,
  FormFeedback,
  FormGroup,
  Input,
  Label,
  Row,
} from 'reactstrap';
import ButtonModal from './ButtonModal';
import { IPropertyValueSpecification, validatePVS } from '../../helpers/helper';
import AceEditor from 'react-ace';
import { isEmptyObject, stringIsValidJSON } from '../../helpers/util';
import { RequestMapping, RequestOutput } from 'api-mapping/dist/mapper';
import JSONBox from '../JSONBox';

interface IProps {
  inputProps: {
    path: string;
    pvs: IPropertyValueSpecification;
  }[];
  requestMapping: RequestMapping | undefined;
  requestMethod: string;
  disabled: boolean;
}

interface IState {
  inputs: string[];
  inputsValid: (string | undefined)[];
  editorValue: string;
  mappingOutput: RequestOutput | undefined;
  apiResponse: undefined | AxiosResponse;
  apiResponseErr?: boolean;
}

class TestRequest extends React.Component<IProps, IState> {
  public state: IState = {
    inputs: this.props.inputProps.map(({ pvs }) => pvs.defaultValue || ''),
    inputsValid: this.props.inputProps.map(({ pvs }) =>
      validatePVS(pvs.defaultValue || '', pvs),
    ),
    editorValue: '',
    mappingOutput: undefined,
    apiResponse: undefined,
  };

  public editorObj = {
    '@context': 'http://schema.org/',
    '@type': 'Action',
  };

  public onChangeEditor = (value: string, event: any) => {
    this.setState({
      editorValue: value,
    });
  };

  public componentDidMount = () => {
    this.props.inputProps.forEach(({ path, pvs }) => {
      set(this.editorObj, path.substring(2), pvs.defaultValue || '');
    });
    this.setState({ editorValue: JSON.stringify(this.editorObj, null, 4) });
  };

  public changeInputField = (index: number, path: string, value: string) => {
    set(this.editorObj, path.substring(2), value);
    this.setState((state) => {
      const inputs = state.inputs;
      inputs[index] = value;
      const inputsValid = state.inputsValid;
      inputsValid[index] = validatePVS(value, this.props.inputProps[index].pvs);
      return {
        inputs,
        inputsValid,
        editorValue: JSON.stringify(this.editorObj, null, 4),
      };
    });
  };

  public runRequestMapping = () => {
    if (!this.props.requestMapping) {
      alert('There is some error with your mapping!');
      return;
    }
    // console.log(this.props.requestMapping);
    const mappingOutput = requestMapping(
      JSON.parse(this.state.editorValue),
      this.props.requestMapping,
    );
    // console.log(mappingOutput);

    this.setState({ mappingOutput });
  };

  public callAPI = async () => {
    if (!this.state.mappingOutput) {
      alert("Mapping output empty, shouldn't happen");
      return;
    }
    try {
      const response = await axios({
        method: this.props.requestMethod,
        url: this.state.mappingOutput.url,
        headers: this.state.mappingOutput.headers,
        data: this.state.mappingOutput.body,
      });
      this.setState({
        apiResponse: response,
      });
      // console.log(response.data);
    } catch (e) {
      // console.log('Err');
      // console.log(e);
      // console.log(typeof e);
      // console.log(JSON.stringify(e, null, 2));
      if (e.response) {
        this.setState({
          apiResponse: e.response,
        });
      } else {
        this.setState({
          apiResponseErr: true,
        });
      }
    }
  };

  public render() {
    const runMappingDisabled =
      !this.state.inputsValid.every((v) => v === undefined) &&
      stringIsValidJSON(this.state.editorValue);
    const { mappingOutput, apiResponse } = this.state;

    return (
      <ButtonModal
        triggerType="button"
        modalTitle="Test your Request mapping"
        btnTitle="Test your Request mapping"
        btnColor="info"
        disabled={this.props.disabled}
      >
        <h5>Enter values for the -input fields of your Action:</h5>
        <Row>
          <Col md={6}>
            {this.props.inputProps.map(({ path, pvs }, i) => (
              <FormGroup key={i}>
                <Label>{path}</Label>
                <Input
                  invalid={!!this.state.inputsValid[i]}
                  value={this.state.inputs[i]}
                  onChange={(e) =>
                    this.changeInputField(i, path, e.target.value)
                  }
                />
                {this.state.inputsValid[i] && (
                  <FormFeedback>{this.state.inputsValid[i]}</FormFeedback>
                )}
              </FormGroup>
            ))}
          </Col>
          <Col md={6}>
            <AceEditor
              name="editor-test-request"
              mode="json"
              theme="tomorrow"
              onChange={this.onChangeEditor}
              fontSize={14}
              editorProps={{ $blockScrolling: true }}
              value={this.state.editorValue}
              style={{ border: '1px solid lightgrey' }}
              width="auto"
              height={`${this.props.inputProps.length * 86}px`}
            />
          </Col>
        </Row>
        <Button
          color="primary"
          onClick={this.runRequestMapping}
          disabled={runMappingDisabled}
          title={
            runMappingDisabled
              ? 'Make sure all input fields are filled in correctly'
              : 'Run your mapping with your inputs'
          }
        >
          Run your mapping!
        </Button>
        {mappingOutput && (
          <div>
            <hr />
            <h5>Mapping output:</h5>
            Url:
            <br />
            {mappingOutput.url !== '' ? (
              <b>{mappingOutput.url}</b>
            ) : (
              <i style={{ color: 'grey' }}>No Url</i>
            )}
            <br />
            <br />
            Headers:
            <br />
            {mappingOutput.headers && !isEmptyObject(mappingOutput.headers) ? (
              Object.entries(mappingOutput.headers).map(([k, v], i) => (
                <div key={i}>
                  <b>{k}:</b> {v}
                  <br />
                </div>
              ))
            ) : (
              <i style={{ color: 'grey' }}>No Headers</i>
            )}
            <br />
            <br />
            Body:
            <br />
            {mappingOutput.body && !isEmptyObject(mappingOutput.body) ? (
              <JSONBox object={mappingOutput.body} />
            ) : (
              <i style={{ color: 'grey' }}>No Body</i>
            )}
            <br />
            <br />
            <Button
              color="primary"
              disabled={mappingOutput.url === ''}
              onClick={this.callAPI}
            >
              Call API
            </Button>
            {apiResponse && (
              <div>
                <hr />
                <h5> API response: </h5>
                <b>Status:</b> {apiResponse.status} {apiResponse.statusText}{' '}
                <br />
                <b>Headers:</b>
                <br />
                <div className="box">
                  {Object.entries(apiResponse.headers).map(([k, v], i) => (
                    <div key={i}>
                      <b>{k}:</b> {v}
                      <br />
                    </div>
                  ))}
                </div>
                <b>Data:</b>
                <br />
                {typeof apiResponse.data === 'object' ? (
                  <JSONBox object={apiResponse.data} withCopy={true} />
                ) : (
                  <div className="box">{String(apiResponse.data)}</div>
                )}
              </div>
            )}
            <br />
            {this.state.apiResponseErr && (
              <>
                Some error occurred while calling the API, probably a CORS
                error. (You can check your network tab for more information).
                You might want to try to call the API via our back-end (dropdown
                on "Call API" button).
              </>
            )}
          </div>
        )}
      </ButtonModal>
    );
  }
}

export default TestRequest;
