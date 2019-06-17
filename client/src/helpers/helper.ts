import { set, get } from 'lodash';
import brace from 'brace';

import { INode, INodeValue } from './Vocab';
import {
  flatten2DArr,
  flatten3DArr,
  flattenObject,
  isDefined,
  makeArray,
  notEmpty,
  Optional,
  removeUndef,
} from './util';
import * as p from './properties';

export const makeIdArr = (...str: string[]) => str.map((s) => ({ '@id': s }));

export const removeNS = (str: string): string => {
  const lastOfUrl = str.split('/').pop();
  const lastOfURLHash = lastOfUrl ? lastOfUrl.split('#').pop() : '';
  const lastOfNS = lastOfURLHash ? lastOfURLHash.split(':').pop() : '';
  return lastOfNS || '';
};

export const getNameOfNode = (node: INode): string => removeNS(node['@id']);

export const getDescriptionOfNode = (node: INode): string => {
  const comment = node[p.rdfsComment] as Optional<INodeValue[]>;
  if (comment && comment[0] && comment[0]['@value']) {
    return stripHtml(comment[0]['@value']);
  }
  return '';
};

export const stripHtml = (html: string): string => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export const extractIds = (o: any) =>
  makeArray(o)
    .filter((n) => n && n['@id'])
    .map((n: INode) => n['@id']);

export const isTextNode = (node: INode) => {
  const shClass = node[p.shClass] as Optional<INodeValue[]>;
  return shClass && shClass[0] && shClass[0]['@id'] === p.schemaText;
};

export const setProp = (object: any, property: string, value: string) => {
  const old = get(object, property);
  if (notEmpty(old)) {
    if (Array.isArray(old)) {
      old.push(value);
      set(object, property, old);
    } else if (typeof old === 'string' || typeof old === 'object') {
      set(object, property, [old, value]);
    }
  } else {
    set(object, property, value);
  }
};

export const isReplaceable = (obj: any): boolean => {
  const entries = Object.entries(obj);
  return (
    entries.length === 1 &&
    entries[0][0] === '@id' &&
    typeof entries[0][1] === 'string' &&
    entries[0][1].startsWith('_:')
  );
};

export interface IRestrictionRange {
  nodeId: string;
  restrictionIds?: string[];
}

export interface IRestriction {
  id: string;
  property: string;
  propertyRanges?: IRestrictionRange[];
  rangeIsIdNode: boolean;
  // propertyRangeIn: IRestrictionRange[];
  defaultValue?: string;
  valueIn?: string[];
  minCount?: number;
  maxCount?: number;
  pattern?: string;
  minInclusive?: number;
  maxInclusive?: number;
}

/*
const toIdNode = (str: string) => ({
  '@id': str,
});

const toIdNodeArr = (str: string) => [
  {
    '@id': str,
  },
];
*/

export const makePropertyRestrictionObj = (shProp: INode): IRestriction => {
  const pRanges: IRestrictionRange[] = [];

  const nodeClass: INodeValue[] = (shProp[p.shClass] as INodeValue[]) || [];
  const nodeDatatype: INodeValue[] =
    (shProp[p.shDatatype] as INodeValue[]) || [];
  const nodeRanges = nodeClass.concat(nodeDatatype);
  if (nodeRanges.length > 0) {
    const pRangeIds = extractIds(nodeRanges);
    pRangeIds.forEach((pRangeId) => {
      const pRange: IRestrictionRange = {
        nodeId: pRangeId,
        restrictionIds:
          extractIds(shProp[p.shNode]) ||
          (shProp['sh:property'] && shProp['@id']) ||
          undefined,
      };
      pRanges.push(pRange);
    });
  }

  const nodeOrs = shProp[p.shOr] as INodeValue[] | undefined;
  if (nodeOrs && nodeOrs.length > 0) {
    const orRestrNodes = filterUndef(
      nodeOrs
        .map((n) => n['@list'])
        .filter((n) => n && typeof n[0] !== 'string')
        .map((n) =>
          filterUndef(
            (n as INode[])
              .map((listItem) => makePropertyRestrictionObj(listItem))
              .map((listItemRestr) => listItemRestr.propertyRanges),
          ),
        ),
    );
    if (orRestrNodes) {
      pRanges.push(...flatten3DArr(orRestrNodes));
    }
  }

  const minCount = shProp[p.shMinCount] as INodeValue[];
  const maxCount = shProp[p.shMaxCount] as INodeValue[];
  const maxInclusive = shProp[p.shMaxInclusive] as INodeValue[];
  const minInclusive = shProp[p.shMinInclusive] as INodeValue[];
  const valueIn = shProp[p.shIn] as INodeValue[];
  const defaultValue = shProp[p.shDefaultValue] as INodeValue[];
  const path = shProp[p.shPath] as INode[]; // since it must have an @id prop
  const pattern = shProp[p.shPattern] as INodeValue[];
  let valueInValues: string[] = [];
  if (valueIn && Array.isArray(valueIn)) {
    valueInValues = filterUndef(
      flatten2DArr(
        (valueIn as INodeValue[])
          .filter((v) => v['@list'])
          .map((v) => v['@list'])
          .map((v) => (v as INodeValue[]).map((i: INodeValue) => i['@value'])),
      ),
    );
  }

  return {
    id: shProp['@id'],
    rangeIsIdNode: extractIds(shProp[p.shNodeKind]).includes(p.shIRI),
    property: path && path[0] && path[0]['@id'],
    propertyRanges: pRanges.length > 0 ? pRanges : undefined,
    defaultValue: defaultValue && defaultValue[0] && defaultValue[0]['@id'],
    valueIn: valueInValues.length > 0 ? valueInValues : undefined,
    minCount:
      (minCount &&
        minCount[0]['@value'] &&
        parseInt(minCount[0]['@value'], 10)) ||
      undefined, // or undef since the value can be and empty string
    maxCount:
      (maxCount &&
        maxCount[0]['@value'] &&
        parseInt(maxCount[0]['@value'], 10)) ||
      undefined,
    minInclusive:
      (minInclusive &&
        minInclusive[0]['@value'] &&
        parseInt(minInclusive[0]['@value'], 10)) ||
      undefined,
    maxInclusive:
      (maxInclusive &&
        maxInclusive[0]['@value'] &&
        parseInt(maxInclusive[0]['@value'], 10)) ||
      undefined,
    pattern: pattern && pattern[0]['@value'],
  };
};

const removeDashIO = (str: string): string => str.split('-')[0];

export const isEqProp = (a: string, b: string): boolean =>
  removeDashIO(a) === removeDashIO(b);

const pathSeparator = '$';
export const joinPaths = (pathArr: string[]): string =>
  pathArr.join(pathSeparator);

interface IgenerateJSONLDOptions {
  pathStartsWith?: string;
  makeJsonldArray?: boolean;
}

export const generateJSONLD = (
  docEleId: string,
  options?: IgenerateJSONLDOptions,
): { jsonld: any; complete: boolean } => {
  const docEle = document.getElementById(docEleId);
  if (!docEle) {
    return { jsonld: undefined, complete: false };
  }

  let complete = true;
  const jsonld: any = options && options.makeJsonldArray ? [] : {};
  const terminals = docEle.querySelectorAll('[data-path]');
  terminals.forEach((t: Element) => {
    let { path } = (t as HTMLElement).dataset;
    const { value } = (t as HTMLElement).dataset;
    if (path && !value) {
      complete = false;
    }
    if (!path || !value) {
      return;
    }
    if (
      options &&
      options.pathStartsWith &&
      path.startsWith(options.pathStartsWith)
    ) {
      path = path.replace(`${options.pathStartsWith}${pathSeparator}`, '');
      set(jsonld, path.split(pathSeparator), value);
    } else {
      set(jsonld, path.split(pathSeparator), value);
    }
  });
  return { jsonld, complete };
};

export function filterUndef<T>(ts: (T | undefined)[]): T[] {
  return ts.filter((t: T | undefined): t is T => !!t);
}

export const getPropertyValues = (
  node: INode,
  properties: string[],
): string[] =>
  extractIds(
    flatten2DArr((Object.entries(node)
      .filter(([key]) => properties.includes(key))
      .map(([key, val]) => val) as unknown) as INodeValue[][]),
  );

export const getRanges = (node: INode): string[] =>
  getPropertyValues(node, p.ranges);

export const getDomains = (node: INode): string[] =>
  getPropertyValues(node, p.domains);

export const nodeBelongsToNS = (node: INode, ns: p.Namespace) =>
  node['@id'].startsWith(p.commonNamespaces[ns]);

export const isTerminalNode = (nodeId: string) =>
  p.terminalNodes.includes(nodeId);

export interface IPropertyValueSpecification {
  defaultValue?: string;
  maxValue?: number;
  minValue?: number;
  multipleValuesAllowed?: boolean;
  valueMaxLength?: number;
  valueMinLength?: number;
  valuePattern?: string;
  valueRequired?: boolean;
}

export const getPVSMatchFromRegex = (str: string): undefined | string => {
  const match = str.match(/default=(\S*)/);
  if (match && match.length > 2) {
    return match[1];
  }
  return;
};

export const transformPropertyValueSpecification = (
  pvs: string | IPropertyValueSpecification,
): IPropertyValueSpecification => {
  if (typeof pvs === 'string') {
    return removeUndef({
      defaultValue: getPVSMatchFromRegex('default'),
      maxValue: Number(getPVSMatchFromRegex('max')),
      minValue: Number(getPVSMatchFromRegex('min')),
      multipleValuesAllowed: getPVSMatchFromRegex('multiple'),
      valueMaxLength: Number(getPVSMatchFromRegex('maxlength')),
      valueMinLength: Number(getPVSMatchFromRegex('minlength')),
      valuePattern: getPVSMatchFromRegex('pattern'),
      valueRequired: pvs.includes('required'),
    });
  }
  return pvs;
};

export const validatePVS = (
  str: string,
  pvs: IPropertyValueSpecification,
): string | undefined => {
  if (pvs.valueRequired && str === '') {
    return 'Value is required';
  }
  if (pvs.maxValue && Number(str) > pvs.maxValue) {
    return `Value cannot be bigger then ${pvs.maxValue}.`;
  }
  if (pvs.minValue && Number(str) < pvs.minValue) {
    return `Value cannot be bigger then ${pvs.minValue}.`;
  }
  if (pvs.valueMaxLength && str.length > pvs.valueMaxLength) {
    return `Value cannot be longer then ${pvs.valueMaxLength} characters.`;
  }
  if (pvs.valueMinLength && str.length < pvs.valueMinLength) {
    return `Value cannot be shorter then ${pvs.valueMinLength} characters.`;
  }
  if (pvs.valuePattern && !new RegExp(pvs.valuePattern).test(str)) {
    return `Value doesn't match pattern ${pvs.valuePattern}.`;
  }
  return;
};

export const getIOProps = (
  annotation: object,
  io: 'input' | 'output',
): {
  path: string;
  pvs: IPropertyValueSpecification;
}[] =>
  Object.entries(
    flattenObject(annotation, '$', undefined, 'PropertyValueSpecification'),
  )
    .filter(([k]) => k.endsWith(`-${io}`))
    .sort(([k1], [k2]) => k1.localeCompare(k2))
    .map(([k, v]) => ({
      path: k.replace(`-${io}`, ''),
      pvs: transformPropertyValueSpecification(v as
        | string
        | IPropertyValueSpecification),
    }));

interface IMappingResponse {
  requestMapping: object;
  responseMapping: object;
}

const getEditorValue = (
  editorId: string,
  isJSON = true,
): string | undefined => {
  try {
    const editor = brace.edit(editorId);
    return JSON.parse(editor.getValue());
  } catch (e) {
    return undefined;
  }
};

const getDomValue = (domId: string): string => {
  const elem = document.getElementById(domId) as HTMLInputElement;
  return elem && elem.value !== undefined ? elem.value : '';
};

export const getMappings = (domIds: string[]): IMappingResponse[] =>
  domIds
    .map((domId) => {
      const method = getDomValue(`${domId}-httpSelectMethod`);
      const url = getDomValue(`${domId}-baseUrl`);
      const path = getEditorValue(`${domId}-editor-path`);
      const query = getEditorValue(`${domId}-editor-query`);
      const header = getEditorValue(`${domId}-editor-header`);
      const payload = getEditorValue(`${domId}-editor-payload`);
      const header_resp = getEditorValue(`${domId}-editor-header-response`);
      const payload_resp = getEditorValue(`${domId}-editor-payload-response`);

      return {
        requestMapping: {
          method,
          url,
          path,
          query,
          headers: header,
          body: payload,
        },
        responseMapping: {
          headers: header_resp,
          body: payload_resp,
        },
      };
    })
    .filter(isDefined);
