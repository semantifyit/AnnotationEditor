import React, { useState, useContext } from 'react';
import {
  ActionLink as IActionLink,
  PropertyMap as IPropertyMap,
  TemplatePath,
  ExpandedTemplateProperty,
} from '../../../../server/src/models/WebApi';
import { FaPlus, FaArrowRight } from 'react-icons/fa';
import { EnrichedAction } from '../../util/ActionStore';
import uuid from 'uuid';
import { joinReduction, useHover } from '../../util/jsxHelpers';
import Modal from 'react-bootstrap/Modal';
import { expandUsedActionTemplates } from '../../util/webApi';
import classNames from 'classnames';

type ActionLinkType = 'Preceeding' | 'Potential';

interface Props {
  type: ActionLinkType;
  baseAction: EnrichedAction;
  linkedAction: EnrichedAction;
  actionLink: IActionLink;
  setActionLink: (link: IActionLink) => void;
  removeActionLink: () => void;
}

interface PropertyMapProps {
  fromAction: EnrichedAction;
  toAction: EnrichedAction;
  propertyMap: IPropertyMap;
  setPropertyMap: (pmap: IPropertyMap) => void;
  removePropertyMap: () => void;
}

interface PathBtnProps {
  fromTo: 'from' | 'to';
  usedTemplatePath: TemplatePath;
  action: EnrichedAction;
  setPropertyPath: (p: TemplatePath) => void;
}

interface ExpandedTemplatePropertySelectionProps {
  prop: ExpandedTemplateProperty;
  path: string[];
}

const ExpandedTemplatePropertySelection = ({ prop, path }: ExpandedTemplatePropertySelectionProps) => {
  const { usePrefix, setPropertyPath, usedTemplatePath } = useContext(SelectionContext);
  const [ref, isHover] = useHover();
  const range = prop.range[0]; // TODO all ranges
  const borderClass = isHover
    ? 'borderSelectionSelected'
    : usedTemplatePath.id === prop.id
    ? 'borderSelectionPreSelected'
    : 'borderSelection';
  const myPath = [...path, prop.path];
  const click = (e: any) => {
    e.stopPropagation();
    setPropertyPath({ id: prop.id, path: myPath });
  };
  return (
    <div ref={ref} onClick={click} className={classNames('p-2 pl-3 my-2', borderClass)}>
      <div>{usePrefix(prop.path)}</div>
      {range.props.map((childProp) => (
        <ExpandedTemplatePropertySelection key={childProp.id} prop={childProp} path={myPath} />
      ))}
    </div>
  );
};

interface SelectionContext {
  setPropertyPath: (p: TemplatePath) => void;
  usedTemplatePath: TemplatePath;
  usePrefix: (s: string) => string;
}

const fromToToInOut = (fromTo: 'from' | 'to') => (fromTo === 'from' ? 'output' : 'input');

const SelectionContext = React.createContext<SelectionContext>({} as SelectionContext);

const PropNodeSelection = ({
  fromTo,
  setPropertyPath,
  usedTemplatePath,
  action: {
    action,
    usePrefix,
    webApi: { templates },
  },
}: PathBtnProps) => {
  const expAction = expandUsedActionTemplates(action.annotationSrc, templates);
  const { input, output } = expAction;
  const templateProps = fromTo === 'from' ? output : input;
  return (
    <>
      {templateProps ? (
        <SelectionContext.Provider value={{ setPropertyPath, usePrefix, usedTemplatePath }}>
          <div className="pointerRec">
            {templateProps.map((templateProp) => (
              <ExpandedTemplatePropertySelection key={templateProp.id} prop={templateProp} path={[]} />
            ))}
          </div>
        </SelectionContext.Provider>
      ) : (
        <span className="italicGrey">Action has no {fromToToInOut(fromTo)}.</span>
      )}
    </>
  );
};

const PathBtn = (props: PathBtnProps) => {
  const { fromTo, usedTemplatePath, action } = props;
  const [modalshow, setModalShow] = useState(false);

  const pathSeperator = <b className="mx-1">/</b>;
  return (
    <>
      <button
        className="borderGrey py-1 px-2 btn btn-light back-bor-white shadow-none"
        style={{ minWidth: '5rem', textAlign: 'left' }}
        title="Change path"
        onClick={() => setModalShow(true)}
      >
        {pathSeperator}
        {usedTemplatePath.path.length > 0 &&
          usedTemplatePath.path.map(action.usePrefix).reduce(joinReduction(pathSeperator) as any)}
      </button>
      <Modal show={modalshow} onHide={() => setModalShow(false)} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>
            Change <b>{fromTo}</b>-path for Action: <b>{action.action.name}</b>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">Select new path by choosing a {fromToToInOut(fromTo)} property node:</div>
          <PropNodeSelection {...props} />
        </Modal.Body>
      </Modal>
    </>
  );
};

const PropertyMap = ({
  propertyMap,
  setPropertyMap,
  fromAction,
  toAction,
  removePropertyMap,
}: PropertyMapProps) => {
  // const [modalBothShow, setModalBothShow] = useState(false);

  const setPropertyPath = (fromTo: 'from' | 'to') => (newPropPath: TemplatePath) =>
    setPropertyMap({ ...propertyMap, [fromTo]: newPropPath });

  return (
    <tr>
      <td>
        <PathBtn
          fromTo="from"
          action={fromAction}
          usedTemplatePath={propertyMap.from}
          setPropertyPath={setPropertyPath('from')}
        />
      </td>
      <td>
        <FaArrowRight />
      </td>
      <td>
        <PathBtn
          fromTo="to"
          action={toAction}
          usedTemplatePath={propertyMap.to}
          setPropertyPath={setPropertyPath('to')}
        />
      </td>
      <td>
        <button
          type="button"
          className="close ml-2"
          title="Remove this Actionlink"
          onClick={removePropertyMap}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </td>
    </tr>
  );
};

const ActionLink = ({
  type,
  linkedAction,
  actionLink,
  setActionLink,
  baseAction,
  removeActionLink,
}: Props) => {
  const newPropertyMapClick = () =>
    setActionLink({
      ...actionLink,
      propertyMaps: actionLink.propertyMaps.concat({
        from: {
          id: '',
          path: [],
        },
        to: {
          id: '',
          path: [],
        },
        id: uuid(),
      }),
    });

  const setPropertyMap = (id: string) => (pMap: IPropertyMap) =>
    setActionLink({
      ...actionLink,
      propertyMaps: actionLink.propertyMaps.map((oldPMap) => (oldPMap.id === id ? pMap : oldPMap)),
    });
  const removePropertyMap = (id: string) => () =>
    setActionLink({ ...actionLink, propertyMaps: actionLink.propertyMaps.filter((pMap) => pMap.id !== id) });

  const [fromAction, toAction] =
    type === 'Potential' ? [baseAction, linkedAction] : [linkedAction, baseAction];

  return (
    <div className="m-3 p-3 light-rounded-border" key={actionLink.id}>
      <div className="d-flex flexSpaceBetween">
        <h5 className="mb-2">
          <b>Action:</b> {linkedAction.action.name}
        </h5>
        <button
          type="button"
          className="close ml-2"
          title="Remove this Actionlink"
          onClick={removeActionLink}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div className="p-2 pl-4">
        <div className="d-flex flexSpaceBetween mb-1">
          <b>Property Maps:</b>
          <button className="btn btn-outline-primary btn-sm" onClick={newPropertyMapClick}>
            <FaPlus /> New Property Map
          </button>
        </div>
        {actionLink.propertyMaps.length === 0 ? (
          <span className="italicGrey">No property maps defined</span>
        ) : (
          <table className="table table-borderless-top table-layout-fixed">
            <thead>
              <tr>
                <th scope="col" className="table-header-width-big">
                  From (Action: "{fromAction.action.name}")
                </th>
                <th scope="col" className="table-header-width-small"></th>
                <th scope="col" className="table-header-width-big">
                  To (Action: "{toAction.action.name}")
                </th>
                <th scope="col" className="table-header-width-small"></th>
              </tr>
            </thead>
            <tbody>
              {actionLink.propertyMaps.map((propertyMap) => (
                <PropertyMap
                  key={propertyMap.id}
                  propertyMap={propertyMap}
                  fromAction={fromAction}
                  toAction={toAction}
                  setPropertyMap={setPropertyMap(propertyMap.id)}
                  removePropertyMap={removePropertyMap(propertyMap.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ActionLink;
