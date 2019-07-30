import React, { useState } from 'react';
import AceEditor from 'react-ace';
import 'brace';
import 'brace/mode/json';
import 'brace/snippets/json';
import 'brace/theme/tomorrow';
import 'brace/ext/language_tools';
import axios from 'axios';
import { toast } from 'react-toastify';

interface IProps {
  onChange(val: string): void;
  value: string;
}

const JsonDsBox = (props: IProps) => {
  const [dsHash, setDsHash] = useState('');

  const importClick = async () => {
    try {
      const res = await axios.get(
        `https://semantify.it/api/domainSpecification/hash/${dsHash}`,
      );
      props.onChange(JSON.stringify(res.data.content, null, 4));
    } catch (e) {
      toast.error(`Couldn't fetch domainspecification: ${e}`);
    }
  };

  return (
    <>
      Import Shacl from Semantify: <br />
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Domainspecification Hash"
          value={dsHash}
          onChange={(e) => setDsHash(e.target.value)}
        />
        <div className="input-group-append">
          <button
            className="btn btn-outline-primary"
            type="button"
            onClick={importClick}
          >
            Import
          </button>
        </div>
      </div>
      <AceEditor
        mode="json"
        theme="tomorrow"
        name="jsondsbox"
        onChange={props.onChange}
        editorProps={{ $blockScrolling: Infinity }}
        fontSize={14}
        setOptions={{ enableSnippets: true }}
        width="100%"
        value={props.value}
        enableBasicAutocompletion={true}
      />
    </>
  );
};

export default JsonDsBox;
