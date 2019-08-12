import React from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SizeProp } from '@fortawesome/fontawesome-svg-core';

interface IProps {
  modalTitle: string;
  triggerType: 'icon' | 'button';
  btnSize?: SizeProp;
  btnColor?: string;
  btnTitle?: string;
  disabled?: boolean;
  tooltip?: string;
  unmountOnClose?: boolean;
}

interface IState {
  modalOpen: boolean;
}

class ButtonModal extends React.Component<IProps, IState> {
  public state: IState = {
    modalOpen: false,
  };

  public toggleModal = () => {
    this.setState((state) => ({
      modalOpen: !state.modalOpen,
    }));
  };

  public render() {
    return (
      <>
        {this.props.triggerType === 'button' ? (
          <Button
            title={this.props.tooltip || ''}
            color={this.props.btnColor || 'primary'}
            size={this.props.btnSize || 'md'}
            onClick={this.toggleModal}
            disabled={this.props.disabled}
          >
            {this.props.btnTitle}
          </Button>
        ) : (
          <span className="cursor-hand" onClick={this.toggleModal}>
            <FontAwesomeIcon
              className="cursor-hand"
              icon="info-circle"
              size={this.props.btnSize || 'sm'}
              color={this.props.btnColor || 'lightblue'}
            />
          </span>
        )}

        <Modal
          isOpen={this.state.modalOpen}
          toggle={this.toggleModal}
          size="lg"
          unmountOnClose={
            this.props.unmountOnClose === undefined
              ? true
              : this.props.unmountOnClose
          } // cannot do "||" since allow false
        >
          <ModalHeader toggle={this.toggleModal}>
            {this.props.modalTitle}
          </ModalHeader>
          <ModalBody>{this.props.children}</ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={this.toggleModal}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default ButtonModal;
