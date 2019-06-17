import * as React from 'react';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ToastContainer } from 'react-toastify';

import Annotations from './Annotations';
import SaveAnnotationsWebApi from './SaveAnnotationsWebApi';
import { generateJSONLD, removeNS } from '../helpers/helper';
import { clone } from '../helpers/util';
import { VocabContext, IContext } from '../helpers/VocabContext';
import * as p from '../helpers/properties';
import Mapping from './Mapping/Mapping';
import { removeNSFromJSONLD } from '../helpers/rdf';

interface IState {
  ready: boolean;
  currentStep: number;
  showMapping: boolean;
}

class AnnotationWebApi extends React.Component<{}, IState> {
  public static contextType = VocabContext;
  public context: IContext;
  public state: IState = {
    ready: false,
    currentStep: 0,
    showMapping: false,
  };

  public steps = [
    {
      title: 'Step 1: Create a WebApi Annotation',
      type: p.schemaWebAPI,
      typeTitle: p.schemaWebAPI,
      annotationResult: { jsonld: null, complete: false },
    },
    {
      title: 'Step 2: Create Action Annotation',
      type: p.schemaAction,
      typeTitle: p.schemaAction,
      annotationResult: { jsonld: null, complete: false },
      mapping: {},
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

  public validAnnCompleteConfirmation = (): boolean => {
    const currentAnnotationIsComplete = generateJSONLD(
      `annotation-${this.state.currentStep}`,
    ).complete;
    if (!currentAnnotationIsComplete) {
      return window.confirm(
        'Your annotation has some empty fields, are you sure you want to continue?',
      );
    }
    return true;
  };

  public nextStep = () => {
    if (!this.validAnnCompleteConfirmation()) {
      return;
    }
    this.setState((state) => {
      if (state.currentStep === this.steps.length - 1) {
        this.steps.push(clone(this.steps[this.steps.length - 1]));
      }
      return { currentStep: state.currentStep + 1, showMapping: false };
    });
  };
  public previousStep = () => {
    if (this.state.currentStep !== 0) {
      this.setState((state) => ({
        currentStep: state.currentStep - 1,
        showMapping: false,
      }));
    }
  };

  public moveToStep = (step: number) => {
    if (!this.validAnnCompleteConfirmation()) {
      return;
    }
    this.setState({ currentStep: step, showMapping: false });
  };

  public annChangeType = (types: string[]) => {
    this.steps[this.state.currentStep].typeTitle = types.join(', ');
    this.forceUpdate(); // since steps aren't in the state (they probably should be)
  };

  public toggleShowMapping = async () => {
    if (!this.state.showMapping) {
      this.steps[this.state.currentStep].annotationResult = generateJSONLD(
        `annotation-${this.state.currentStep}`,
      );
      this.steps[
        this.state.currentStep
      ].annotationResult.jsonld = await removeNSFromJSONLD(
        this.steps[this.state.currentStep].annotationResult.jsonld,
        {
          '@vocab': 'http://schema.org/',
          smtfy: 'https://actions.semantify.it/vocab/',
        },
      );
    }
    this.setState((state) => ({ showMapping: !state.showMapping }));
  };

  public render() {
    if (!this.state.ready) {
      return <h1>Loading ...</h1>;
    }
    const progress = ((this.state.currentStep + 1) / this.steps.length) * 100;
    return (
      <div>
        {!this.state.showMapping && (
          <>
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
            {this.steps.map(({ typeTitle }, i) => {
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
                  href="/"
                  className="cursor-hand"
                  style={style}
                  onClick={(e) => {
                    e.preventDefault();
                    this.moveToStep(i);
                  }}
                >
                  {`${i + 1}: ${typeTitle
                    .split(', ')
                    .map((t) => removeNS(t))
                    .join(', ')}`}
                </a>
              );
            })}
            <br />
          </>
        )}
        {this.steps.map((step, i) => (
          <div
            hidden={i !== this.state.currentStep}
            key={i}
            id={`annotation-${i}`}
          >
            {step.type === p.schemaAction && (
              <Button
                color="info"
                className="float-right"
                style={{ marginTop: '5px' }}
                onClick={this.toggleShowMapping}
                title="Add a mapping for the Action (advanced)"
              >
                {this.state.showMapping ? 'Back' : 'Set mapping'}
              </Button>
            )}
            <div hidden={!this.state.showMapping}>
              <Mapping
                annotation={step.annotationResult.jsonld || {}}
                domIdPrefix={`annotation-${i}`}
              />
            </div>
            <div hidden={this.state.showMapping}>
              <Annotations
                typeIDs={[{ node: step.type, uid: '' }]}
                generateButton={false}
                changedType={this.annChangeType}
              />
            </div>
          </div>
        ))}
        {!this.state.showMapping && (
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
            <div className="float-right">
              <SaveAnnotationsWebApi
                isDisabled={this.state.currentStep !== this.steps.length - 1}
                annotationDOMIds={this.steps.map((_, i) => `annotation-${i}`)}
              />
            </div>
          </div>
        )}
        <ToastContainer hideProgressBar={true} autoClose={3000} />
      </div>
    );
  }
}

export default AnnotationWebApi;
