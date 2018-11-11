import * as React from 'react';
import { Manager, Reference, Popper } from 'react-popper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  addVocab,
  availableVocabs,
  cleanVocab,
  fetchVocabs,
  getCurrentVocabs,
} from '../helpers/vocabs';
import { Button } from 'reactstrap';
import { arraysAreEquals, clone } from '../helpers/helper';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';

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
  public state: IState = {
    isOpen: false,
    filename: null,
    currentVocabs: getCurrentVocabs(),
    vocabUrl: '',
    fileUploadVocab: [],
  };

  public initialVocabSelection = clone(this.state.currentVocabs);

  public fileUpload = (e: React.ChangeEvent<any>) => {
    if (
      e.target.files.length !== 1 ||
      !e.target.files[0].name.match('.*.json.*')
    ) {
      return;
    }
    const fileSource = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ((file: any) => () => {
      try {
        const json = JSON.parse(file.result);
        this.setState((state) => ({
          fileUploadVocab: state.fileUploadVocab.concat({
            data: json,
            name: file.name,
          }),
        }));
        toast.info('Added vocab, make sure to reload!');
      } catch (e) {
        alert("Couldn't parse file! Is it not json?");
      }
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
      toast.info('Added vocab, make sure to reload!');
      this.setState((state) => ({
        fileUploadVocab: state.fileUploadVocab.concat({
          data: response.data,
          name: url,
        }),
      }));
    } catch (e) {
      toast.error(`Couldn't fetch vocab:
      ${e}`);
    }
  };

  public toggleOpen = () => {
    this.setState((state) => ({ isOpen: !state.isOpen }));
  };

  public switchVocab = (name: string) => {
    this.setState((state) => {
      if (state.currentVocabs.includes(name)) {
        return { currentVocabs: state.currentVocabs.filter((n) => n !== name) };
      }
      return { currentVocabs: state.currentVocabs.concat(name) };
    });
  };

  public reloadClick = async () => {
    await fetchVocabs(...this.state.currentVocabs);
    this.state.fileUploadVocab
      .filter(({ data }) => data['@graph'])
      .forEach(({ data }) => {
        addVocab(cleanVocab(data['@graph']));
      });

    this.props.reloadClick();
    this.setState({ isOpen: false });
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
                  {Object.entries(availableVocabs).map(([name, desc], i) => (
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
                      accept=".json,.jsonld"
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
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div style={{ marginTop: '10px' }}>
                    <Button
                      outline={true}
                      color="primary"
                      disabled={
                        arraysAreEquals(
                          this.initialVocabSelection,
                          this.state.currentVocabs,
                        ) && this.state.fileUploadVocab.length === 0
                      } // to boolean
                      onClick={this.reloadClick}
                    >
                      <FontAwesomeIcon icon="sync-alt" size="lg" /> Reload
                    </Button>
                  </div>
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
