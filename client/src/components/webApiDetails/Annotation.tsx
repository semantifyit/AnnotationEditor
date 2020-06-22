import React, { useState, useRef, useContext } from 'react';
import classNames from 'classnames';
import set from 'lodash/set';
import get from 'lodash/get';
import Select from 'react-select';
import { FaAngleUp, FaAngleDown, FaPlus, FaEllipsisH } from 'react-icons/fa';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import DateTime from 'react-datetime';
import uuid from 'uuid/v1';
import DropdownButton from 'react-bootstrap/DropdownButton';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import isURL from 'validator/lib/isURL';
import { SortableContainer, SortableElement, SortableHandle, SortEndHandler } from 'react-sortable-hoc';
import arrayMove from 'array-move';

import {
  DefaultRessourceDesc,
  RessourceDescProp,
  TemplateProperty,
  TemplatePropertyGroupType,
  TemplatePropertyRange,
  ShaclRestrProps,
  SchaclRestrPairProps,
  SchaclRestrOtherProps,
  WebApiConfig,
  Template,
  TemplateRessourceDesc,
  RessourceDesc,
  ActionRessourceDesc,
} from '../../../../server/src/models/WebApi';
import VocabHandler, { sortNodeDetails, NodeDetails, Restriction } from '../../util/VocabHandler';
import {
  clone,
  toArray,
  escapeLineBreaks,
  cutString,
  toReadableString,
  prettyJsonStr,
} from '../../util/utils';
import * as p from '../../util/rdfProperties';

import '../../styles/annotation.css';
import 'react-datetime/css/react-datetime.css';
import { isTemplateProp } from '../../util/webApi';
import CheckBox from '../Checkbox';
import { joinReduction } from '../../util/jsxHelpers';
import CreatableSelect from '../CreatableSelect';
import ModalBtn from '../ModalBtn';
import WithCodeSplit from '../WithCodeSplit';
import { SessionConfig } from './WebApiCreate';

const SortableListItem = SortableElement(({ children }: any) => <div>{children}</div>);
const DragHandle = SortableHandle(({ children }: any) => <span className="row-resize">{children}</span>);
const SortableList = SortableContainer(({ children }: any) => <div>{children}</div>);

type voidFn<T> = (arg: T) => void;

type DefRessourceDesc = RessourceDesc | ActionRessourceDesc | TemplateRessourceDesc;

interface Props {
  baseType: string;
  annotation: DefaultRessourceDesc;
  setAnnotation: (ann: any) => void; //voidFn<RessourceDesc> | voidFn<ActionRessourceDesc> | voidFn<TemplateRessourceDesc>;
  vocabHandler: VocabHandler;
  config: WebApiConfig;
  potTemplates: Template[];
  isAction?: boolean;
  getAnnotation: () => string;
  sessionConfig: SessionConfig;
}

type Path = (string | number)[];
type PathValue<T = any> = { path: Path; value: T };
type SetPathVal = (pv: PathValue | PathValue[]) => void;
type RemovePath = (path: Path) => void;

interface AnnotationContext {
  setPathVal: SetPathVal;
  removePath: RemovePath;
  vocabHandler: VocabHandler;
  config: WebApiConfig;
  potTemplates: Template[];
}

const AnnotationContext = React.createContext<AnnotationContext>({} as AnnotationContext);

const Annotation = ({
  baseType,
  annotation: ann,
  setAnnotation: setAnn,
  vocabHandler,
  config,
  potTemplates,
  isAction,
  getAnnotation,
  sessionConfig,
}: Props) => {
  try {
    const setPathVal: SetPathVal = (pvs) => {
      const newAnn = clone(ann);
      toArray(pvs).forEach(({ path, value }) => {
        set(newAnn, path, value);
      });
      setAnn(newAnn);
    };

    const removePath: RemovePath = (path) => {
      const newAnn = clone(ann);
      const fatherPath = path.slice(0, -1);
      const indexToRemove = path.slice(-1)[0];
      // console.log(path);
      // console.log(indexToRemove);
      // console.log(fatherPath);
      const props = get(newAnn, fatherPath);
      props.splice(indexToRemove, 1);
      set(newAnn, fatherPath, props);
      setAnn(newAnn);
    };

    const getNode = () => (
      <AnnotationContext.Provider
        value={{
          setPathVal,
          removePath,
          vocabHandler,
          config,
          potTemplates,
        }}
      >
        <Node path={[]} ann={ann} fromRanges={[baseType]} isAction={isAction} topNode={true} />
      </AnnotationContext.Provider>
    );

    return (
      <WithCodeSplit isOpen={sessionConfig.showCodeEditor} value={prettyJsonStr(getAnnotation())}>
        {getNode()}
      </WithCodeSplit>
    );
  } catch (e) {
    console.error(e);
    return <h1>Error: {e.toString()}</h1>;
  }
};

export default Annotation;

interface Option {
  value: string;
  label: string;
}

interface NodeMoreProps {
  typeOptions: Option[];
  typeSelectedOptions: Option[];
  typeOnChange: (val: any) => void;
  nodeId: string | undefined;
  setNodeId: (v: string) => void;
}

const selectSubTypes = ({
  typeOptions,
  typeSelectedOptions,
  typeOnChange,
  nodeId,
  setNodeId,
}: NodeMoreProps) => {
  const nodeIdIsValid = nodeId ? isURL(nodeId) : true;
  return (
    <Popover id="popover-basic">
      <Popover.Content>
        <div
          style={{
            width: '320px',
          }}
        >
          <h6>Select types:</h6>
          <Select
            options={typeOptions}
            onChange={typeOnChange}
            isMulti={true}
            defaultValue={typeSelectedOptions}
            isSearchable={true}
            menuPlacement="auto"
          />
          <h6 className="mt-3">Set RDF named node id (optional)</h6>
          <input
            className={classNames('form-control', { 'is-invalid': !nodeIdIsValid })}
            placeholder="http://example.com"
            value={nodeId || ''}
            onChange={(e) => setNodeId(e.target.value)}
          />
          {!nodeIdIsValid && <div className="invalid-feedback">Not a valid url</div>}
        </div>
      </Popover.Content>
    </Popover>
  );
};

interface NodeProps {
  path: Path;
  ann: DefaultRessourceDesc;
  fromRanges: string[];
  restrictionIds?: string[];
  isAction?: boolean;
  topNode?: boolean;
}

const NodeComponent = (props: NodeProps) => {
  const { path, ann, fromRanges, restrictionIds, topNode, isAction } = props;
  const { setPathVal, vocabHandler } = useContext(AnnotationContext);
  const [moreIsOpen, setMoreIsOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState('');
  const [isEmptyTypeSelect, setIsEmptyTypeSelect] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  try {
    // title
    const nodeDescriptions = vocabHandler.getDescrOfTypeNodes(ann.types);
    const nameOfNode = nodeDescriptions.map(({ name }) => name).join(', ');

    // type selection
    const subTypesDescr = sortNodeDetails(
      isEmptyTypeSelect || !vocabHandler.haveCommonSuperTypes(ann.types, fromRanges)
        ? vocabHandler.getDescOfSubClassesOfNodes(fromRanges)
        : vocabHandler.getClassesDescr(),
    );

    const typeOptions = subTypesDescr.map(({ id, name, description }) => ({
      value: id,
      label: name,
    }));
    const typeSelectedOptions = typeOptions.filter((opt) => ann.types.includes(opt.value));
    const typeOnChange = (options: Option[]) => {
      if (options && options.length > 0) {
        const newTypes = options.map(({ value }) => value);
        if (vocabHandler.haveCommonSuperTypes(newTypes, fromRanges)) {
          setPathVal({
            path: [...path, 'types'],
            value: newTypes,
          });
        } else {
          // eslint-disable-next-line no-alert
          window.alert(`Need to use at least one of "${fromRanges.join(', ')}" or subtypes thereof.`);
        }

        setIsEmptyTypeSelect(false);
      } else {
        setIsEmptyTypeSelect(true);
      }
    };

    // property selection
    const propertyOptions = vocabHandler.getPropetyObjForTypes(ann.types);
    const addPropertyClick = () => {
      const prop = selectedProp === '' ? selectRef.current?.value ?? '' : selectedProp;
      setPathVal(makeProperty(prop));
    };

    const makeProperty = (
      propId: string,
      value = '',
      index = ann.props.length,
    ): PathValue<RessourceDescProp> => {
      const range = vocabHandler.getDefaultRange(propId);
      const val: string | RessourceDesc = vocabHandler.isTerminalNode(range)
        ? value
        : {
            type: 'annotation',
            types: [range],
            props: [],
          };
      return {
        path: [...path, 'props', index],
        value: {
          type: 'annotation',
          id: uuid(),
          path: propId,
          val,
          range, // TODO
        },
      };
    };

    const makeRestrProperty = (propId: string, type?: TemplatePropertyGroupType): TemplateProperty => {
      const defaultRange = vocabHandler.getDefaultRange(propId);
      const range: TemplateRessourceDesc = {
        type: 'template',
        types: [defaultRange],
        props: [],
      };
      return {
        type: 'template',
        id: uuid(),
        path: propId,
        io: type,
        range: [range],
        required: true,
        multAllowed: false,
        minCount: 1, // from req/multAllowed
        maxCount: 1,
      };
    };

    const addTemplatePropClick = () => {
      const prop = selectedProp === '' ? selectRef.current?.value ?? '' : selectedProp;
      setPathVal({ path: [...path, 'props', ann.props.length], value: makeRestrProperty(prop) });
    };

    const addIOPropertyClick = (type: TemplatePropertyGroupType) => () => {
      const prop = selectedProp === '' ? selectRef.current?.value ?? '' : selectedProp;
      setPathVal({ path: [...path, type, ann?.[type]?.length || 0], value: makeRestrProperty(prop, type) });
    };

    // restrictions:
    const restrictions =
      ann.type === 'template' ? [] : vocabHandler.getRestrictionsForTypes(ann.types, restrictionIds);
    // add missing props
    const missingProps = restrictions
      .filter(
        (restr) =>
          restr.minCount && ann.props.filter((prop) => prop.path === restr.property).length < restr.minCount,
      )
      // TODO add for each missing minCount instead of just once
      .map((restr, i) => makeProperty(restr.property, restr.defaultValue, ann.props.length + i));
    // console.log(missingProps);

    if (missingProps.length > 0) {
      setPathVal(missingProps);
    }

    const numPropsWithSameId = (propId: string): number =>
      ann.props.filter((pr) => pr.path === propId).length;

    const canUseProp = (propId: string): boolean =>
      restrictions
        .filter((restr) => restr.property === propId && restr.maxCount)
        .every((restr) => (restr.maxCount ? restr.maxCount > numPropsWithSameId(propId) : true));

    const isTemplateNode = ann.type === 'template';

    const nodeId = ann.nodeId;
    const setNodeId = (val: string) =>
      setPathVal({
        path: [...path, 'nodeId'],
        value: val === '' ? undefined : val,
      });

    const onSortEnd: SortEndHandler = ({ oldIndex, newIndex }) => {
      setPathVal({ path: [...path, 'props'], value: arrayMove(ann.props, oldIndex, newIndex) });
    };

    const onSortEndIO = (type: TemplatePropertyGroupType): SortEndHandler => ({ oldIndex, newIndex }) => {
      if (ann[type]) {
        setPathVal({ path: [...path, type], value: arrayMove(ann[type] || [], oldIndex, newIndex) });
      }
    };

    return (
      <div className={classNames('typenode', { 'typenode-border': !topNode })}>
        <h4 className="p-1 d-flex" style={{ justifyContent: 'space-between' }}>
          <div className="d-flex flexCenterAlign">
            {nodeId && <span className="font-italic font-weight-light mr-1">{`<${nodeId}>`}</span>}
            <span>{nameOfNode || <span className="italicGrey">No Type</span>}</span>
            <OverlayTrigger
              rootClose
              trigger="click"
              placement="bottom-start"
              overlay={selectSubTypes({ typeOptions, typeSelectedOptions, typeOnChange, nodeId, setNodeId })}
              onEnter={() => setMoreIsOpen(true)}
              onExit={() => setMoreIsOpen(false)}
            >
              <button className="btn btn-light back-bor-white shadow-none px-1" title="more...">
                {moreIsOpen ? <FaAngleUp /> : <FaAngleDown />}
              </button>
            </OverlayTrigger>
          </div>
          <div>
            <div className="input-group">
              <select
                className="custom-select"
                value={selectedProp}
                onChange={(e) => setSelectedProp(e.target.value)}
                ref={selectRef}
              >
                {Object.values(propertyOptions).map(({ type, props }, i) => (
                  <optgroup key={i} label={type.name}>
                    {props.map((prop, j) => (
                      <option
                        disabled={!canUseProp(prop.id)}
                        key={j}
                        value={prop.id}
                        title={prop.description}
                        // style={}
                      >
                        {prop.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="input-group-append">
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={isTemplateNode ? addTemplatePropClick : addPropertyClick}
                >
                  Add
                </button>
              </div>
              {isAction && (
                <DropdownButton
                  as={InputGroup.Append}
                  variant="outline-primary"
                  title=""
                  id="input-group-dropdown-1"
                  className="mr-3 px-0 dropdown-add-as"
                >
                  <Dropdown.Item onClick={addIOPropertyClick('input')}>
                    <span className="px-1 pyb-1">Add as input</span>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={addIOPropertyClick('output')}>
                    <span className="px-1 pyb-1">Add as output</span>
                  </Dropdown.Item>
                </DropdownButton>
              )}
            </div>
          </div>
        </h4>
        {/*{ann.props.map((prop, index) => (*/}
        {/*  <Property*/}
        {/*    key={prop.id}*/}
        {/*    ann={ann}*/}
        {/*    prop={prop}*/}
        {/*    path={[...path, 'props', index]}*/}
        {/*    restrictions={*/}
        {/*      isTemplateProp(prop) ? [] : restrictions.filter((restr) => restr.property === prop.path)*/}
        {/*    }*/}
        {/*    numPropsWithSameId={numPropsWithSameId(prop.path)}*/}
        {/*  />*/}
        {/*))}*/}
        <SortableList onSortEnd={onSortEnd} useDragHandle>
          {ann.props.map((prop, index) => (
            <SortableListItem index={index} key={index}>
              <Property
                key={prop.id}
                ann={ann}
                prop={prop}
                path={[...path, 'props', index]}
                restrictions={
                  isTemplateProp(prop) ? [] : restrictions.filter((restr) => restr.property === prop.path)
                }
                numPropsWithSameId={numPropsWithSameId(prop.path)}
              />
            </SortableListItem>
          ))}
        </SortableList>
        {isAction &&
          (['input', 'output'] as ['input', 'output']).map((type) => (
            <div className="mt-5" key={type}>
              <h3 className="font-weight-bold text-capitalize">{type}</h3>
              {(ann?.[type]?.length || 0) > 0 ? (
                <SortableList onSortEnd={onSortEndIO(type)} useDragHandle>
                  {ann[type]?.map((restrProp, i) => (
                    <SortableListItem index={i} key={i}>
                      <Property
                        key={restrProp.id}
                        ann={ann}
                        prop={restrProp}
                        path={[...path, type, i]}
                        restrictions={[]}
                        numPropsWithSameId={0}
                      />
                    </SortableListItem>
                  ))}
                </SortableList>
              ) : (
                <span className="italicGrey">No {type} properties defined</span>
              )}
            </div>
          ))}
      </div>
    );
  } catch (e) {
    return <h1>Error: {e.toString()}</h1>;
  }
};

const Node = React.memo(
  NodeComponent,
  (prevProps, nextProps) => JSON.stringify(prevProps) === JSON.stringify(nextProps),
);

const selectRange = (
  options: string[],
  selectedOption: string,
  onChange: (val: string) => void,
  vocabHandler: VocabHandler,
) => (
  <Popover id="popover-basic">
    <Popover.Title>Select range</Popover.Title>
    <Popover.Content>
      <div
        style={{
          width: '320px',
        }}
      >
        <select className="custom-select" value={selectedOption} onChange={(e) => onChange(e.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {vocabHandler.usePrefix(option)}
            </option>
          ))}
        </select>
      </div>
    </Popover.Content>
  </Popover>
);

interface PropProps {
  path: Path;
  ann: DefaultRessourceDesc;
  prop: RessourceDescProp | TemplateProperty;
  restrictions: Restriction[];
  numPropsWithSameId: number;
}

const Property = (props: PropProps) => {
  const { prop, path, restrictions, numPropsWithSameId } = props;
  const { setPathVal, removePath, vocabHandler } = useContext(AnnotationContext);

  const [isSelectingRange, setIsSelectingRange] = useState(false);

  try {
    const propDetails = vocabHandler.getDescrOfPropNode(prop.path);
    const propName = escapeLineBreaks(propDetails.name);

    // range selection
    const rangeOptions = vocabHandler.getRanges(prop.path);
    const rangeSelectedOption = prop.range;
    const onChangeRangeSelection = (range: string) => {
      const val = vocabHandler.isTerminalNode(range)
        ? ''
        : {
            types: [range],
            props: [],
          };

      setPathVal([
        { path: [...path, 'val'], value: val },
        { path: [...path, 'range'], value: range },
      ]);
    };

    // remove click
    const removeProp = () => {
      let canRemove = isTemplateProp(prop)
        ? true
        : restrictions.every((restr) => (restr.minCount ? restr.minCount < numPropsWithSameId : true)) &&
          prop.state !== 'unremovable' &&
          prop.state !== 'disabled';
      if (canRemove) {
        removePath(path);
      } else {
        // eslint-disable-next-line no-alert
        alert(`Cannot remove ${prop.path}`);
      }
    };

    const withDelBtn = !isTemplateProp(prop)
      ? prop.state !== 'unremovable' && prop.state !== 'disabled'
      : true;

    return (
      <div className="d-block mb-4 p-1">
        <h5
          className="d-inline-block align-top"
          style={{
            width: '10rem',
          }}
        >
          <span
            style={{
              wordWrap: 'break-word',
              /* position: 'fixed', */
            }}
          >
            <DragHandle>{propName}</DragHandle>
          </span>
          {!isTemplateProp(prop) && rangeOptions.length > 1 && (
            <OverlayTrigger
              rootClose
              trigger="click"
              placement="bottom-start"
              overlay={selectRange(
                rangeOptions,
                rangeSelectedOption as string,
                onChangeRangeSelection,
                vocabHandler,
              )}
              onEnter={() => setIsSelectingRange(true)}
              onExit={() => setIsSelectingRange(false)}
            >
              <button className="btn btn-light back-bor-white shadow-none px-1 py-0">
                {isSelectingRange ? <FaAngleUp /> : <FaAngleDown />}
              </button>
            </OverlayTrigger>
          )}
        </h5>

        <div className="d-inline-block" style={{ width: 'calc(100% - 10rem)' }}>
          <div className="d-inline-block" style={{ width: 'calc(100% - 25px)' }}>
            <Range {...props} />
          </div>
          {withDelBtn && (
            <button type="button" className="close ml-2" title="Remove this property" onClick={removeProp}>
              <span aria-hidden="true">&times;</span>
            </button>
          )}
        </div>
      </div>
    );
  } catch (e) {
    return <h1>Error: {e.toString()}</h1>;
  }
};

interface TemplateProps extends PropProps {
  prop: TemplateProperty;
}

const isDefaultRange = (r: TemplatePropertyRange): r is TemplateRessourceDesc =>
  'type' in r && r.type === 'template';

const templateRangeSelectionPopover = ({ prop, path }: TemplateProps, context: AnnotationContext) => {
  const { setPathVal, removePath, vocabHandler, potTemplates } = context;
  const defaultRanges = vocabHandler.getRanges(prop.path);

  // selectedDefaultRange={prop.range.filter(isDefaultRange).types} */

  const newRangeClick = () =>
    setPathVal({
      path: [...path, 'range', prop.range.length],
      value: {
        type: 'template',
        types: [defaultRanges[0]],
        props: [],
      },
    });

  const newTemplateRangeClick = () =>
    setPathVal({
      path: [...path, 'range', prop.range.length],
      value: {
        templateId: potTemplates[0]?.id, // set it to first template
      },
    });

  const removeRange = (index: number) => removePath([...path, 'range', index]);

  return (
    <Popover id="popover-template-range-select">
      <Popover.Title className="d-flex flexSpaceBetween">
        <span>Select range </span>
        <Dropdown as={ButtonGroup}>
          <button className="btn btn-primary btn-sm" onClick={newRangeClick}>
            <FaPlus /> New range
          </button>
          <Dropdown.Toggle split variant="primary" id="dropdown-split-basic" />

          <Dropdown.Menu>
            <Dropdown.Item onClick={newRangeClick}>Normal range</Dropdown.Item>
            <Dropdown.Item
              onClick={newTemplateRangeClick}
              disabled={potTemplates.length === 0}
              title={
                potTemplates.length === 0 ? 'No templates available' : 'Choose from your existing template'
              }
            >
              Template range
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Popover.Title>
      <Popover.Content>
        <div
          style={{
            width: '320px',
          }}
        >
          {prop.range.map((range, i) => {
            const onChangeSelect = (val: string) =>
              setPathVal({
                path: [...path, 'range', i],
                value: {
                  type: 'template',
                  types: [val],
                  props: [],
                },
              });
            const onChangeTemplateSelect = (val: string) =>
              setPathVal({
                path: [...path, 'range', i],
                value: {
                  templateId: val,
                },
              });
            return (
              <div className="mb-3 d-flex flexSpaceBetween" key={i}>
                {isDefaultRange(range) ? (
                  <select
                    className="custom-select"
                    value={range.types.length > 1 ? 'mult' : range.types[0]}
                    onChange={(e) => onChangeSelect(e.target.value)}
                  >
                    {defaultRanges.map((option) => (
                      <option key={option} value={option}>
                        {vocabHandler.usePrefix(option)}
                      </option>
                    ))}
                    {range.types.length > 1 && <option value="mult">Multi-type</option>}
                  </select>
                ) : (
                  <select
                    className="custom-select"
                    value={range.templateId}
                    onChange={(e) => onChangeTemplateSelect(e.target.value)}
                  >
                    {potTemplates.map((potTemplate) => (
                      <option key={potTemplate.id} value={potTemplate.id}>
                        {potTemplate.name}
                      </option>
                    ))}
                  </select>
                )}
                {prop.range.length > 1 && (
                  <button
                    type="button"
                    className="close ml-2"
                    title="Remove this range"
                    onClick={() => removeRange(i)}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Popover.Content>
    </Popover>
  );
};

const TemplateRangeSelectionBtn = (props: TemplateProps) => {
  const {
    prop: { range },
  } = props;
  const context = useContext(AnnotationContext);
  const { vocabHandler, potTemplates } = context;

  const [isOpen, setIsOpen] = useState(false);
  const rangeText = (propRange: TemplatePropertyRange): string | JSX.Element =>
    isDefaultRange(propRange) ? (
      cutString(toReadableString(propRange.types.map(vocabHandler.usePrefix), ', '), 35)
    ) : (
      <>
        <b className="mr-1">Template:</b>
        {potTemplates.find((t) => t.id === propRange.templateId)?.name ?? (
          <span className="italicGrey">not found</span>
        )}
      </>
    );

  const btnText = range.length === 1 ? rangeText(range[0]) : 'Multiple ...';
  return (
    <OverlayTrigger
      rootClose
      trigger="click"
      placement="bottom-start"
      overlay={templateRangeSelectionPopover(props, context)}
      onEnter={() => setIsOpen(true)}
      onExit={() => setIsOpen(false)}
    >
      <button
        className="borderGrey py-1 px-2 btn btn-light back-bor-white shadow-none d-flex flexSpaceBetween"
        style={{ minWidth: '8rem', maxWidth: '13rem', textAlign: 'left' }}
        title="Select range ..."
      >
        <span className="hiddenOverflow">{btnText}</span>
        <div>{isOpen ? <FaAngleUp /> : <FaAngleDown />}</div>
      </button>
    </OverlayTrigger>
  );
};

type Changes = [string, string | boolean | number | undefined | string[]][];

const AdvRestrInput = (
  props: TemplateProps & {
    name: ShaclRestrProps;
    type: 'text' | 'number' | 'select' | 'enum';
    options?: string[];
    isMultiSelect?: boolean;
  },
) => {
  const { prop, path, name, type, ann, options, isMultiSelect } = props;
  const { setPathVal, vocabHandler } = useContext(AnnotationContext);

  const pathStr = path.join('.');

  const setVal = (arr: Changes) =>
    setPathVal(arr.map(([key, val]) => ({ path: [...path, key], value: val })));

  const onChange = (key: ShaclRestrProps | 'required' | 'multAllowed', val: string | number) => {
    const changes: Changes = [];
    if (key === 'minCount') {
      changes.push(['required', !(val === 0 || val === '')]);
    } else if (key === 'maxCount') {
      if (val === 1) {
        changes.push(['multAllowed', false]);
      } else if (val > 1) {
        changes.push(['multAllowed', true]);
      }
    }
    changes.push([key, val]);
    setVal(changes);
  };

  const renderInputField = () => {
    switch (type) {
      case 'number':
      case 'text':
        return (
          <input
            placeholder={type}
            type={type}
            className="form-control form-control-sm"
            id={pathStr + name}
            value={prop[name]?.toString() || ''}
            onChange={(e) =>
              onChange(
                name,
                type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value,
              )
            }
          />
        );
      case 'select': {
        let selectOptions = options
          ? options.map((o) => ({ value: o, label: o }))
          : (ann[prop.io || 'props'] ?? [])
              .filter(({ id }) => id !== prop.id)
              .map(({ path: propPath }) => ({ value: propPath, label: vocabHandler.usePrefix(propPath) }));
        return (
          <Select
            className="mb-1"
            options={selectOptions}
            defaultValue={selectOptions.filter(({ value }) =>
              prop[name as SchaclRestrPairProps]?.includes(value),
            )}
            onChange={(e: any) => {
              const newValues = e ? toArray(e as any)?.map(({ value }) => value) : [];
              const changes: Changes = [[name, newValues.length > 0 ? newValues : undefined]];
              setVal(changes);
            }}
            isMulti={isMultiSelect !== false}
            isClearable={true}
            isSearchable={true}
          />
        );
      }
      case 'enum':
        return (
          <CreatableSelect
            className="mb-1"
            values={prop[name as SchaclRestrOtherProps] ?? []}
            onChange={(values) => {
              const changes: Changes = [[name, values.length > 0 ? values : undefined]];
              setVal(changes);
            }}
          />
        );

      default:
        return <h1>Not found</h1>;
    }
  };

  return (
    <div className="form-group row ml-0 mb-0">
      <label htmlFor={pathStr + name} className="col-sm-4 col-form-label">
        {name}
      </label>
      <div className="col-sm-8">{renderInputField()}</div>
    </div>
  );
};

const TemplateRange = (props: TemplateProps & { nodeRangeOptions: string[] }) => {
  const { nodeRangeOptions, prop, path } = props;
  const { setPathVal, vocabHandler, potTemplates } = useContext(AnnotationContext);

  const pathStr = path.join('.');

  const setVal = (arr: Changes) =>
    setPathVal(arr.map(([key, val]) => ({ path: [...path, key], value: val })));

  const shaclNodeKinds = [
    'BlankNode',
    'IRI',
    'Literal',
    'BlankNodeOrIRI',
    'BlankNodeOrLiteral',
    'IRIOrLiteral',
  ];

  return (
    <>
      <div className="d-flex flexSpaceBetween mb-2">
        <div className="">
          <TemplateRangeSelectionBtn {...props} prop={prop} />
        </div>
        <div className="mr-4">
          <CheckBox
            className=""
            id={`${pathStr}-req`}
            name="Required"
            checked={prop.required}
            setChecked={(checked) => {
              const changes: Changes = [];
              if (checked && prop.minCount === 0) {
                changes.push(['minCount', 1]);
              } else if (!checked) {
                changes.push(['minCount', 0]);
              }
              changes.push(['required', checked]);
              setVal(changes);
            }}
          />
          <CheckBox
            className="pl-2"
            id={`${pathStr}-mult`}
            name="Multiple allowed"
            checked={prop.multAllowed}
            setChecked={(checked) => {
              const changes: Changes = [];
              if (checked) {
                changes.push(['maxCount', undefined]);
              } else if (!checked) {
                changes.push(['maxCount', 1]);
              }
              changes.push(['multAllowed', checked]);
              setVal(changes);
            }}
          />
          <ModalBtn
            btnClassName="btn btn-light back-bor-white shadow-none px-1 py-0 ml-1"
            btnTitle="advanced"
            btnContent={() => <FaEllipsisH />}
            modalTitle="Advanced Restrictions (Property)"
            modalSize="lg"
          >
            <div className="mx-0">
              <div className="px-0">
                <h6 className="font-weight-bold mt-2">Non-validating properties</h6>
                <AdvRestrInput name="name" type="text" {...props} />
                <AdvRestrInput name="description" type="text" {...props} />
                <AdvRestrInput name="defaultValue" type="text" {...props} />
                <h6 className="font-weight-bold mt-2">General</h6>
                <AdvRestrInput
                  name="nodeKind"
                  type="select"
                  options={shaclNodeKinds}
                  isMultiSelect={false}
                  {...props}
                />
                <h6 className="font-weight-bold mt-2">Cardinality</h6>
                <AdvRestrInput name="minCount" type="number" {...props} />
                <AdvRestrInput name="maxCount" type="number" {...props} />
                <h6 className="font-weight-bold mt-2">Value Range</h6>
                <AdvRestrInput name="minExclusive" type="number" {...props} />
                <AdvRestrInput name="minInclusive" type="number" {...props} />
                <AdvRestrInput name="maxExclusive" type="number" {...props} />
                <AdvRestrInput name="maxInclusive" type="number" {...props} />
                <h6 className="font-weight-bold mt-2">Other</h6>
                <AdvRestrInput name="in" type="enum" {...props} />
                <AdvRestrInput name="hasValue" type="enum" {...props} />
              </div>
              <div className="px-0">
                <h6 className="font-weight-bold mt-2">String Based</h6>
                <AdvRestrInput name="minLength" type="number" {...props} />
                <AdvRestrInput name="maxLength" type="number" {...props} />
                <AdvRestrInput name="pattern" type="text" {...props} />
                <h6 className="font-weight-bold mt-2">Property Pair</h6>
                <AdvRestrInput name="equals" type="select" {...props} />
                <AdvRestrInput name="disjoint" type="select" {...props} />
                <AdvRestrInput name="lessThan" type="select" {...props} />
                <AdvRestrInput name="lessThanOrEquals" type="select" {...props} />
              </div>
            </div>
          </ModalBtn>
        </div>
      </div>

      {prop.range
        .map((range, i) => {
          const key = [...path, i].join('');
          if (isDefaultRange(range)) {
            if (range.types.length === 1 && vocabHandler.isTerminalNode(range.types[0])) {
              // only when more than 1 range, else see in range select button
              if (prop.range.length > 1) {
                // case Text or URL
                return <h4 key={key}>{vocabHandler.usePrefix(range.types[0])}</h4>;
              }
              return <></>; // case Text
            }

            return <Node key={key} fromRanges={nodeRangeOptions} path={[...path, 'range', i]} ann={range} />;
          }

          if (prop.range.length > 1) {
            return (
              <div key={key}>
                <b className="mr-1">Template:</b>
                {potTemplates.find((t) => t.id === range.templateId)?.name ?? (
                  <span className="italicGrey">not found</span>
                )}
              </div>
            );
          }
          return <></>;
        })
        .reduce(joinReduction(<b key={uuid()}>or</b>) as any)}
    </>
  );
};

const Range = (props: PropProps) => {
  const { prop, path, restrictions } = props;
  const { setPathVal, vocabHandler } = useContext(AnnotationContext);

  try {
    const nodeRangeOptions = vocabHandler
      .getRanges(prop.path)
      .filter((range) => !vocabHandler.isTerminalNode(range));

    if (isTemplateProp(prop)) {
      return <TemplateRange {...props} nodeRangeOptions={nodeRangeOptions} prop={prop} />;
    }

    const onChange = (val: string) => {
      setPathVal({ path: [...path, 'val'], value: val });
    };

    const isTerminal = vocabHandler.isTerminalNode(prop.range);

    const isDisabled = prop.state === 'disabled';

    const valueInRestr = restrictions.filter((restr) => restr.valueIn)[0];
    if (
      isTerminal &&
      typeof prop.val === 'string' &&
      valueInRestr &&
      valueInRestr.valueIn &&
      valueInRestr.valueIn.length > 0
    ) {
      return getEnumField(
        prop.val,
        valueInRestr.valueIn.map((v) => ({ id: v, name: v, description: v })),
        onChange,
        isDisabled,
      );
    }

    const enumNodes = vocabHandler.getEnumNode(prop.range);
    if (enumNodes && typeof prop.val === 'string') {
      if (enumNodes.length > 0) {
        return getEnumField(prop.val, enumNodes, onChange, isDisabled);
      }
      return getInputField(prop.range, prop.val, onChange, vocabHandler, isDisabled);
    }

    if (isTerminal && typeof prop.val === 'string') {
      return getInputField(prop.range, prop.val, onChange, vocabHandler, isDisabled);
    }

    const restrIds = restrictions.flatMap(
      (restr) =>
        restr?.propertyRanges
          ?.filter((prRange) => prRange.nodeId === prop.range) // not sure if we need this line
          .flatMap((prRange) => prRange.restrictionIds || []) ?? [],
    );

    if (typeof prop.val !== 'string') {
      return (
        <Node
          fromRanges={nodeRangeOptions}
          path={[...path, 'val']}
          ann={prop.val}
          restrictionIds={restrIds}
        />
      );
    }
    return <h1>Error: Something went wrong</h1>;
  } catch (e) {
    return <h1>Error: {e.toString()}</h1>;
  }
};

const getEnumField = (
  value: string,
  options: NodeDetails[],
  onChange: (val: string) => void,
  isDisabled: boolean,
) => (
  <select
    className="custom-select"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={isDisabled}
  >
    <option value="">select a value ...</option>
    {options.map((enumVal, i) => (
      <option key={enumVal.id} value={enumVal.id} title={enumVal.description}>
        {enumVal.name}
      </option>
    ))}
  </select>
);

const getInputField = (
  type: string,
  value: string,
  onChange: (val: string) => void,
  vocabHandler: VocabHandler,
  disabled: boolean,
) => {
  const className = classNames({
    'form-control': true,
    'input-highlight': false,
  });
  switch (type) {
    case p.schemaInteger:
    case p.schemaNumber:
    case p.schemaFloat:
    case p.xsdDecimal:
    case p.xsdInteger:
      return (
        <input
          disabled={disabled}
          type="number"
          className={className}
          placeholder={vocabHandler.usePrefix(type)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case p.schemaBoolean:
    case p.xsdBoolean: // TODO revisit boolean, maybe select
      return (
        <div className="form-check">
          <input
            disabled={disabled}
            className="form-check-input"
            type="checkbox"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case p.schemaDate:
    case p.xsdDate:
      return (
        <DateTime
          inputProps={{ disabled: disabled }}
          timeFormat={false}
          defaultValue={new Date()}
          value={value}
          onChange={(e) => typeof e !== 'string' && onChange(e.format('YYYY-MM-DD'))}
        />
      );
    case p.schemaDateTime:
    case p.xsdDateTime:
      return (
        <DateTime
          inputProps={{ disabled: disabled }}
          defaultValue={new Date()}
          value={value ? new Date(value) : new Date()}
          onChange={(e) => typeof e !== 'string' && onChange(e.toISOString())}
        />
      );
    case p.schemaTime:
    case p.xsdTime:
      return (
        <DateTime
          inputProps={{ disabled: disabled }}
          dateFormat={false}
          defaultValue={new Date()}
          value={value}
          onChange={(e) => typeof e !== 'string' && onChange(e.format('HH:mm'))}
        />
      );
    case p.xsdString:
    case p.xsdAnyURI:
    case p.schemaURL:
    case p.schemaText:
    case p.rdfsLiteral:
    case p.rdfLangString:
    default:
      return (
        <input
          disabled={disabled}
          type="text"
          className={className}
          placeholder={vocabHandler.usePrefix(type)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
};
