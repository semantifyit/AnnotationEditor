import React, { useState } from 'react';
import ky from 'ky';

import { VocabLeanDoc as Vocab } from '../../../../server/src/models/Vocab';
import Editor from '../Editor';

interface Props {
  addVocab: (vocab: Vocab) => void;
}
type ImportType = 'url' | 'file' | 'semantify';

const AddVocab = ({ addVocab }: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [importType, setImportType] = useState<ImportType>('file');
  const [message, setMessage] = useState<['danger' | 'success', string | undefined]>(['danger', undefined]);
  const [finalMessage, setFinalMessage] = useState<['danger' | 'success', string | undefined]>([
    'danger',
    undefined,
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [url, setUrl] = useState('');
  const [vocabContent, setVocabContent] = useState('');

  const setError = (e: string) => setMessage(['danger', e]);
  const setSuccess = (e: string) => setMessage(['success', e]);

  const submitDisabled = name === '' || vocabContent === '';

  const types: ImportType[] = ['file', 'url', 'semantify'];

  const addVocabClick = async () => {
    try {
      setIsLoading(true);
      const result = await ky
        .post('/api/vocab', {
          json: { name, description: description !== '' ? description : undefined, ogVocab: vocabContent },
        })
        .json();

      setIsLoading(false);
      setFinalMessage(['success', 'Successfully addded vocabulary, you may close this window']);
      addVocab(result as Vocab);
    } catch (e) {
      setFinalMessage(['danger', `Some error happened during the upload: ${e.toString()}`]);
    }
  };

  const onFileLoad = (event: React.ChangeEvent<any>) => {
    if (event.target.files.length !== 1 || !event.target.files[0].name.match('^(.*.json.*|.*.ttl)$')) {
      setError('Only accepts filetypes: .json, .jsonld, .tll');
      return;
    }
    const fileSource = event.target.files[0];
    const reader = new FileReader();
    reader.onload = ((file: any) => () => {
      setSuccess('Loaded from file');
      if (name === '') {
        setName(fileSource.name);
      }
      setVocabContent(file.result);
    })(reader);
    reader.readAsText(fileSource);
  };

  const loadUrl = async () => {
    try {
      const resp = await ky.get(url).text();
      setSuccess('Loaded from url');
      if (name === '') {
        setName(url);
      }
      setVocabContent(resp);
    } catch (e) {
      setError(e.toString());
    }
  };

  const getContentInput = () => {
    switch (importType) {
      case 'file':
        return (
          <div className="custom-file" key="file">
            <input
              type="file"
              className="custom-file-input"
              id="vocabFile"
              accept=".json,.jsonld,.ttl"
              onChange={onFileLoad}
            />
            <label className="custom-file-label" htmlFor="vocabFile">
              Choose file
            </label>
          </div>
        );
      case 'url':
        return (
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Url"
              aria-label="Url"
              aria-describedby="vocabLoadUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="input-group-append">
              <button className="btn btn-outline-secondary" type="button" id="vocabLoadUrl" onClick={loadUrl}>
                Load
              </button>
            </div>
          </div>
        );
      case 'semantify':
        return <h5>Coming soon ...</h5>;
      default:
        return <h1>Err</h1>;
    }
  };

  return (
    <>
      <div className="form-group">
        <label htmlFor="vocabName">Name</label>
        <input
          type="text"
          className="form-control"
          id="vocabName"
          placeholder="vocab name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="vocabDesc">Description</label>
        <textarea
          className="form-control"
          id="vocabDesc"
          rows={2}
          placeholder="short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
      </div>
      <div className="d-flex flexSpaceBetween mb-2">
        <span>Import from source</span>
        <span>
          {types.map((radioName, i) => (
            <div className="custom-control custom-radio custom-control-inline" key={radioName}>
              <input
                type="radio"
                id={`vocabradio${i}`}
                name={`vocabradio${i}`}
                className="custom-control-input"
                value={radioName}
                checked={importType === radioName}
                onChange={() => setImportType(radioName)}
              />
              <label
                className="custom-control-label"
                htmlFor={`vocabradio${i}`}
                style={{ textTransform: 'capitalize' }}
              >
                {radioName}
              </label>
            </div>
          ))}
        </span>
      </div>
      {message[1] && (
        <div className={`alert alert-${message[0]} my-2`} role="alert">
          {message[1]}
        </div>
      )}
      {getContentInput()}
      <div className="my-2">
        Content:
        <Editor mode="text" value={vocabContent} setValue={(val) => setVocabContent(val)} />
      </div>

      <button
        type="submit"
        className="btn btn-primary mt-2"
        onClick={addVocabClick}
        disabled={submitDisabled || isLoading}
        title={submitDisabled ? 'Add a name and vocab content' : 'Add vocabulary'}
      >
        Add Vocab
      </button>
      {isLoading && (
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      )}
      <br />
      {finalMessage[1] && (
        <div className={`alert alert-${finalMessage[0]} my-2`} role="alert">
          {finalMessage[1]}
        </div>
      )}
    </>
  );
};
export default AddVocab;
