import React from 'react';
import classNames from 'classnames';
import uuid from 'uuid';

const Switch = ({
  name,
  checked,
  setChecked,
  className,
  title,
}: {
  name?: string;
  checked: boolean;
  setChecked: (val: boolean) => void;
  className?: string;
  title?: string;
}) => {
  const id = uuid();
  return (
    <div className={classNames('custom-control custom-switch mb-2', className)} title={title}>
      <input
        type="checkbox"
        className="custom-control-input"
        id={id}
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
      <label className="custom-control-label" htmlFor={id}>
        {name}
      </label>
    </div>
  );
};

export default Switch;
