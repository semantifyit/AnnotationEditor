import React from 'react';
import { set } from 'lodash';
import axios, { AxiosResponse, Method } from 'axios';
import { requestMapping, responseMapping } from 'api-mapping';
import {
  Alert,
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
import {
  isEmptyObject,
  removeNewLines,
  stringIsValidJSON,
} from '../../helpers/util';
import { RequestMapping, RequestOutput } from 'api-mapping/dist/requestMapping';
import { ResponseMapping } from 'api-mapping/dist/responseMapping';
import JSONBox from '../JSONBox';

interface IProps {
  inputProps: {
    path: string;
    pvs: IPropertyValueSpecification;
  }[];
  requestMapping: RequestMapping | undefined;
  requestMethod: string;
  testWithResponseMapping?: boolean;
  responseMapping?: ResponseMapping;
  disabled: boolean;
}

interface IState {
  inputs: string[];
  inputsValid: (string | undefined)[];
  editorValue: string;
  mappingOutput: RequestOutput | undefined;
  apiResponse: undefined | AxiosResponse;
  apiResponseErr?: boolean;
  responseMappingOutput?: object;
  errorMsg?: string;
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
    if (this.props.inputProps[index].pvs.multipleValuesAllowed) {
      set(this.editorObj, path.substring(2), value.split(',,'));
    } else {
      set(this.editorObj, path.substring(2), value);
    }
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
    // console.log(mappingOutput);
    if (this.props.testWithResponseMapping) {
      if (mappingOutput.url !== '') {
        this.callAPI(mappingOutput);
        this.setState({ errorMsg: '' });
      } else {
        this.setState({ errorMsg: "Can't call API, url is empty" });
      }
    }
  };

  public callAPI = async (mappingOutput = this.state.mappingOutput) => {
    if (!mappingOutput) {
      alert("Mapping output empty, shouldn't happen");
      return;
    }
    try {
      const response = await axios({
        method: this.props.requestMethod as Method,
        url: mappingOutput.url,
        headers: mappingOutput.headers,
        data: mappingOutput.body,
      });
      this.setState({
        apiResponse: response,
      });
      if (this.props.testWithResponseMapping) {
        this.doResponseMapping(response);
      }
      // console.log(response.data);
    } catch (e) {
      console.log('Err');
      console.log(e);
      // console.log(typeof e);
      // console.log(JSON.stringify(e, null, 2));
      if (e.response) {
        this.setState({
          apiResponse: e.response,
          errorMsg: 'API returned non success status',
        });
      } else {
        this.setState({
          errorMsg: removeNewLines(`Some error occurred while calling the API, probably a CORS
                error. (You can check your network tab for more information).
                You might want to try to call the API via our back-end (dropdown
                on "Call API" button).`),
        });
      }
    }
  };

  public doResponseMapping = (response: AxiosResponse) => {
    if (!this.props.responseMapping) {
      return;
    }

    const input = {
      headers: response.headers,
      body: response.data,
    };
    const responseMappingOutput = responseMapping(
      input,
      this.props.responseMapping,
    );
    this.setState({ responseMappingOutput });
  };

  public render() {
    const runMappingDisabled =
      !this.state.inputsValid.every((v) => v === undefined) &&
      stringIsValidJSON(this.state.editorValue);
    const { mappingOutput, apiResponse } = this.state;
    const title = this.props.testWithResponseMapping
      ? 'Test your full mapping'
      : 'Test your Request mapping';

    return (
      <ButtonModal
        triggerType="button"
        modalTitle={title}
        btnTitle={title}
        btnColor={this.props.testWithResponseMapping ? 'success' : 'info'}
        disabled={this.props.disabled}
        tooltip={
          this.props.disabled
            ? 'Make sure your request mappings are valid or filled in properly!'
            : 'Test your request mapping with input data'
        }
      >
        <h5>Enter values for the -input fields of your Action:</h5>
        <Row>
          <Col md={6}>
            {this.props.inputProps.map(({ path, pvs }, i) => (
              <FormGroup key={i}>
                <Label>
                  {path}
                  {pvs.multipleValuesAllowed && (
                    <span
                      style={{
                        fontSize: '0.8em',
                        fontStyle: 'italic',
                        marginLeft: '10px',
                      }}
                    >
                      (multiple allowed, separate with ",,")
                    </span>
                  )}
                </Label>
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
        {mappingOutput && !this.props.testWithResponseMapping && (
          <div>
            <hr />
            <h5>
              {this.props.testWithResponseMapping
                ? 'API Call:'
                : 'Mapping output:'}
            </h5>
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
              onClick={() => this.callAPI()}
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
          </div>
        )}
        {this.state.errorMsg && (
          <Alert color="danger" style={{ marginTop: '15px' }}>
            {this.state.errorMsg}
          </Alert>
        )}
        {this.state.responseMappingOutput && (
          <div>
            <hr />
            <h5>Mapping output:</h5>
            <JSONBox object={this.state.responseMappingOutput} />
          </div>
        )}
      </ButtonModal>
    );
  }
}

export default TestRequest;
