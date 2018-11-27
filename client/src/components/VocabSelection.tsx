import * as React from 'react';
import { Manager, Reference, Popper } from 'react-popper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';

import { defaultVocabs } from '../helpers/Vocab';
import { clone } from '../helpers/util';
import { VocabContext, IContext } from '../helpers/VocabContext';

interface IProps {
  reloadClick(): void;
}

interface IFile {
  name: string;
  data: any;
}

interface IState {
  isOpen: boolean;
  filename: string | null;
  currentVocabs: string[];
  vocabUrl: string;
  fileUploadVocab: IFile[];
}

class VocabSelection extends React.Component<IProps, IState> {
  public static contextType = VocabContext;
  public context: IContext;
  public state: IState = {
    isOpen: false,
    filename: null,
    currentVocabs: this.context.vocab.getCurrentVocabs(),
    vocabUrl: '',
    fileUploadVocab: [],
  };

  public initialVocabSelection = clone(this.state.currentVocabs);

  public fileUpload = (e: React.ChangeEvent<any>) => {
    if (
      e.target.files.length !== 1 ||
      !e.target.files[0].name.match('^(.*.json.*|.*.ttl)$')
    ) {
      toast.error('Only accepts filetypes: .json, .jsonld, .tll');
      return;
    }
    const fileSource = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ((file: any) => async () => {
      this.setState((state) => ({
        fileUploadVocab: state.fileUploadVocab.concat({
          data: file.result,
          name: fileSource.name,
        }),
      }));
      const result = await this.context.vocab.addVocab(
        fileSource.name,
        file.result,
      );
      if (result !== true) {
        toast.error(`Error parsing the vocab:\n${name}`);
        return;
      }
      this.props.reloadClick();
      toast.info('Added vocab!');
    })(reader);
    reader.readAsText(fileSource);
    this.setState({ filename: fileSource.name });
  };

  public addVocabFromUrl = async () => {
    try {
      const url = this.state.vocabUrl;
      if (!url) {
        return;
      }
      const response = await axios.get(url);
      this.setState((state) => ({
        fileUploadVocab: state.fileUploadVocab.concat({
          data: response.data,
          name: url,
        }),
      }));
      const result = await this.context.vocab.addVocab(url, response.data);
      if (result !== true) {
        toast.error(`Error parsing the vocab:\n${url}`);
        return;
      }
      this.props.reloadClick();
      toast.info('Added vocab!');
    } catch (e) {
      toast.error(`Couldn't fetch vocab:
      ${e}`);
    }
  };

  public toggleOpen = () => {
    this.setState((state) => ({ isOpen: !state.isOpen }));
  };

  public switchVocab = async (name: string) => {
    this.setState((state) => {
      const newDefaultVocabList = state.currentVocabs.includes(name)
        ? state.currentVocabs.filter((n) => n !== name)
        : state.currentVocabs.concat(name);
      // don't wanna make the setState async
      this.context.vocab
        .setDefaultVocabs(...newDefaultVocabList)
        .then(() => this.props.reloadClick());
      return { currentVocabs: newDefaultVocabList };
    });
  };

  public removeVocab = (nameToRemove: string) => {
    this.setState((state) => ({
      fileUploadVocab: state.fileUploadVocab.filter(
        ({ name }) => name !== nameToRemove,
      ),
    }));
    this.context.vocab.removeVocab(nameToRemove);
    this.props.reloadClick();
  };

  public render() {
    return (
      <Manager>
        <Reference>
          {({ ref }: { ref: any }) => (
            <span
              ref={ref}
              onClick={this.toggleOpen}
              style={{ cursor: 'pointer', paddingLeft: '5px' }}
            >
              <FontAwesomeIcon
                icon={this.state.isOpen ? 'angle-up' : 'angle-down'}
                size="lg"
              />
            </span>
          )}
        </Reference>
        {this.state.isOpen && (
          <Popper placement="bottom-end">
            {({
              ref,
              style,
              placement,
            }: {
              ref: any;
              style: any;
              placement: any;
            }) => (
              <div
                ref={ref}
                style={{
                  ...style,
                  zIndex: 100,
                  width: '320px',
                  border: '1px solid lightgrey',
                  borderRadius: '5px',
                  marginLeft: '10px',
                  padding: '10px',
                  background: 'white',
                }}
                data-placement={placement}
              >
                <div>
                  <span>Choose schema.org vocabularies:</span>
                  {Object.entries(defaultVocabs).map(([name, desc], i) => (
                    <div className="form-check" key={i}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`checkbox-${i}`}
                        checked={this.state.currentVocabs.includes(name)}
                        onChange={() => this.switchVocab(name)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`checkbox-${i}`}
                      >
                        {desc}
                      </label>
                    </div>
                  ))}
                  <hr />
                  <h6>Add additional vocabulary</h6>
                  <span>via file upload:</span>
                  <div className="custom-file">
                    <input
                      type="file"
                      className="custom-file-input"
                      id="customFile"
                      accept=".json,.jsonld,.ttl"
                      onChange={this.fileUpload}
                    />
                    <label className="custom-file-label" htmlFor="customFile">
                      {this.state.filename || 'Choose file'}
                    </label>
                  </div>
                  <br />
                  <span>via url:</span>
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="URL"
                      value={this.state.vocabUrl}
                      onChange={(e) =>
                        this.setState({ vocabUrl: e.target.value })
                      }
                    />
                    <div className="input-group-append">
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={this.addVocabFromUrl}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  {this.state.fileUploadVocab.length > 0 && (
                    <div>
                      Added vocabs:
                      <ul>
                        {this.state.fileUploadVocab.map(({ name }, i) => (
                          <li key={i} style={{ wordWrap: 'break-word' }}>
                            {name}{' '}
                            <span
                              onClick={() => this.removeVocab(name)}
                              className="cursor-hand"
                            >
                              <FontAwesomeIcon
                                icon="times"
                                size="sm"
                                color="red"
                              />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Popper>
        )}
        <ToastContainer hideProgressBar={true} autoClose={3000} />
      </Manager>
    );
  }
}

export default VocabSelection;
