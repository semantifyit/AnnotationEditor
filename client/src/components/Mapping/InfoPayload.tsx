import React from 'react';
import ButtonModal from './ButtonModal';

const InfoPayload = () => (
  <ButtonModal modalTitle="Info Payload" triggerType="icon">
    Add the payload / body the api expects. Use the input fields using the $ dot
    notation as explained in the general help section to denote input fields.
    <br />
    You may choose to change the syntax highlighting of the editor by changing
    the value to the right to some other serialization format. This however will
    not affect the actual request. Make sure to add the content-type of the
    request in the headers section.
  </ButtonModal>
);

export default InfoPayload;
