import React from 'react';
import ButtonModal from './ButtonModal';

const InfoPayloadResponse = () => (
  <ButtonModal modalTitle="Info Payload" triggerType="icon">
    Describe the response of the API in the editor. Then use the $ dot notation
    as described in the general info for the response to mark output fields on
    the Action annotation.
    <br />
    Dealing with arrays can be a little more complicated: when the response send
    back arrays only describe the first array element for your mapping. This
    mapping will then be executed for each element of the actual Array of the
    API response. You can also add different mappings for each individual
    element you expect from the API response Array, by simply writing a mapping
    for each element/index of the array.
    <br />
    The easiest way to make the mapping is just paste the whole response of the
    api in the editor and replace the values of the response with the $ dot
    notation path for the output properties of the Action. For arrays simply
    only keep the first element (but keep the brackets).
    <br /> Make sure to check out{' '}
    <a href="https://github.com/semantifyit/annotation-editor" target="_blank">
      github.com/semantifyit/annotation-editor
    </a>{' '}
    for some example response mappings.
    <br />
    Make sure to try out your response mapping!
  </ButtonModal>
);

export default InfoPayloadResponse;
