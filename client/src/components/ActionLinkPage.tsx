import React, { useState, useEffect } from 'react';
import ky from 'ky';
import { FaCheck, FaFolderPlus } from 'react-icons/fa';
import Select from 'react-select';

import { Loading } from './Loading';
import { ActionLink } from '../../../server/src/models/ActionLink';
import { useGlobalConfig } from './webApiDetails/WebApiCreate';
import { ActionRefs } from '../../../server/src/models/WebApi';
import ActionLinkEdit from './ActionLinkEdit';
import { useActionStore } from '../util/ActionStore';
import uuid from 'uuid';
import { toast } from 'react-toastify';
import { actionLinkToAnnotation } from '../util/toAnnotation';
import { getDefaultVocabHandler } from '../util/rdfProperties';

interface ActionLinkListProps {
  links: ActionLink[];
}

const ActionLinkList = ({ links }: ActionLinkListProps) => (
  <div>
    {links.length === 0 && <span className="italicGrey">No Action Links created</span>}
    {links.map((link) => (
      <div key={link.id}>Link: {link.id}</div>
    ))}
  </div>
);

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

  const saveEditLink = async (link: ActionLink) => {
    try {
      link.annotation = actionLinkToAnnotation(config.baseUrl, link, getDefaultVocabHandler(), true);
      const savedLink: ActionLink = await ky(`/api/actionLink/${newLink ? '' : link.id}`, {
        method: newLink ? 'post' : 'patch',
        json: link,
      }).json();
      toast.success('Created Action Link!');
      setEditLink(undefined);
      setNewLink(undefined);
      setActionLinks([...actionLinks, savedLink]);
    } catch (e) {
      toast.error(`Error creating Action Link: ${e}`);
    }
  };
  const cancelEditLink = () => {
    setEditLink(undefined);
    setNewLink(undefined);
  };
  const deleteEditLink = async () => {
    if (!editLink) {
      return;
    }
    if (newLink) {
      setEditLink(undefined);
      setNewLink(undefined);
      return;
    }
    if (window.confirm('Are you sure to delete this Action Link?')) {
      try {
        await ky.delete(`/api/actionLink/${editLink.id}`);
        toast.success('Deleted Action Link!');
        setEditLink(undefined);
        setNewLink(undefined);
        setActionLinks(actionLinks.filter((l) => l.id !== editLink.id));
      } catch (e) {
        toast.error(`Error deleting Action Link: ${e}`);
      }
    }
  };

  const editLinkBox = () => {
    if (!editLink) {
      return;
    }
    const actions = actionStore.getActions([editLink.source, editLink.target]);
    if (!actions) {
      return <Loading />;
    }
    const sourceAction = actions.find((a) => a.action.id === editLink.source);
    const targetAction = actions.find((a) => a.action.id === editLink.target);
    if (!sourceAction || !targetAction) {
      return <h1>Some error happened</h1>;
    }
    return (
      <div className="mb-4">
        <ActionLinkEdit
          config={config}
          link={editLink}
          saveLink={saveEditLink}
          cancelLink={cancelEditLink}
          deleteLink={deleteEditLink}
          prefixes={{}} // TODO
          source={sourceAction}
          target={targetAction}
        />
        <hr />
      </div>
    );
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
      {editLink && editLinkBox()}
      {isLoading ? <Loading /> : <ActionLinkList links={actionLinks} />}
    </>
  );
};

export default ActionLinkPage;
