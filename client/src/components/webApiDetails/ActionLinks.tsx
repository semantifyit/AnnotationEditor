import React, { useState } from 'react';
import { ActionLink as IActionLink, WebApi, Action, ActionRefs } from '../../../../server/src/models/WebApi';
import { FaPlus } from 'react-icons/fa';
import Select from 'react-select';
import uuid from 'uuid';
import { Optional } from '../../util/utils';
import { EnrichedAction } from '../../util/ActionStore';
import { Loading } from '../Loading';
import ActionLink from './ActionLink';

interface Props {
  type: 'Preceeding' | 'Potential';
  webApi: WebApi;
  baseAction: Action;
  actionRefs: ActionRefs;
  setActionLinks: (link: IActionLink[]) => void;
  getActions: (webApi: WebApi, ids: string[]) => Optional<EnrichedAction[]>;
  actionLinks: IActionLink[];
}

const ActionLinks = (props: Props) => {
  const { type, webApi, actionLinks, actionRefs, getActions, setActionLinks, baseAction } = props;
  const [newActionLink, setNewActionLink] = useState(false);
  const newActionLinkClick = () => setNewActionLink(true);
  const setNewActionId = (id: string) => {
    setActionLinks(actionLinks.concat({ id: uuid(), actionId: id, propertyMaps: [] }));
    setNewActionLink(false);
  };

  const actionRefsOptions = actionRefs.map((webApiRef) => ({
    label: webApiRef.name,
    options: webApiRef.actions.map((actionRef) => ({ label: actionRef.name, value: actionRef.id })),
  }));

  const actions = getActions(
    webApi,
    (actionLinks as IActionLink[]).map(({ actionId }) => actionId).concat(baseAction.id),
  );
  if (!actions) {
    return <Loading />;
  }

  const actionObj = Object.fromEntries(actions.map((enrAct) => [enrAct.action.id, enrAct]));

  const enrichedBaseAction = actionObj[baseAction.id];

  const setActionLink = (id: string) => (newActionLink: IActionLink) => {
    const newActionLinks = actionLinks.map((actLink) => (actLink.id === id ? newActionLink : actLink));
    setActionLinks(newActionLinks);
  };

  const removeActionLink = (id: string) => () => {
    const newActionLinks = actionLinks.filter((actLink) => actLink.id !== id);
    setActionLinks(newActionLinks);
  };

  return (
    <>
      <div className="d-flex flexSpaceBetween mb-3">
        <h3>{type} Action Links</h3>
        <button className="btn btn-outline-primary" onClick={newActionLinkClick}>
          <FaPlus /> New Action Link
        </button>
      </div>
      {newActionLink && (
        <div className="m-3 p-3 light-rounded-border">
          <span> Please choose an Action to link:</span>
          <Select
            options={actionRefsOptions}
            onChange={(option: any) => setNewActionId(option.value)}
            isSearchable={true}
          />
        </div>
      )}
      {actionLinks.length === 0 && !newActionLink && (
        <span className="italicGrey">No {type} actions defined, you can add new ones in the upper right</span>
      )}
      {actionLinks.map((actionLink) => {
        const enrichedLinkedAction = actionObj[actionLink.actionId];
        return (
          <ActionLink
            key={actionLink.actionId}
            type={type}
            baseAction={enrichedBaseAction}
            linkedAction={enrichedLinkedAction}
            actionLink={actionLink}
            setActionLink={setActionLink(actionLink.id)}
            removeActionLink={removeActionLink(actionLink.id)}
          />
        );
      })}
    </>
  );
};

export default ActionLinks;
