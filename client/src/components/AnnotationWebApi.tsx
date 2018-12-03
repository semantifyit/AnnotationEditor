import * as React from 'react';

import { generateJSONLD, removeNS } from '../helpers/helper';
import Annotations from './Annotations';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { copyStrIntoClipBoard, syntaxHighlightJsonStr } from '../helpers/html';
import { toast, ToastContainer } from 'react-toastify';
import { clone } from '../helpers/util';
import { VocabContext, IContext } from '../helpers/VocabContext';
import * as p from '../helpers/properties';

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
      type: p.schemaWebAPI,
      annotationResult: { jsonld: null, complete: false },
    },
    {
      title: 'Step 2: Create Action Annotation',
      type: p.schemaAction,
      annotationResult: { jsonld: null, complete: false },
    },
  ];

  public async componentDidMount() {
    await this.context.vocab.setDefaultVocabs(
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
      this.steps[i].annotationResult = generateJSONLD(`annotation-${i}`);
    });
    this.setState({ modalIsOpen: true });
  };

  public nextStep = () => {
    const currentAnnotationIsComplete = generateJSONLD(
      `annotation-${this.state.currentStep}`,
    ).complete;
    if (!currentAnnotationIsComplete) {
      const proceed = confirm(
        'Your annotation has some empty fields, are you sure you want to continue?',
      );
      if (!proceed) {
        return;
      }
    }
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

  public moveToStep = (step: number) => {
    this.setState({ currentStep: step });
  };

  public render() {
    if (!this.state.ready) {
      return <h1>Loading ...</h1>;
    }
    const progress = ((this.state.currentStep + 1) / this.steps.length) * 100;
    return (
      <div>
        <section className="jumbotron text-center">
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
        <div className="progress">
          <div
            className="progress-bar progress-bar-striped"
            role="progressbar"
            style={{
              width: `${progress}%`,
            }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <br />
        {this.steps.map(({ type }, i) => {
          const style: any = {
            marginRight: '40px',
            fontSize: '1.3em',
          };
          if (this.state.currentStep === i) {
            style.backgroundColor = 'rgb(194, 216, 252)';
          }
          return (
            <a
              key={i}
              href="#"
              className="cursor-hand"
              style={style}
              onClick={(e) => {
                e.preventDefault();
                this.moveToStep(i);
              }}
            >
              {`${i + 1}:${removeNS(type)}`}
            </a>
          );
        })}
        <br />
        <div>
          {this.steps.map((step, i) => (
            <div
              hidden={i !== this.state.currentStep}
              key={i}
              id={`annotation-${i}`}
            >
              <Annotations
                typeIDs={[{ node: step.type, uid: '' }]}
                generateButton={false}
              />
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
              disabled={this.state.currentStep !== this.steps.length - 1}
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
            {this.steps.some(
              ({ annotationResult }) => !annotationResult.complete,
            ) && (
              <div className="alert alert-warning" role="alert">
                Some annotations are incomplete!
              </div>
            )}
            <div className="row">
              {this.steps.map((step, i) => (
                <div className="col-md-6" style={{ padding: '3px' }} key={i}>
                  <pre
                    dangerouslySetInnerHTML={{
                      __html: syntaxHighlightJsonStr(
                        JSON.stringify(step.annotationResult.jsonld, null, 2),
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
                  JSON.stringify(
                    this.steps.map((s) => s.annotationResult.jsonld),
                  ),
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
