import React from 'react';
import uuid from 'uuid';

const Radio = ({
  name,
  checked,
  onChange,
  disabled,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
}) => {
  const id = uuid();
  return (
    <div className="custom-control custom-radio custom-control-inline">
      <input
        type="radio"
        id={id}
        name={id}
        className="custom-control-input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <label className="custom-control-label" htmlFor={id}>
        {name}
      </label>
    </div>
  );
};

export default Radio;
