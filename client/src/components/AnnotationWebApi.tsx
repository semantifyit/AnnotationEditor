import * as React from 'react';
import Select from 'react-select';
import 'react-toastify/dist/ReactToastify.css';

import { INode } from '../helpers/Vocab';
import {
  generateJSONLD,
  getDescriptionOfNode,
  getNameOfNode,
} from '../helpers/helper';
import { ISingleOption } from './DropDownSelect';
import Annotation from './Annotation';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { copyStrIntoClipBoard, syntaxHighlightJsonStr } from '../helpers/html';
import { toast, ToastContainer } from 'react-toastify';
import { clone } from '../helpers/util';
import { VocabContext, IContext } from '../helpers/VocabContext';

interface IState {
  ready: boolean;
  currentStep: number;
  modalIsOpen: boolean;
}

class AnnotationWebApi extends React.Component<{}, IState> {
  public static contextType = VocabContext;
  public context: IContext;
  public state: IState = {
    ready: false,
    currentStep: 0,
    modalIsOpen: false,
  };

  public steps = [
    {
      title: 'Step 1: Create a WebApi Annotation',
      type: 'schema:WebAPI',
      annotation: null,
    },
    {
      title: 'Step 2: Create Action Annotation',
      type: 'schema:Action',
      annotation: null,
    },
  ];

  public async componentDidMount() {
    await this.context.vocab.addDefaultVocabs(
      'schema',
      'schema-pending',
      'webapi',
    );
    this.setState({ ready: true });
  }

  public toggleModal = () => {
    this.setState((state) => ({ modalIsOpen: !state.modalIsOpen }));
  };

  public finalize = () => {
    this.steps.forEach((step, i) => {
      const ele = document.getElementById(`annotation-${i}`);
      if (!ele) {
        return;
      }
      this.steps[i].annotation = generateJSONLD(ele);
    });
    this.setState({ modalIsOpen: true });
  };

  public nextStep = () => {
    this.setState((state) => {
      if (state.currentStep === this.steps.length - 1) {
        this.steps.push(clone(this.steps[this.steps.length - 1]));
      }
      return { currentStep: state.currentStep + 1 };
    });
  };
  public previousStep = () => {
    if (this.state.currentStep !== 0) {
      this.setState((state) => ({ currentStep: state.currentStep - 1 }));
    }
  };

  public render() {
    if (!this.state.ready) {
      return <h1>Loading ...</h1>;
    }
    return (
      <div>
        <section
          className="jumbotron text-center"
          style={{ backgroundColor: '#fff' }}
        >
          <div className="container">
            <h1 className="jumbotron-heading">
              Create your Semantic API Description
            </h1>
          </div>
        </section>
        <h4>
          {this.steps[this.state.currentStep].title}{' '}
          {this.state.currentStep > 0 && `(${this.state.currentStep})`}
        </h4>
        <br />
        <div>
          {this.steps.map((step, i) => (
            <div
              hidden={i !== this.state.currentStep}
              key={i}
              id={`annotation-${i}`}
            >
              <Annotation typeID={step.type} generateButton={false} />
            </div>
          ))}
          <div style={{ marginTop: '50px' }}>
            {this.state.currentStep > 0 && (
              <Button onClick={this.previousStep} color="primary">
                <FontAwesomeIcon icon={'angle-left'} size="lg" /> Previous
              </Button>
            )}
            &nbsp;&nbsp;
            <Button onClick={this.nextStep} color="primary">
              {this.state.currentStep === this.steps.length - 1 ? (
                <div>
                  New <FontAwesomeIcon icon={'plus'} size="lg" />
                </div>
              ) : (
                <div>
                  Next <FontAwesomeIcon icon={'angle-right'} size="lg" />
                </div>
              )}
            </Button>
            <Button
              onClick={this.finalize}
              color="success"
              className="float-right"
              size="lg"
            >
              Finalize
            </Button>
          </div>
        </div>
        <Modal
          isOpen={this.state.modalIsOpen}
          toggle={this.toggleModal}
          size="lg"
        >
          <ModalHeader toggle={this.toggleModal}>Your Annotations</ModalHeader>
          <ModalBody>
            <div className="row">
              {this.steps.map((step, i) => (
                <div className="col-md-6" style={{ padding: '3px' }} key={i}>
                  <pre
                    dangerouslySetInnerHTML={{
                      __html: syntaxHighlightJsonStr(
                        JSON.stringify(step.annotation, null, 2),
                      ),
                    }}
                    style={{
                      borderRadius: '4px',
                      border: '1px solid lightgrey',
                      fontSize: '13px',
                      padding: '10px',
                    }}
                  />
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={() => {
                copyStrIntoClipBoard(
                  JSON.stringify(this.steps.map((s) => s.annotation)),
                );
                toast.info('Copied');
              }}
            >
              <FontAwesomeIcon icon="copy" size="lg" /> Copy All
            </Button>{' '}
            <Button color="secondary" onClick={this.toggleModal}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
        <ToastContainer hideProgressBar={true} autoClose={3000} />
      </div>
    );
  }
}

export default AnnotationWebApi;
