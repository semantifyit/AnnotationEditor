import React from 'react';
import { set } from 'lodash';
import {
  Col,
  FormFeedback,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Label,
  Row,
} from 'reactstrap';
import ButtonModal from './ButtonModal';
import { IPropertyValueSpecification, validatePVS } from '../../helpers/helper';
import AceEditor from 'react-ace';

interface IProps {
  inputProps: {
    path: string;
    pvs: IPropertyValueSpecification;
  }[];
}

interface IState {
  inputs: string[];
  editorValue: string;
}

class TestRequest extends React.Component<IProps, IState> {
  public state: IState = {
    inputs: this.props.inputProps.map(({ pvs }) => pvs.defaultValue || ''),
    editorValue: '',
  };

  public editorObj = {
    '@context': 'http://schema.org',
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
      return { inputs, editorValue: JSON.stringify(this.editorObj, null, 4) };
    });
  };

  public render() {
    return (
      <ButtonModal
        triggerType="button"
        modalTitle="Test your Request mapping"
        btnTitle="Test your Request mapping"
        btnColor="info"
      >
        <h6>Enter values for the -input fields of your Action:</h6>
        <Row>
          <Col md={6}>
            {this.props.inputProps.map(({ path, pvs }, i) => {
              const validationResult = validatePVS(this.state.inputs[i], pvs);
              return (
                <FormGroup key={i}>
                  <Label>{path}</Label>
                  <Input
                    invalid={!!validationResult}
                    value={this.state.inputs[i]}
                    onChange={(e) =>
                      this.changeInputField(i, path, e.target.value)
                    }
                  />
                  {validationResult && (
                    <FormFeedback>{validationResult}</FormFeedback>
                  )}
                </FormGroup>
              );
            })}
          </Col>
          <Col md={6}>
            <AceEditor
              name="editor-test-requesz"
              mode="json"
              theme="tomorrow"
              onChange={this.onChangeEditor}
              fontSize={14}
              editorProps={{ $blockScrolling: true }}
              value={this.state.editorValue}
              style={{ border: '1px solid lightgrey' }}
              width="auto"
            />
          </Col>
        </Row>
      </ButtonModal>
    );
  }
}

export default TestRequest;
