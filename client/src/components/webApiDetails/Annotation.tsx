import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import set from 'lodash/set';
import get from 'lodash/get';
import Select from 'react-select';
import { FaAngleUp, FaAngleDown, FaPlus } from 'react-icons/fa';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import DateTime from 'react-datetime';
import uuid from 'uuid/v1';
import DropdownButton from 'react-bootstrap/DropdownButton';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import split from 'split.js';

import {
  AnnotationSrc,
  AnnotationSrcProp,
  TemplateProperty,
  TemplatePropertyGroupType,
  TemplatePropertyRange,
  ShaclRestrProps,
  SchaclRestrPairProps,
  SchaclRestrOtherProps,
  WebApiConfig,
} from '../../../../server/src/models/WebApi';
import VocabHandler, { sortNodeDetails, NodeDetails, Restriction } from '../../util/VocabHandler';
import { clone, toArray, escapeLineBreaks, cutString, toReadableString, Optional } from '../../util/utils';
import * as p from '../../util/rdfProperties';

import '../../styles/annotation.css';
import 'react-datetime/css/react-datetime.css';
import { annSrcToAnnJsonLd, isTemplateProp } from '../../util/webApi';
import CheckBox from '../Checkbox';
import { joinReduction } from '../../util/jsxHelpers';
import CreatableSelect from '../CreatableSelect';
import Editor from '../Editor';

interface Props {
  baseType: string;
  annotation: AnnotationSrc;
  setAnnotation: (ann: AnnotationSrc) => void;
  vocabHandler: VocabHandler;
  config: WebApiConfig;
}

type Path = (string | number)[];
type PathValue<T = any> = { path: Path; value: T };
type SetPathVal = (pv: PathValue | PathValue[]) => void;
type RemovePath = (path: Path) => void;

const Annotation = ({ baseType, annotation: ann, setAnnotation: setAnn, vocabHandler, config }: Props) => {
  useEffect(() => {
    if (config.showCodeEditor) {
      split([`#split1`, `#split2`], { sizes: [60, 40], minSize: [100, 100] });
    }
  }, [config.showCodeEditor]);

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
      const props = get(newAnn, fatherPath);
      props.splice(indexToRemove, 1);
      set(newAnn, fatherPath, props);
      setAnn(newAnn);
    };

    const getNode = () => (
      <Node
        path={[]}
        vocabHandler={vocabHandler}
        ann={ann}
        fromRanges={[baseType]}
        setPathVal={setPathVal}
        removePath={removePath}
      />
    );

    return (
      <>
        {config.showCodeEditor ? (
          <div className="d-flex">
            <div className="split" id="split1">
              {getNode()}
            </div>
            <div className="split" id="split2">
              <Editor
                mode="json"
                readOnly={true}
                height="100%"
                maxLines={Infinity}
                value={JSON.stringify(annSrcToAnnJsonLd(ann, vocabHandler), null, 2)}
              />
            </div>
          </div>
        ) : (
          getNode()
        )}
        {/* <br />
        <pre>{JSON.stringify(ann, null, 2)}</pre>
        <pre>{JSON.stringify(annSrcToAnnJsonLd(ann, vocabHandler), null, 2)}</pre>
        <pre>
          {JSON.stringify(annJsonLDToAnnSrc(annSrcToAnnJsonLd(ann, vocabHandler), vocabHandler), null, 2)}
        </pre> */}
      </>
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

const selectSubTypes = (options: Option[], selectedOptions: Option[], onChange: (val: any) => void) => (
  <Popover id="popover-basic">
    <Popover.Content>
      <div
        style={{
          width: '320px',
        }}
      >
        <Select
          options={options}
          onChange={onChange}
          isMulti={true}
          defaultValue={selectedOptions}
          isSearchable={true}
        />
      </div>
    </Popover.Content>
  </Popover>
);

interface NodeProps {
  path: Path;
  ann: AnnotationSrc;
  fromRanges: string[];
  vocabHandler: VocabHandler;
  setPathVal: SetPathVal;
  removePath: RemovePath;
  restrictionIds?: string[];
}

const Node = ({ path, ann, fromRanges, setPathVal, removePath, vocabHandler, restrictionIds }: NodeProps) => {
  const [isSelectingType, setIsSelectingType] = useState(false);
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
    const onChangeTypeSelection = (options: Option[]) => {
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
    ): PathValue<AnnotationSrcProp> => {
      const range = vocabHandler.getDefaultRange(propId);
      const val = vocabHandler.isTerminalNode(range)
        ? value
        : {
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
      const range: AnnotationSrc = {
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

    const addIOPropertyClick = (type?: TemplatePropertyGroupType) => () => {
      const prop = selectedProp === '' ? selectRef.current?.value ?? '' : selectedProp;
      setPathVal({ path: [...path, 'props', ann.props.length], value: makeRestrProperty(prop, type) });
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

    const isTemplateNode = ann.type !== 'template';

    return (
      <div className={classNames('typenode', { 'typenode-border': true })}>
        <h4 className="p-1 d-flex" style={{ justifyContent: 'space-between' }}>
          <div className="d-flex">
            <span style={{ lineHeight: 1.5 }}>
              {nameOfNode || <span className="italicGrey">No Type</span>}
            </span>
            <OverlayTrigger
              rootClose
              trigger="click"
              placement="bottom-start"
              overlay={selectSubTypes(typeOptions, typeSelectedOptions, onChangeTypeSelection)}
              onEnter={() => setIsSelectingType(true)}
              onExit={() => setIsSelectingType(false)}
            >
              <button className="btn btn-light back-bor-white shadow-none px-1">
                {isSelectingType ? <FaAngleUp /> : <FaAngleDown />}
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
                  onClick={isTemplateNode ? addPropertyClick : addIOPropertyClick()}
                >
                  Add
                </button>
              </div>
              {isTemplateNode && (
                <DropdownButton
                  as={InputGroup.Append}
                  variant="outline-primary"
                  title=""
                  id="input-group-dropdown-1"
                  className="mr-3 px-0 dropdown-add-as"
                >
                  <Dropdown.Item onClick={addIOPropertyClick('input')}>
                    <span className="borderInput px-2 py-1">Add as input</span>
                  </Dropdown.Item>
                  <Dropdown.Divider />

                  <Dropdown.Item onClick={addIOPropertyClick('output')}>
                    {' '}
                    <span className="borderOutput px-2 py-1">Add as output</span>
                  </Dropdown.Item>
                </DropdownButton>
              )}
            </div>
          </div>
        </h4>
        {ann.props.map((prop, index) => (
          <Property
            key={prop.id}
            ann={ann}
            prop={prop}
            path={[...path, 'props', index]}
            restrictions={
              isTemplateProp(prop) ? [] : restrictions.filter((restr) => restr.property === prop.path)
            }
            numPropsWithSameId={numPropsWithSameId(prop.path)}
            vocabHandler={vocabHandler}
            setPathVal={setPathVal}
            removePath={removePath}
          />
        ))}
      </div>
    );
  } catch (e) {
    return <h1>Error: {e.toString()}</h1>;
  }
};

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
  ann: AnnotationSrc;
  prop: AnnotationSrcProp | TemplateProperty;
  restrictions: Restriction[];
  numPropsWithSameId: number;
  vocabHandler: VocabHandler;
  setPathVal: SetPathVal;
  removePath: RemovePath;
}

const Property = (props: PropProps) => {
  const { prop, path, vocabHandler, setPathVal, removePath, restrictions, numPropsWithSameId } = props;
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
      const canRemove = isTemplateProp(prop)
        ? true
        : restrictions.every((restr) => (restr.minCount ? restr.minCount < numPropsWithSameId : true));
      if (canRemove) {
        removePath(path);
      } else {
        // eslint-disable-next-line no-alert
        alert(`Cannot remove ${prop.path}`);
      }
    };

    const getBorder = (io?: TemplatePropertyGroupType): Optional<string> =>
      io && { input: 'borderInput', output: 'borderOutput' }[io];

    return (
      <div className={classNames('d-block mb-4 p-1', prop.type === 'template' && getBorder(prop.io))}>
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
            {propName}
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
          <button type="button" className="close ml-2" title="Remove this property" onClick={removeProp}>
            <span aria-hidden="true">&times;</span>
          </button>
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

const isDefaultRange = (r: TemplatePropertyRange): r is AnnotationSrc => 'type' in r && r.type === 'template';

const templateRangeSelectionPopover = ({
  vocabHandler,
  prop,
  path,
  setPathVal,
  removePath,
}: TemplateProps) => {
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

  const removeRange = (index: number) => removePath([...path, 'range', index]);

  return (
    <Popover id="popover-template-range-select">
      <Popover.Title className="d-flex flexSpaceBetween">
        <span>Select range </span>
        <button className="btn btn-primary btn-sm" onClick={newRangeClick}>
          <FaPlus /> new range
        </button>
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
            if (isDefaultRange(range)) {
              return (
                <div className="mb-3 d-flex flexSpaceBetween" key={i}>
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
            }
            return <h1>Range not supported</h1>;
          })}
        </div>
      </Popover.Content>
    </Popover>
  );
};

const TemplateRangeSelectionBtn = (props: TemplateProps) => {
  const {
    prop: { range },
    vocabHandler,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const rangeText = (propRange: TemplatePropertyRange): string =>
    isDefaultRange(propRange)
      ? cutString(toReadableString(propRange.types.map(vocabHandler.usePrefix), ', '), 35)
      : 'Custom ...';

  const btnText = range.length === 1 ? rangeText(range[0]) : 'Multiple ...';
  return (
    <OverlayTrigger
      rootClose
      trigger="click"
      placement="bottom-start"
      overlay={templateRangeSelectionPopover(props)}
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
  props: TemplateProps & { name: ShaclRestrProps; type: 'text' | 'number' | 'select' | 'enum' },
) => {
  const { prop, path, setPathVal, name, type, ann, vocabHandler } = props;
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
        const options = ann.props
          .filter(({ id }) => id !== prop.id)
          .map(({ path: propPath }) => ({ value: propPath, label: vocabHandler.usePrefix(propPath) }));
        return (
          <Select
            className="mb-1"
            options={options}
            defaultValue={options.filter(({ value }) => prop[name as SchaclRestrPairProps]?.includes(value))}
            onChange={(e: any) => {
              const newValues = (e as null | Option[])?.map(({ value }) => value) ?? [];
              const changes: Changes = [[name, newValues.length > 0 ? newValues : undefined]];
              setVal(changes);
            }}
            isMulti={true}
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
  const [isAdvancedView, setIsAdvancedView] = useState(false);

  const { nodeRangeOptions, prop, path, vocabHandler, setPathVal, removePath } = props;
  const pathStr = path.join('.');

  const setVal = (arr: Changes) =>
    setPathVal(arr.map(([key, val]) => ({ path: [...path, key], value: val })));

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
          <button
            className="btn btn-light back-bor-white shadow-none px-1 py-0 ml-1"
            onClick={() => setIsAdvancedView(!isAdvancedView)}
            title="advanced"
          >
            {isAdvancedView ? <FaAngleUp /> : <FaAngleDown />}
          </button>
        </div>
      </div>
      {isAdvancedView && (
        <div className="typenode-border mb-3 p-2">
          <h5>Advanced Restrictions</h5>
          <div className="mx-0">
            <div className="px-0">
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
        </div>
      )}
      {prop.range
        .map((range, i) => {
          const key = [...path, i].join('');
          if (isDefaultRange(range)) {
            if (range.types.length === 1 && vocabHandler.isTerminalNode(range.types[0])) {
              // only when more than 1 range, else see in range select button
              if (prop.range.length > 1) {
                return <h4 key={key}>{vocabHandler.usePrefix(range.types[0])}</h4>;
              }
              return <></>;
            }

            return (
              <Node
                key={key}
                fromRanges={nodeRangeOptions}
                path={[...path, 'range', i]}
                vocabHandler={vocabHandler}
                ann={range}
                setPathVal={setPathVal}
                removePath={removePath}
              />
            );
          }
          return <h1>Unexpected range</h1>;
        })
        .reduce(joinReduction(<b key={uuid()}>or</b>) as any)}
    </>
  );
};

const Range = (props: PropProps) => {
  const { prop, path, vocabHandler, setPathVal, removePath, restrictions } = props;

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
      );
    }
    if (isTerminal && typeof prop.val === 'string') {
      return getInputField(prop.range, prop.val, onChange, vocabHandler);
    }
    const enumNodes = vocabHandler.getEnumNode(prop.range);
    if (enumNodes && typeof prop.val === 'string') {
      if (enumNodes.length > 0) {
        return getEnumField(prop.val, enumNodes, onChange);
      }
      return getInputField(prop.range, prop.val, onChange, vocabHandler);
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
          vocabHandler={vocabHandler}
          ann={prop.val}
          restrictionIds={restrIds}
          setPathVal={setPathVal}
          removePath={removePath}
        />
      );
    }
    return <h1>Error: Something went wrong</h1>;
  } catch (e) {
    return <h1>Error: {e.toString()}</h1>;
  }
};

const getEnumField = (value: string, options: NodeDetails[], onChange: (val: string) => void) => (
  <select className="custom-select" value={value} onChange={(e) => onChange(e.target.value)}>
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
          defaultValue={new Date()}
          value={value ? new Date(value) : new Date()}
          onChange={(e) => typeof e !== 'string' && onChange(e.toISOString())}
        />
      );
    case p.schemaTime:
    case p.xsdTime:
      return (
        <DateTime
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
          type="text"
          className={className}
          placeholder={vocabHandler.usePrefix(type)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
};
