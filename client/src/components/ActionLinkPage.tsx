import React, { useState, useEffect } from 'react';
import ky from 'ky';
import { FaArrowRight, FaCheck, FaFolderPlus } from 'react-icons/fa';
import Select from 'react-select';

import { Loading } from './Loading';
import { ActionLink } from '../../../server/src/models/ActionLink';
import { useGlobalConfig } from './webApiDetails/WebApiCreate';
import { ActionRefs } from '../../../server/src/models/WebApi';
import ActionLinkEdit from './ActionLinkEdit';
import { ActionStore, useActionStore } from '../util/ActionStore';
import uuid from 'uuid';
import { toast } from 'react-toastify';
import { actionLinkToAnnotation } from '../util/toAnnotation';
import { getDefaultVocabHandler } from '../util/rdfProperties';
import { Config } from '../../../server/src/routes/config';

const saveActionLink = async (
  link: ActionLink,
  config: Config,
  isNew: boolean,
  success: (a: ActionLink) => void,
) => {
  try {
    link.annotation = actionLinkToAnnotation(config.baseUrl, link, getDefaultVocabHandler(), true);
    //(link as any)._id = undefined; // cannot update doc with _id present
    const savedLink: ActionLink = await ky(`/api/actionLink/${isNew ? '' : (link as any)._id}`, {
      method: isNew ? 'post' : 'patch',
      json: link,
    }).json();
    toast.success('Created Action Link!');
    success(savedLink);
  } catch (e) {
    toast.error(`Error creating Action Link: ${e}`);
  }
};

const deleteActionLink = async (link: ActionLink, success: () => void) => {
  if (window.confirm('Are you sure to delete this Action Link?')) {
    try {
      await ky.delete(`/api/actionLink/${(link as any)._id}`);
      toast.success('Deleted Action Link!');
      success();
    } catch (e) {
      toast.error(`Error deleting Action Link: ${e}`);
    }
  }
};

interface ActionLinkListProps {
  links: ActionLink[];
  actionStore: ActionStore;
  actionRefs: ActionRefs;
  config: Config;
  setActionLinks: (aL: ActionLink[]) => void;
}
type LinkState = undefined | 'view' | 'edit';

const getActionFromRef = (id: string, refs: ActionRefs) =>
  refs.flatMap((w) => w.actions).find((a) => a.id === id);

const linkTitle = (link: ActionLink, refs: ActionRefs) => (
  <span>
    {getActionFromRef(link.source, refs)?.name} <FaArrowRight /> {getActionFromRef(link.target, refs)?.name}
  </span>
);

const ActionLinkList = ({ config, links, actionStore, actionRefs, setActionLinks }: ActionLinkListProps) => {
  const [linkStateObj, setLinkStateObj] = useState<Record<string, LinkState>>({});
  const setLinkState = (id: string, state: LinkState) => setLinkStateObj({ ...linkStateObj, [id]: state });
  return (
    <div>
      {links.length === 0 && <span className="italicGrey">No Action Links created</span>}
      <div className="list-group">
        {links.map((link) =>
          linkStateObj[link.id] ? (
            <div className="list-group-item" key={link.id}>
              <EditActionLinkBox
                config={config}
                link={link}
                actionStore={actionStore}
                cancelClick={() => setLinkState(link.id, undefined)}
                saveClick={(newLink) => {
                  saveActionLink(newLink, config, false, () => setLinkState(link.id, 'view'));
                  setActionLinks(links.map((l) => (l.id === link.id ? newLink : l)));
                }}
                deleteClick={() =>
                  deleteActionLink(link, () => {
                    setLinkState(link.id, undefined);
                    setActionLinks(links.filter(({ id }) => id !== link.id));
                  })
                }
                isReadOnly={linkStateObj[link.id] === 'view'}
                onTitleClick={
                  linkStateObj[link.id] === 'view' ? () => setLinkState(link.id, undefined) : undefined
                }
              />
              {linkStateObj[link.id] === 'view' && (
                <div className="mb-2">
                  <hr className="mb-3" />
                  <button
                    className="ml-2 btn btn-outline-primary"
                    onClick={() => setLinkState(link.id, 'edit')}
                  >
                    Edit
                  </button>
                  <button
                    className="ml-2 btn btn-outline-secondary"
                    onClick={() => setLinkState(link.id, undefined)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="list-group-item list-group-item-action"
              onClick={() => setLinkState(link.id, 'view')}
              key={link.id}
            >
              {linkTitle(link, actionRefs)}
            </button>
          ),
        )}
      </div>
    </div>
  );
};

interface EditActionLinkBoxProps {
  link: ActionLink;
  actionStore: ActionStore;
  config: Config;
  saveClick: (l: ActionLink) => void;
  cancelClick: () => void;
  deleteClick?: () => void;
  isReadOnly: boolean;
  onTitleClick?: () => void;
}

const EditActionLinkBox = ({
  link,
  actionStore,
  config,
  saveClick,
  cancelClick,
  deleteClick,
  isReadOnly,
  onTitleClick,
}: EditActionLinkBoxProps) => {
  const actions = actionStore.getActions([link.source, link.target]);
  if (!actions) {
    return <Loading />;
  }
  const sourceAction = actions.find((a) => a.action.id === link.source);
  const targetAction = actions.find((a) => a.action.id === link.target);
  if (!sourceAction || !targetAction) {
    return <h1>Some error happened</h1>;
  }
  return (
    <ActionLinkEdit
      config={config}
      link={link}
      saveClick={saveClick}
      cancelClick={cancelClick}
      deleteClick={deleteClick}
      prefixes={{}}
      source={sourceAction}
      target={targetAction}
      isReadOnly={isReadOnly}
      onTitleClick={onTitleClick}
    />
  );
};

export const useActionLinks = (): [ActionLink[], (a: ActionLink[]) => void, boolean] => {
  const [actionLinks, setActionLinks] = useState<ActionLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ky.get('/api/actionLink')
      .json()
      .then((resp) => {
        setActionLinks(resp as ActionLink[]);
        setIsLoading(false);
      });
  }, []);

  return [actionLinks, setActionLinks, isLoading];
};

const useOtherActionsRefs = (): [ActionRefs, boolean] => {
  const [otherActions, setOtherActions] = useState<ActionRefs>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    ky.get('/api/webApi/actions')
      .json()
      .then((resp) => {
        setOtherActions(resp as ActionRefs);
        setIsLoading(false);
      });
  }, []);
  return [otherActions, isLoading];
};

const ActionLinkPage = () => {
  const [actionLinks, setActionLinks, isLoadingActionLinks] = useActionLinks();
  const [config, isLoadingConfig] = useGlobalConfig();
  const [actionRefs, isLoadingActionRefs] = useOtherActionsRefs();
  const actionStore = useActionStore();

  const [newLink, setNewLink] = useState<{ source: string; target: string } | undefined>(undefined);
  const [editLink, setEditLink] = useState<ActionLink | undefined>(undefined);

  const isLoading = isLoadingActionLinks || isLoadingConfig || isLoadingActionRefs;

  const actionRefsOptions = actionRefs.map((webApiRef) => ({
    label: webApiRef.name,
    options: webApiRef.actions.map((actionRef) => ({ label: actionRef.name, value: actionRef.id })),
  }));

  const createNewDisabled = !newLink || newLink.target === '' || newLink.source === '';

  const clickCreateNew = () => {
    if (!newLink) {
      return;
    }
    setEditLink({
      id: uuid(),
      source: newLink.source,
      target: newLink.target,
      propertyMaps: [],
      annotation: '',
    });
  };

  const saveEditLink = (link: ActionLink) => {
    saveActionLink(link, config, true, (newLink) => {
      setEditLink(undefined);
      setNewLink(undefined);
      setActionLinks([...actionLinks, newLink]);
    });
  };

  const cancelEditLink = () => {
    setEditLink(undefined);
    setNewLink(undefined);
  };

  const deleteEditLink = async () => {
    if (!editLink) {
      return;
    }
    deleteActionLink(editLink, () => {
      setEditLink(undefined);
      setNewLink(undefined);
      setActionLinks(actionLinks.filter((l) => l.id !== editLink.id));
    });
  };

  return (
    <>
      <h2 className="mb-4">
        <div className="d-flex flexSpaceBetween">
          <span>Action Links</span>
          <div>
            <button
              disabled={!!newLink || !!editLink}
              className="btn btn-success float-right"
              onClick={() => setNewLink({ source: '', target: '' })}
            >
              New <FaFolderPlus />
            </button>
          </div>
        </div>
      </h2>
      {newLink && !editLink && (
        <div className="mb-4">
          <div className="m-3 p-3 light-rounded-border">
            <h5> Choose a source and target Action to link:</h5>
            <div className="row mb-3">
              <div className="col col-6">
                <label className="font-weight-bold">Source: </label>
                <Select
                  options={actionRefsOptions}
                  onChange={(option: any) => setNewLink({ ...newLink, source: option.value })}
                  isSearchable={true}
                />
              </div>
              <div className="col col-6">
                <label className="font-weight-bold">Target: </label>
                <Select
                  options={actionRefsOptions}
                  onChange={(option: any) => setNewLink({ ...newLink, target: option.value })}
                  isSearchable={true}
                />
              </div>
            </div>
            <button className="btn btn-sm btn-primary" disabled={createNewDisabled} onClick={clickCreateNew}>
              <FaCheck /> Next
            </button>
          </div>
          <hr />
        </div>
      )}
      {editLink && (
        <div className="mb-4">
          <div className="m-3 p-3 light-rounded-border">
            <EditActionLinkBox
              config={config}
              link={editLink}
              actionStore={actionStore}
              saveClick={saveEditLink}
              cancelClick={cancelEditLink}
              //deleteClick={deleteEditLink}
              isReadOnly={false}
            />
          </div>
          <hr />
        </div>
      )}
      {isLoading ? (
        <Loading />
      ) : (
        <ActionLinkList
          links={actionLinks}
          actionStore={actionStore}
          actionRefs={actionRefs}
          config={config}
          setActionLinks={setActionLinks}
        />
      )}
    </>
  );
};

export default ActionLinkPage;
