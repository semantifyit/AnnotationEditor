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

interface IProps {
  reloadClick(): void;
}

interface IState {
  isOpen: boolean;
  filename: string | null;
  currentVocabs: string[];
}

class VocabSelection extends React.Component<IProps, IState> {
  public state: IState = {
    isOpen: false,
    filename: null,
    currentVocabs: getCurrentVocabs(),
  };

  public initialVocabSelection = clone(this.state.currentVocabs);

  public fileUploadVocab: any;

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
        this.fileUploadVocab = json;
      } catch (e) {
        alert("Couldn't parse file! Is it not json?");
      }
    })(reader);
    reader.readAsText(fileSource);
    this.setState({ filename: fileSource.name });
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
    if (this.fileUploadVocab && this.fileUploadVocab['@graph']) {
      addVocab(cleanVocab(this.fileUploadVocab['@graph']));
    }
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
                  <span>Add additional vocabulary:</span>
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
                  <div style={{ marginTop: '10px' }}>
                    <Button
                      outline={true}
                      color="primary"
                      disabled={
                        arraysAreEquals(
                          this.initialVocabSelection,
                          this.state.currentVocabs,
                        ) && !this.state.filename
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
      </Manager>
    );
  }
}

export default VocabSelection;
