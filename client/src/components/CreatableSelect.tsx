import React, { useState } from 'react';
import ReactCreatableSelect from 'react-select/creatable';

const components = {
  DropdownIndicator: null,
};

interface Option {
  value: string;
  label: string;
}

const createOption = (label: string): Option => ({
  label,
  value: label,
});

const CreatableSelect = ({
  values,
  onChange,
  className,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleChange = (newValues: Option[] | null, actionMeta: any) => {
    onChange(newValues?.map(({ value }) => value) ?? []);
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
  };

  const handleKeyDown = (event: any) => {
    if (!inputValue) return;
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        setInputValue('');
        onChange([...values, inputValue]);
        event.preventDefault();
    }
  };

  return (
    <ReactCreatableSelect
      className={className}
      components={components}
      inputValue={inputValue}
      isClearable
      isMulti
      menuIsOpen={false}
      onChange={handleChange as any}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      placeholder="use enter/tab to create ..."
      value={values.map(createOption)}
    />
  );
};

export default CreatableSelect;
