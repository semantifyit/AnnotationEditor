import React from 'react';
import { set } from 'lodash';
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
  disabled: boolean;
}

interface IState {
  inputs: string[];
  inputsValid: (string | undefined)[];
  editorValue: string;
  mappingOutput: RequestOutput | undefined;
}

class TestRequest extends React.Component<IProps, IState> {
  public state: IState = {
    inputs: this.props.inputProps.map(({ pvs }) => pvs.defaultValue || ''),
    inputsValid: this.props.inputProps.map(({ pvs }) =>
      validatePVS(pvs.defaultValue || '', pvs),
    ),
    editorValue: '',
    mappingOutput: undefined,
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
    const mappingOutput = requestMapping(
      JSON.parse(this.state.editorValue),
      this.props.requestMapping,
    );
    this.setState({ mappingOutput });
  };

  public render() {
    const runMappingDisabled =
      !this.state.inputsValid.every((v) => v === undefined) &&
      stringIsValidJSON(this.state.editorValue);
    const { mappingOutput } = this.state;
    return (
      <ButtonModal
        triggerType="button"
        modalTitle="Test your Request mapping"
        btnTitle="Test your Request mapping"
        btnColor="primary"
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
              Object.entries(mappingOutput.headers).map(([k, v]) => (
                <div>
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
          </div>
        )}
      </ButtonModal>
    );
  }
}

export default TestRequest;
