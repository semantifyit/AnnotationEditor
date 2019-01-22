import * as React from 'react';
import axios from 'axios';
import {
  Button,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';

import {
  ISemantifyUser,
  ISemantifyWebsite,
  loginSemantifyUser,
  saveAnnToSemantifyWebsite,
} from '../helpers/semantify';
import { generateJSONLD, getMappings } from '../helpers/helper';
import { copyStrIntoClipBoard, downloadContent } from '../helpers/html';
import {
  getSemantifyDefaultWebsite,
  getSemantifyUser,
  removeSemantifyDefaultWebsite,
  removeSemantifyUser,
  setSemantifyDefaultWebsite,
  setSemantifyUser,
} from '../helpers/storage';
import JSONBox from './JSONBox';

interface IProps {
  isDisabled: boolean;
  annotationDOMIds: string[];
}

interface IState {
  showLoginFields: boolean;
  showLoginBtn: boolean;
  showWebsiteList: boolean;
  modalIsOpen: boolean;
  chosenWebsite: string;
  savedAnnotationsSemantifyUids: string[];
  annotations: { jsonld: any; complete: boolean }[];
  mappings: { requestMapping: object; responseMapping: object }[];
  availableSemantifyWebsites: ISemantifyWebsite[];
  semantifyUser: ISemantifyUser | undefined;
  username: string;
  password: string;
}

class SaveAnnotationsWebApi extends React.Component<IProps, IState> {
  public state: IState = {
    chosenWebsite: '',
    showLoginFields: false,
    showWebsiteList: false,
    showLoginBtn: true,
    modalIsOpen: false,
    savedAnnotationsSemantifyUids: [],
    annotations: [],
    mappings: [],
    availableSemantifyWebsites: [],
    semantifyUser: getSemantifyUser(),
    username: '',
    password: '',
  };

  // website set -> save to website & show logout
  // secret set -> show list of websites & show logout
  // nothing set -> save to default & show login
  public saveAnnotations = async () => {
    // TODO save all actions as 1 annotation
    // const annToSend = [allAnn[0], allAnn.slice(1)];
    const annToSend = this.state.annotations.map((ann) => ann.jsonld);
    const semantifyUser = getSemantifyUser();
    let websiteToSendTo;
    if (semantifyUser) {
      const website = getSemantifyDefaultWebsite();
      if (website) {
        websiteToSendTo = website;
      } else {
        return;
      }
    }
    const uids = await saveAnnToSemantifyWebsite(annToSend, websiteToSendTo);
    if (!uids) {
      toast.error('Failed saving annotations to semantify.it!');
    } else {
      toast.success('Saved annotations!');
      this.setState({
        savedAnnotationsSemantifyUids: uids,
        showWebsiteList: false,
        showLoginBtn: !semantifyUser, // show login if there isn't any user logged in
        showLoginFields: false,
      });
    }
  };

  public toggleModal = () => {
    this.setState((state) => ({
      modalIsOpen: !state.modalIsOpen,
      savedAnnotationsSemantifyUids: [], // reset saved annotation list
    }));
  };

  public finalize = () => {
    const annotationsResults = this.props.annotationDOMIds.map((id) =>
      generateJSONLD(id),
    );
    const mappings = getMappings(this.props.annotationDOMIds.slice(1)); // webapi doesn't have a mapping
    this.setState({
      modalIsOpen: true,
      annotations: annotationsResults,
      mappings,
    });
  };

  public loginClick = async () => {
    if (this.state.showLoginFields) {
      const { username, password } = this.state;
      if (username !== '' && password !== '') {
        const resp = await loginSemantifyUser(username, password);
        if (!resp) {
          toast.error('Failed login in!');
          return;
        }
        toast.success('Logged in successfully!');
        setSemantifyUser({ username: resp.username, token: resp.token });
        this.setState({
          showLoginFields: false,
          showLoginBtn: false,
          showWebsiteList: true,
          semantifyUser: { username: resp.username, token: resp.token },
          availableSemantifyWebsites: resp.websiteList,
        });
      } else {
        toast.info('Please fill in your username and password');
      }
    } else {
      this.setState({ showLoginFields: true });
    }
  };

  public logoutClick = () => {
    removeSemantifyUser();
    removeSemantifyDefaultWebsite();
    this.setState({ showLoginBtn: true });
  };

  public downloadMapping = async () => {
    // {
    //   url: '/annotation/api/downloadWebAPIProjectZip',
    //     method: 'POST',
    //   responseType: 'blob',
    // }

    const resp = await axios({
      url: '/annotation/api/downloadWebAPIProjectZip',
      method: 'POST',
      responseType: 'blob',
      data: {
        webAPI: this.state.annotations[0].jsonld,
        actions: this.state.annotations.slice(1).map(({ jsonld }, i) => ({
          id: i,
          requestMapping: this.state.mappings[i].requestMapping,
          responseMapping: this.state.mappings[i].responseMapping,
        })),
      },
    });
    // console.log(resp);
    downloadContent(resp.data, 'action-server-nodejs.zip');
  };

  public render() {
    const semantifyUser = getSemantifyUser();
    const semantifyWebsite = getSemantifyDefaultWebsite();
    return (
      <div>
        <Button
          onClick={this.finalize}
          color="success"
          size="lg"
          disabled={this.props.isDisabled}
        >
          Finalize
        </Button>
        <Modal
          isOpen={this.state.modalIsOpen}
          toggle={this.toggleModal}
          size="lg"
        >
          <ModalHeader toggle={this.toggleModal}>Your Annotations</ModalHeader>
          <ModalBody>
            {this.state.annotations.some((ann) => !ann.complete) && (
              <div className="alert alert-warning" role="alert">
                Some annotations are incomplete!
              </div>
            )}
            <div className="row">
              {this.state.annotations.map((ann, i) => (
                <div className="col-md-6" style={{ padding: '3px' }} key={i}>
                  <JSONBox object={ann.jsonld} />
                </div>
              ))}
            </div>
            {this.state.savedAnnotationsSemantifyUids.length > 0 && (
              <div>
                <hr />
                <h4>
                  Saved Annotations to{' '}
                  <a href="https://semantify.it" target="_blank">
                    Semantify
                  </a>
                  !
                </h4>
                Your annotations:
                <ul>
                  {this.state.savedAnnotationsSemantifyUids.map((uid, i) => (
                    <li key={i}>
                      <a href={`https://smtfy.it/${uid}`} target="_blank">
                        {`https://smtfy.it/${uid}`}
                      </a>
                    </li>
                  ))}
                </ul>
                {!semantifyUser && (
                  <div>
                    Want to save the annotations to your personal semantify.it
                    account?
                    <br />
                    {this.state.showLoginFields && (
                      <div>
                        <FormGroup>
                          <Label for="login_identifier">Username/Email</Label>
                          <Input
                            type="email"
                            name="login_identifier"
                            id="login_identifier"
                            placeholder="username"
                            onChange={(e) =>
                              this.setState({ username: e.target.value })
                            }
                          />
                        </FormGroup>
                        <FormGroup>
                          <Label for="login_password">Password</Label>
                          <Input
                            type="password"
                            name="login_password"
                            id="login_password"
                            placeholder="password"
                            onChange={(e) =>
                              this.setState({ password: e.target.value })
                            }
                          />
                        </FormGroup>
                      </div>
                    )}
                    <br />
                    {this.state.showLoginBtn && (
                      <Button color="info" onClick={this.loginClick}>
                        Login
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            {this.state.showWebsiteList && (
              <div>
                <FormGroup tag="fieldset">
                  <legend>Your websites</legend>
                  {this.state.availableSemantifyWebsites.map((website, i) => (
                    <FormGroup check={true} key={i}>
                      <Label check={true}>
                        <Input
                          type="radio"
                          name="radio1"
                          value={website.uid}
                          onChange={(e) =>
                            setSemantifyDefaultWebsite({
                              uid: website.uid,
                              secret: website.secret,
                            })
                          }
                        />
                        {` ${website.name} (${website.domain})`}
                      </Label>
                    </FormGroup>
                  ))}
                </FormGroup>
                <Button color="primary" onClick={this.saveAnnotations}>
                  Save to selected website
                </Button>
              </div>
            )}
            {semantifyUser && (
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'blue',
                  fontStyle: 'italic',
                }}
                className="cursor-hand float-right"
                onClick={this.logoutClick}
              >
                Log out ({semantifyUser.username}
                {semantifyWebsite && `, ${semantifyWebsite.name}`})
              </span>
            )}
          </ModalBody>
          <ModalFooter>
            <div className="mr-auto">
              <Button color="success" onClick={this.downloadMapping}>
                <FontAwesomeIcon icon="download" size="lg" /> Download Mapping
                NodeJS Server
              </Button>{' '}
            </div>
            <Button color="info" onClick={this.saveAnnotations}>
              <FontAwesomeIcon icon="save" size="lg" /> Save
            </Button>{' '}
            <Button
              color="primary"
              onClick={() => {
                copyStrIntoClipBoard(
                  JSON.stringify(this.state.annotations.map((s) => s.jsonld)),
                );
                toast.info('Copied');
              }}
            >
              <FontAwesomeIcon icon="copy" size="lg" /> Copy All
            </Button>{' '}
            <Button color="secondary" onClick={this.toggleModal}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default SaveAnnotationsWebApi;
