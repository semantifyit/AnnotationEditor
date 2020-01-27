import React, { useState, PropsWithChildren } from 'react';
import Modal from 'react-bootstrap/Modal';
import classNames from 'classnames';

type Props = PropsWithChildren<{
  btnText?: string;
  btnChildren?: () => JSX.Element;
  btnClassName?: string;
  modalTitle: string;
}>;

const ModalBtn = ({ btnText, btnChildren, btnClassName, modalTitle, children }: Props) => {
  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  return (
    <>
      <button className={classNames('btn', btnClassName)} onClick={handleShow}>
        {btnChildren && btnChildren()}
        {btnText}
      </button>

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
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
