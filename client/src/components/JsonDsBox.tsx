import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'brace';
import 'brace/mode/json';
import 'brace/theme/tomorrow';
import axios from 'axios';
import { toast } from 'react-toastify';
import { fetchPublicDS, IDSMap } from '../helpers/semantify';

interface IProps {
  onChange(val: string): void;
  value: string;
}

const JsonDsBox = (props: IProps) => {
  const [selectedDsId, setSelectedDsId] = useState('');
  const [jsonDsContent, setJsonDsContent] = useState(
    'No Domain Specification Selected',
  );
  const [dsList, setDsList] = useState<IDSMap[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const ds = await fetchPublicDS();
      setDsList(ds);
    };
    fetchData();
  }, []);

  const importClick = async () => {
    try {
      if (selectedDsId === '') {
        setJsonDsContent('No Domain Specification Selected');
        props.onChange('');
        return;
      }
      const selectedDS = dsList.find(({ id }) => id === selectedDsId);
      if (!selectedDS) {
        return;
      }
      const url = `https://semantify.it/api/domainSpecification/hash/${selectedDS.hash}`;
      const res = await axios.get(url);
      setJsonDsContent(JSON.stringify(res.data.content, null, 2));
      props.onChange(url);
    } catch (e) {
      toast.error(`Couldn't fetch domainspecification: ${e}`);
    }
  };

  return (
    <>
      Import Shacl from Semantify: <br />
      <br />
      <div className="input-group">
        <select
          className="custom-select"
          id="dsSelection"
          onChange={(e) => setSelectedDsId(e.target.value)}
          value={selectedDsId}
        >
          <option value="">Choose DS...</option>
          {dsList.map((ds) => (
            <option key={ds.id} value={ds.id} title={ds.description || ''}>
              {ds.name}
            </option>
          ))}
        </select>
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
      <br />
      <AceEditor
        mode={props.value === '' ? 'text' : 'json'}
        theme="tomorrow"
        name="jsondsbox"
        readOnly={true}
        editorProps={{ $blockScrolling: Infinity }}
        fontSize={14}
        width="100%"
        value={jsonDsContent}
      />
    </>
  );
};

export default JsonDsBox;
