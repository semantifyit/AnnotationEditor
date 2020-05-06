import React, { useState, PropsWithChildren } from 'react';
import Modal, { ModalProps } from 'react-bootstrap/Modal';
import classNames from 'classnames';

type Props = PropsWithChildren<{
  btnContent?: string | (() => JSX.Element);
  btnClassName?: string;
  btnStyle?: Record<string, string>;
  btnTitle?: string;
  modalTitle: string | (() => JSX.Element);
  modalSize?: ModalProps['size'];
  modalAnimation?: ModalProps['animation'];
}>;

const ModalBtn = ({
  btnContent,
  btnClassName,
  btnStyle,
  btnTitle,
  modalTitle,
  modalSize,
  modalAnimation,
  children,
}: Props) => {
  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  return (
    <>
      <button
        className={classNames('btn', btnClassName)}
        onClick={handleShow}
        title={btnTitle}
        style={btnStyle}
      >
        {typeof btnContent === 'string' ? btnContent : btnContent?.()}
      </button>

      <Modal show={showModal} onHide={handleClose} size={modalSize} animation={modalAnimation}>
        <Modal.Header closeButton>
          <Modal.Title>{typeof modalTitle === 'string' ? modalTitle : modalTitle?.()}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{children}</Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary float-right" onClick={handleClose}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ModalBtn;
