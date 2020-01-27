import React from 'react';
import classNames from 'classnames';

const CheckBox = ({
  id,
  name,
  checked,
  setChecked,
  className,
}: {
  id?: string;
  name?: string;
  checked: boolean;
  setChecked: (val: boolean) => void;
  className?: string;
}) => (
  // event handler on outer div, otherwise space between checkbox and lable not clickable
  <span className={classNames('pointerRec', className)} onClick={() => setChecked(!checked)}>
    <span className="d-inline custom-control custom-checkbox">
      <input type="checkbox" className="custom-control-input" id={id} checked={checked} onChange={() => {}} />
      <label className="custom-control-label">{name}</label>
    </span>
  </span>
);

export default CheckBox;
