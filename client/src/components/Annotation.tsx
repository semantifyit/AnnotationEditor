import * as React from 'react';
import TypeNode from './TypeNode';
import { set } from 'lodash';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { copyStrIntoClipBoard, syntaxHighlightJsonStr } from '../helpers/html';

interface IProps {
  typeID: string;
}

interface IState {
  modalIsOpen: boolean;
}

class Annotation extends React.Component<IProps, IState> {
  public state: IState = {
    modalIsOpen: false,
  };

  public jsonld = {};

  public generateJSONLD() {
    const jsonld = {
      '@context': {
        '@vocab': 'http://schema.org/',
        webapi: 'http://actions.semantify.it/vocab/',
      },
    };
    const terminals = document.querySelectorAll('[data-path]');
    terminals.forEach((t: HTMLElement) => {
      const { path, value } = t.dataset;
      if (path && value) {
        const schemaNSPath = path.replace(/schema:/g, '');
        const schemaNSValue = value.replace(/^schema:/g, '');
        set(jsonld, schemaNSPath, schemaNSValue);
      }
    });
    // console.log(JSON.stringify(jsonld, null, 2));
    this.jsonld = jsonld;
    this.setState({ modalIsOpen: true });
  }

  public toggleModal = () => {
    this.setState((state) => ({ modalIsOpen: !state.modalIsOpen }));
  };

  public render() {
    return (
      <div>
        <hr />
        <TypeNode
          nodeId={this.props.typeID}
          path={[]}
          canUseDashIOProps={false}
          key={this.props.typeID}
        />
        <Button
          onClick={() => this.generateJSONLD()}
          color="primary"
          style={{ marginTop: '100px' }}
        >
          Generate
        </Button>
        <Modal isOpen={this.state.modalIsOpen} toggle={this.toggleModal}>
          <ModalHeader toggle={this.toggleModal}>Your Annotation</ModalHeader>
          <ModalBody>
            <pre
              dangerouslySetInnerHTML={{
                __html: syntaxHighlightJsonStr(
                  JSON.stringify(this.jsonld, null, 2),
                ),
              }}
              style={{
                borderRadius: '4px',
                border: '1px solid lightgrey',
                fontSize: '13px',
                padding: '10px',
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={() => {
                copyStrIntoClipBoard(JSON.stringify(this.jsonld));
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

export default Annotation;
