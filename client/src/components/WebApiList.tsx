import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ky from 'ky';
import { FaFolderPlus, FaEllipsisV, FaExternalLinkAlt, FaCaretDown } from 'react-icons/fa';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Popover from 'react-bootstrap/Popover';

import { EnrichedWebApi as WebApi } from '../../../server/src/util/webApi';
import { toReadableString, toDateString } from '../util/utils';
import { autoLink } from '../util/jsxHelpers';
import { toast } from 'react-toastify';
import { getDescriptionOfWebApi, getNameOfWebApi } from '../util/webApi';
import ModalBtn from './ModalBtn';
import { Loading } from './Loading';

const webApiDescription = (webApi: WebApi) => {
  const desc = toReadableString(getDescriptionOfWebApi(webApi));
  return desc === '' ? <i>No description available</i> : autoLink(desc);
};

const webApiActionTooltip = (webApi: WebApi) => (
  <Tooltip id={`tooltip-actions-${webApi._id}`}>
    {webApi.actionStats.short.map(({ type, name }, i) => (
      <span key={i}>
        {`${toReadableString(name)} (${toReadableString(type)})`}
        <br />
      </span>
    ))}
  </Tooltip>
);

const confirmDelete = async (webApi: WebApi, deleteWebApi: (id: string) => void) => {
  if (
    // eslint-disable-next-line no-alert
    window.confirm(`Are you sure you wish to delete the WebAPI entry for ${getNameOfWebApi(webApi)}`)
  ) {
    // TODO delete
    try {
      await ky.delete(`/api/webApi/${webApi._id}`);
      deleteWebApi(webApi._id);
      toast.success('Deleted WebAPI!');
    } catch (e) {
      toast.error(`Error deleting WebAPI: ${e}`);
    }
  }
};

const optionsBlockBtn = 'btn btn-light btn-block back-bor-white shadow-none text-left';

interface WebApiProps {
  webApi: WebApi;
  deleteWebApi: (id: string) => void;
}

const webApiOptions = ({ webApi, deleteWebApi }: WebApiProps) => (
  <Popover id={`popover-webapi-${webApi._id}`}>
    {/* <Popover.Title as="h3"></Popover.Title> */}
    <Popover.Content>
      <Link to={`/webAPI/${webApi._id}/view`} className={optionsBlockBtn}>
        View
      </Link>
      <Link to={`/webAPI/${webApi._id}/edit`} className={optionsBlockBtn}>
        Edit
      </Link>
      <button className={optionsBlockBtn} onClick={() => confirmDelete(webApi, deleteWebApi)}>
        Delete
      </button>
      <a
        className={optionsBlockBtn}
        href={`http://localhost:8012/api/webApi/${webApi._id}/export`}
        download={`webApi${webApi._id}.json`}
      >
        Export
      </a>
      <hr />
      {/*<a*/}
      {/*  className={optionsBlockBtn}*/}
      {/*  href={`https://graphdb.sti2.at/resource?uri=${encodeURIComponent(*/}
      {/*    `https://actions.semantify.it/graphs/${webApi.id}`,*/}
      {/*  )}`}*/}
      {/*  target="_blank"*/}
      {/*  rel="noopener noreferrer"*/}
      {/*>*/}
      {/*  <FaExternalLinkAlt /> GraphDB Graph*/}
      {/*</a>*/}
      <a
        className={optionsBlockBtn}
        href={`/api/rdf/webapi/${webApi.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaExternalLinkAlt /> WebAPI Annotation
      </a>
    </Popover.Content>
  </Popover>
);

const WebApiCard = ({ webApi, deleteWebApi }: WebApiProps) => (
  <div className="card">
    <div className="card-body">
      <h5 className="card-title d-flex flexSpaceBetween flexStartAlign">
        <span>{toReadableString(getNameOfWebApi(webApi), '')}</span>
        <OverlayTrigger
          rootClose
          trigger="click"
          placement="bottom"
          overlay={webApiOptions({ webApi, deleteWebApi })}
        >
          <button
            className="btn btn-light float-right back-bor-white shadow-none"
            style={{ transform: 'translate(20px, -20px)' }}
          >
            <FaEllipsisV />
          </button>
        </OverlayTrigger>
      </h5>

      <OverlayTrigger placement="bottom" overlay={webApiActionTooltip(webApi)}>
        <h6 className="card-subtitle mb-2 text-muted d-inline">
          {webApi.actionStats.count} Action
          {webApi.actionStats.count !== 1 && 's'}
        </h6>
      </OverlayTrigger>

      <p className="card-text">{webApiDescription(webApi)}</p>
      <p className="card-text">
        <small className="text-muted">
          {toDateString(webApi.updatedAt)}
          <span className="font-italic float-right">/{webApi.id}</span>
        </small>
      </p>
    </div>
  </div>
);

interface WebApiListProps {
  webApis: WebApi[];
  deleteWebApi: (id: string) => void;
}

const WebApiDeck = ({ webApis, deleteWebApi }: WebApiListProps) => (
  <div className="row">
    {webApis.map((webApi) => (
      <div key={webApi._id} className="col-lg-4 col-md-6 mb-4">
        {<WebApiCard webApi={webApi} deleteWebApi={deleteWebApi} />}
      </div>
    ))}
  </div>
);

const useWebApis = (): [WebApi[], (w: WebApi[]) => void, boolean] => {
  const [webApis, setWebApis] = useState<WebApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ky.get('/api/webApi')
      .json()
      .then((resp) => {
        setWebApis(resp as WebApi[]);
        setIsLoading(false);
      });
  }, []);

  return [webApis, setWebApis, isLoading];
};

const WebApiList = () => {
  const [webApis, setWebApis, isLoading] = useWebApis();

  const deleteWebApi = (id: string) => setWebApis(webApis.filter(({ _id }) => _id !== id));
  const addWebApi = (webApi: WebApi) => setWebApis([...webApis, webApi]);

  return (
    <>
      <h2 className="mb-4">
        <div className="d-flex flexSpaceBetween">
          <span>Available Web APIs</span>
          <div>
            <div className="input-group">
              <div className="input-group-prepend">
                <Link to="/webAPI/new" className="btn btn-success float-right">
                  New <FaFolderPlus />
                </Link>
              </div>
              <ImportWebApi addWebApi={addWebApi} />
            </div>
          </div>
        </div>
      </h2>
      {isLoading ? (
        <Loading />
      ) : webApis.length === 0 ? (
        <i>No Web APIs available</i>
      ) : (
        <WebApiDeck
          webApis={webApis.sort((a, b) => b._id.localeCompare(a._id))}
          deleteWebApi={deleteWebApi}
        />
      )}
    </>
  );
};

const ImportWebApi = ({ addWebApi }: { addWebApi: (arg: WebApi) => void }) => {
  const [importMessage, setImportMessage] = useState<['danger' | 'success', string | undefined]>([
    'danger',
    undefined,
  ]);
  const [importedWebApi, setImportedWebApi] = useState<any | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const setError = (e: string) => setImportMessage(['danger', e]);
  const setSuccess = (e: string) => setImportMessage(['success', e]);

  const onFileLoad = (event: React.ChangeEvent<any>) => {
    if (event.target.files.length !== 1 || !event.target.files[0].name.match('^(.*.json|)$')) {
      setError('Only accepts filetypes: .json, .jsonld, .tll');
      return;
    }
    const fileSource = event.target.files[0];
    const reader = new FileReader();
    reader.onload = ((file: any) => () => {
      setSuccess('Loaded from file');
      const newWebApi = file.result;
      try {
        setImportedWebApi(JSON.parse(newWebApi));
      } catch (e) {
        setError('Could not parse webApi');
      }
    })(reader);
    reader.readAsText(fileSource);
  };

  const importClick = async () => {
    try {
      setIsLoading(true);
      const result = await ky
        .post('/api/webApi', {
          json: importedWebApi,
        })
        .json();
      addWebApi(result as WebApi);
      setIsLoading(false);
      setSuccess('Successfully addded vocabulary, you may close this window');
    } catch (e) {
      setError(`Some error happened during the upload: ${e.toString()}`);
    }
  };

  return (
    <ModalBtn
      modalTitle="Import WebApi"
      btnTitle="Import WebApi"
      btnContent={() => <FaCaretDown />}
      btnClassName="btn-outline-success input-group-append pt-2 px-0"
    >
      <div>
        <p>
          Import a WebAPI from a previously exported WebAPI. <br /> This process may fail if the Application
          version of the exported WebAPI doesnt match the current version
        </p>
        <div className="custom-file" key="file">
          <input
            type="file"
            className="custom-file-input"
            id="importWebApi"
            accept=".json"
            onChange={onFileLoad}
          />
          <label className="custom-file-label" htmlFor="importWebApi">
            Choose file
          </label>
        </div>
        {importMessage[1] && (
          <div className={`alert alert-${importMessage[0]} my-2`} role="alert">
            {importMessage[1]}
          </div>
        )}
        {importedWebApi && (
          <>
            <button className="btn btn-primary" onClick={importClick} disabled={isLoading}>
              Import
            </button>
            {isLoading && <Loading />}
          </>
        )}
      </div>
    </ModalBtn>
  );
};

export default WebApiList;
