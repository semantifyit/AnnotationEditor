import * as React from 'react';
import uuidv1 from 'uuid/v1';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ToastContainer, toast } from 'react-toastify';

import TypeNode from './TypeNode';
import { copyStrIntoClipBoard } from '../helpers/html';
import { generateJSONLD } from '../helpers/helper';
import { VocabContext } from '../helpers/VocabContext';
import JSONBox from './JSONBox';

interface IProps {
  typeIDs: { uid: string; node: string }[];
  generateButton: boolean;
  removeAnnotation?(uid: string): void;
  changedType?(newTypes: string[]): void;
}

interface IState {
  modalIsOpen: boolean;
}

class Annotations extends React.Component<IProps, IState> {
  public static contextType = VocabContext;
  public state: IState = {
    modalIsOpen: false,
  };

  public annotationUid = uuidv1();
  public baseUID = `baseid-${this.annotationUid}`;

  public jsonldResult: { jsonld: any; complete: boolean } = {
    jsonld: null,
    complete: false,
  };

  public createAnnotation = () => {
    this.jsonldResult = generateJSONLD(
      this.baseUID,
      '',
      this.props.typeIDs.length > 1,
    );
    this.setState({ modalIsOpen: true });
  };

  public toggleModal = () => {
    this.setState((state) => ({ modalIsOpen: !state.modalIsOpen }));
  };

  public render() {
    return (
      <div id={this.baseUID}>
        {this.props.typeIDs.map(({ node, uid }, i) => (
          <div key={uid}>
            <hr />
            {this.props.removeAnnotation && (
              <span
                className="float-right cursor-hand"
                title="Remove this annotation"
                onClick={() =>
                  this.props.removeAnnotation &&
                  this.props.removeAnnotation(uid)
                }
              >
                <FontAwesomeIcon icon="times" size="sm" />
              </span>
            )}
            <TypeNode
              nodeId={node}
              path={this.props.typeIDs.length > 1 ? [i.toString()] : []}
              canUseDashIOProps={false}
              changedType={this.props.changedType}
            />
          </div>
        ))}
        {this.props.generateButton && (
          <Button
            onClick={this.createAnnotation}
            color="primary"
            style={{ marginTop: '100px' }}
          >
            Generate
          </Button>
        )}
        <Modal isOpen={this.state.modalIsOpen} toggle={this.toggleModal}>
          <ModalHeader toggle={this.toggleModal}>Your Annotation</ModalHeader>
          <ModalBody>
            {!this.jsonldResult.complete && (
              <div className="alert alert-warning" role="alert">
                Some fields weren't filled in and thus don't appear in the
                annotation!
              </div>
            )}
            <JSONBox object={this.jsonldResult.jsonld} />
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={() => {
                copyStrIntoClipBoard(JSON.stringify(this.jsonldResult.jsonld));
                toast.info('Copied');
              }}
            >
              <FontAwesomeIcon icon="copy" size="lg" /> Copy
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

export default Annotations;
