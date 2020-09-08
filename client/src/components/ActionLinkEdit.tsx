import React, { useContext, useState } from 'react';
import { ExpandedTemplateProperty, WebApi } from '../../../server/src/models/WebApi';
import { ActionLink, PropertyMap, TemplatePath } from '../../../server/src/models/ActionLink';
import { Config as GlobalConfig } from '../../../server/src/routes/config';
import { FaPlus, FaArrowRight, FaCog, FaSearch } from 'react-icons/fa';
import { EnrichedAction } from '../util/ActionStore';
import uuid from 'uuid';
import { joinReduction, useHover } from '../util/jsxHelpers';
import { expandUsedActionTemplates } from '../util/webApi';
import classNames from 'classnames';
import ModalBtn from './ModalBtn';
import Editor from './Editor';
import { actionLinkToAnnotation } from '../util/toAnnotation';
import { getDefaultVocabHandler } from '../util/rdfProperties';
import Radio from './Radio';

interface Props {
  source: EnrichedAction;
  target: EnrichedAction;
  link: ActionLink;
  saveClick: (l: ActionLink) => void;
  cancelClick: () => void;
  deleteClick?: () => void;
  prefixes: WebApi['prefixes'];
  config: GlobalConfig;
  isReadOnly: boolean;
  onTitleClick?: () => void;
}

interface PropertyMapProps {
  fromAction: EnrichedAction;
  toAction: EnrichedAction;
  propertyMap: PropertyMap;
  setPropertyMap: (pm: PropertyMap) => void;
  removePropertyMap: () => void;
  iterator?: ActionLink['iterator'];
  isReadOnly: boolean;
}

interface PathBtnProps {
  isIterator?: boolean;
  fromTo: 'from' | 'to';
  usedTemplatePath: TemplatePath;
  action: EnrichedAction;
  setPropertyPath: (p: TemplatePath | undefined) => void;
  iterator?: ActionLink['iterator'];
  isReadOnly: boolean;
  isEmpty?: boolean;
}

interface ExpandedTemplatePropertySelectionProps {
  prop: ExpandedTemplateProperty;
  path: string[];
  iterator?: ActionLink['iterator'];
}

const baseSparqlAskQuery = (prefixes: WebApi['prefixes']) => `${Object.entries(prefixes)
  .map(([k, v]) => `PREFIX ${k}: <${v}>`)
  .join('\n')}
ASK {
  ?s ?p ?o .
}`;

const ExpandedTemplatePropertySelection = ({
  prop,
  path,
  iterator,
}: ExpandedTemplatePropertySelectionProps) => {
  const { usePrefix, setPropertyPath, usedTemplatePath } = useContext(SelectionContext);
  const [ref, isHover] = useHover();
  const range = prop.range[0]; // TODO all ranges
  const isSelected = usedTemplatePath.id === prop.id;
  const borderClass = isHover
    ? 'borderSelectionSelected'
    : isSelected
    ? 'borderSelectionPreSelected'
    : prop.id === iterator?.id
    ? 'borderSelectionIterator'
    : 'borderSelection';
  const myPath = [...path, prop.path];
  const click = (e: any) => {
    e.stopPropagation();
    setPropertyPath({ id: prop.id, path: myPath });
  };
  return (
    <div ref={ref} onClick={click} className={classNames('p-2 pl-3 my-2', borderClass)}>
      <div className={classNames({ 'font-weight-bold': isHover || isSelected })}>{usePrefix(prop.path)}</div>
      {range.props.map((childProp) => (
        <ExpandedTemplatePropertySelection
          key={childProp.id}
          prop={childProp}
          path={myPath}
          iterator={iterator}
        />
      ))}
    </div>
  );
};

interface ISelectionContext {
  setPropertyPath: (p: TemplatePath) => void;
  usedTemplatePath: TemplatePath;
  usePrefix: (s: string) => string;
}

const fromToToInOut = (fromTo: 'from' | 'to') => (fromTo === 'from' ? 'output' : 'input');

const SelectionContext = React.createContext<ISelectionContext>({} as ISelectionContext);

const PropNodeSelection = ({
  fromTo,
  setPropertyPath,
  usedTemplatePath,
  action: {
    action,
    usePrefix,
    webApi: { templates },
  },
  iterator,
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
              <ExpandedTemplatePropertySelection
                key={templateProp.id}
                prop={templateProp}
                path={[]}
                iterator={iterator}
              />
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
  const { fromTo, usedTemplatePath, action, isIterator, isReadOnly, isEmpty } = props;

  const pathSeparator = <b className="mx-1">/</b>;
  return (
    <>
      <ModalBtn
        btnClassName="borderGrey py-1 px-2 btn btn-light back-bor-white shadow-none"
        btnStyle={isEmpty ? {} : { minWidth: '5rem', textAlign: 'left' }}
        btnTitle="Change path"
        btnContent={() =>
          isEmpty ? (
            <FaCog />
          ) : (
            <>
              {pathSeparator}
              {usedTemplatePath.path.length > 0 &&
                usedTemplatePath.path.map(action.usePrefix).reduce(joinReduction(pathSeparator) as any)}
            </>
          )
        }
        modalTitle={() => (
          <>
            <b className="text-capitalize">{isIterator ? 'iterator' : fromTo}</b>-path for Action:{' '}
            <b>{action.action.name}</b>
          </>
        )}
      >
        <div className="mb-3">
          Select path by choosing a {fromToToInOut(fromTo)} property node:
          {props.iterator && (
            <>
              {' '}
              (with iterator <b>/{props.iterator.path.map(action.usePrefix).join('/')}</b> )
            </>
          )}
        </div>
        <PropNodeSelection {...props} />
        {!isReadOnly && (
          <>
            <button
              className="mt-2 btn btn-outline-primary btn-sm"
              onClick={() => props.setPropertyPath({ id: '', path: [] })}
              disabled={isReadOnly}
            >
              Set to base path
            </button>
            {isIterator && !isEmpty && (
              <button
                className="ml-3 mt-2 btn btn-outline-danger btn-sm"
                onClick={() => props.setPropertyPath(undefined)}
                disabled={isReadOnly}
              >
                Remove Iterator
              </button>
            )}
          </>
        )}
      </ModalBtn>
    </>
  );
};

const PropertyMapRow = ({
  propertyMap,
  setPropertyMap,
  fromAction,
  toAction,
  removePropertyMap,
  iterator,
  isReadOnly,
}: PropertyMapProps) => {
  // const [modalBothShow, setModalBothShow] = useState(false);

  const setPropertyPath = (fromTo: 'from' | 'to') => (newPropPath: TemplatePath | undefined) =>
    setPropertyMap({ ...propertyMap, [fromTo]: newPropPath });

  return (
    <tr>
      <td>
        <PathBtn
          fromTo="from"
          action={fromAction}
          usedTemplatePath={propertyMap.from}
          setPropertyPath={setPropertyPath('from')}
          iterator={iterator}
          isReadOnly={isReadOnly}
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
          isReadOnly={isReadOnly}
        />
      </td>
      <td>
        <button
          type="button"
          className="close ml-2"
          title="Remove this Actionlink"
          onClick={removePropertyMap}
          disabled={isReadOnly}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </td>
    </tr>
  );
};

const ActionLinkEdit = ({
  config,
  link: originalLink,
  source,
  target,
  prefixes,
  cancelClick,
  deleteClick,
  saveClick,
  isReadOnly,
  onTitleClick,
}: Props) => {
  let [link, setLink] = useState<ActionLink>(originalLink);
  if (isReadOnly) {
    setLink = () => {};
  }

  const newPropertyMapClick = () =>
    setLink({
      ...link,
      propertyMaps: link.propertyMaps.concat({
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

  const setPropertyMap = (id: string) => (pMap: PropertyMap) =>
    setLink({
      ...link,
      propertyMaps: link.propertyMaps.map((oldPMap) => (oldPMap.id === id ? pMap : oldPMap)),
    });
  const removePropertyMap = (id: string) => () =>
    setLink({ ...link, propertyMaps: link.propertyMaps.filter((pMap) => pMap.id !== id) });

  return (
    <div>
      <div className="d-flex flexSpaceBetween">
        <h5 className={classNames('mb-2', { pointer: !!onTitleClick })} onClick={onTitleClick}>
          <b>From:</b> {source.action.name} <FaArrowRight /> <b>To:</b> {target.action.name}
        </h5>
        <ModalBtn
          modalTitle="Action Link Annotation"
          btnClassName="btn btn-light back-bor-white shadow-none"
          btnContent={() => <FaSearch />}
        >
          <Editor
            mode="json"
            readOnly={true}
            height="100%"
            maxLines={Infinity}
            value={actionLinkToAnnotation(config.baseUrl, link, getDefaultVocabHandler(), true)}
          />
        </ModalBtn>
      </div>
      <div className="p-2 pl-4">
        <div className="mb-3">
          <b className="mr-3" title="Where to attach the action to">
            Iterator:
          </b>
          {!link.iterator && <span className="italicGrey mr-2">No iterator defined</span>}
          <PathBtn
            action={source}
            fromTo="from"
            isIterator={true}
            usedTemplatePath={link.iterator || { id: '', path: [] }}
            // TODO FIX ABOVE
            setPropertyPath={(iterator) => {
              setLink({
                ...link,
                iterator,
              });
            }}
            isReadOnly={isReadOnly}
            isEmpty={!link.iterator}
          />
        </div>

        <div className="mb-2">
          <b className="mr-3" title="A condition for the action link">
            Condition:
          </b>
          {link.condition ? (
            <>
              <span className="text-capitalize">{link.condition.type}</span> <span>condition set</span>
            </>
          ) : (
            <span className="italicGrey">No condition defined</span>
          )}
          <ModalBtn
            modalTitle="Edit condition"
            btnClassName="btn btn-light ml-2 btn-sm"
            btnContent={() => (
              <span>
                <FaCog />
              </span>
            )}
          >
            <Radio
              disabled={isReadOnly}
              name="No condition"
              checked={!link.condition}
              onChange={() => {
                console.log('click');
                setLink({ ...link, condition: undefined });
              }}
            />
            <Radio
              disabled={isReadOnly}
              name="JavaScript"
              checked={!!(link.condition && link.condition.type === 'javascript')}
              onChange={() => {
                console.log('click');
                setLink({ ...link, condition: { type: 'javascript', value: 'true;' } });
              }}
            />
            <Radio
              disabled={isReadOnly}
              name="SPARQL"
              checked={!!(link.condition && link.condition.type === 'sparql')}
              onChange={() => {
                console.log('click');
                setLink({
                  ...link,
                  condition: { type: 'sparql', value: baseSparqlAskQuery(prefixes) },
                });
              }}
            />
            {link.condition && (
              <div className="mt-3">
                <p className="italicGrey mb-3">
                  Warning! Changing condition type (above) will remove/clear your script.
                </p>
                {link.condition.type === 'javascript' ? (
                  <p>
                    Write a Javascript script that should evaluate to true if the Action should be linked,
                    exposed variables: <i>spp</i>, <i>sppList</i>
                  </p>
                ) : (
                  <p>
                    <b>
                      Currently not fully supported, will not be executed but added to the resulting
                      actionlink annotation
                    </b>
                    <br />
                    Write a SPARQL ASK query that should return true if the action should be linked
                  </p>
                )}
                <Editor
                  value={link.condition.value}
                  mode={link.condition.type}
                  setValue={(value) =>
                    link.condition && setLink({ ...link, condition: { type: link.condition.type, value } })
                  }
                  height="300"
                  resizable={true}
                  readOnly={isReadOnly}
                />
              </div>
            )}
          </ModalBtn>
        </div>
        <div className="mt-4">
          <b>Property Mappings:</b>
        </div>
        <table className="table table-borderless-top table-layout-fixed">
          <thead>
            <tr>
              <th scope="col" className="table-header-width-big">
                From
              </th>
              <th scope="col" className="table-header-width-small" />
              <th scope="col" className="table-header-width-big">
                To
              </th>
              <th scope="col" className="table-header-width-small">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={newPropertyMapClick}
                  title="Create new property mapping"
                  disabled={isReadOnly}
                >
                  <FaPlus />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {link.propertyMaps.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <span className="italicGrey">No property mappings defined</span>
                </td>
              </tr>
            ) : (
              link.propertyMaps.map((propertyMap) => (
                <PropertyMapRow
                  key={propertyMap.id}
                  propertyMap={propertyMap}
                  fromAction={source}
                  toAction={target}
                  setPropertyMap={setPropertyMap(propertyMap.id)}
                  removePropertyMap={removePropertyMap(propertyMap.id)}
                  iterator={link.iterator}
                  isReadOnly={isReadOnly}
                />
              ))
            )}
          </tbody>
        </table>
        {!isReadOnly && (
          <>
            <hr className="mt-4 mb-3" />
            <div className="d-flex flexSpaceBetween mt-2">
              <div>
                <button className="btn btn-primary  mr-2" onClick={() => saveClick(link)}>
                  Save
                </button>
                <button className="btn btn-secondary mr-2" onClick={() => cancelClick()}>
                  Cancel
                </button>
              </div>
              {deleteClick && (
                <button className="btn btn-outline-danger" onClick={() => deleteClick()}>
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionLinkEdit;
