import {
  SPPEvaluator,
  fromJsonLD,
  evalPath,
  Literal,
  NamedNode,
  takeAll,
  toTerm,
  getGraph,
} from 'sparql-property-paths';
import fs from 'fs';

import {
  Action,
  ActionRessourceDesc,
  ExpandedTemplateProperty,
  ExpandedTemplateRessourceDesc,
  ExpendedActionRessourceDesc,
  Template,
  TemplateProperty,
  TemplateRessourceDesc,
} from '../../models/WebApi';
import { fromArray } from '../utils';

const newSdoAdapter = fs.readFileSync(__dirname + '/newVocabHandler.js', 'utf-8');

const Hook = require('./hook');

Hook.placeHook((content: any, filename: any, done: any) => {
  if (filename.includes('vocabularyHandler')) {
    //console.log({content, filename});
    done(newSdoAdapter);
  } else {
    done();
  }
});

let GraphComplianceVerification: any;
let kgvUtilities: any;
try {
  GraphComplianceVerification = require('kgv-private/assets/GraphComplianceVerification');
  kgvUtilities = require('kgv-private/assets/utilities');
} catch (e) {
  // use public package
  GraphComplianceVerification = require('kgv-public/assets/GraphComplianceVerification');
  kgvUtilities = require('kgv-public/assets/utilities');
}

const getNodeIdOfCompletedAction = (graph: any) => {
  const actionIds = [
    ...takeAll(
      evalPath(graph, [
        undefined,
        new NamedNode('http://schema.org/actionStatus'),
        new Literal('http://schema.org/CompletedActionStatus'),
      ]),
    ),
    ...takeAll(
      evalPath(graph, [
        undefined,
        new NamedNode('http://schema.org/actionStatus'),
        new Literal('http://schema.org/FailedActionStatus'),
      ]),
    ),
  ];

  if (actionIds.length !== 1 || !actionIds?.[0]?.[0]?.value) {
    throw new Error(
      'Action has no or more than 1 schema:actionStatus CompletedActionStatus/FailedActionStatus',
    );
  }

  const actionId = actionIds[0][0].value;
  return actionId;
};

const getNodeIdOfActiveAction = (graph: any) => {
  const actionIds = [
    ...takeAll(
      evalPath(graph, [
        undefined,
        new NamedNode('http://schema.org/actionStatus'),
        new Literal('http://schema.org/ActiveActionStatus'),
      ]),
    ),
  ];

  if (actionIds.length !== 1 || !actionIds?.[0]?.[0]?.value) {
    throw new Error('Action has no or more than 1 schema:actionStatus ActiveActionStatus');
  }

  const actionId = actionIds[0][0].value;
  return actionId;
};

const actionToDataGraph = async (action: string, type: 'input' | 'output') => {
  const graph = await getGraph(action, 'jsonld');
  const triples: any = await graph.serialize({ format: 'json' });

  const root = type === 'input' ? getNodeIdOfActiveAction(graph) : getNodeIdOfCompletedAction(graph);

  const quads = JSON.parse(triples).map((t: any) => [...t, root]);

  let data = kgvUtilities.transformBlankNodeQuads(quads);
  data = kgvUtilities.processDataGraphBulk(data);

  return data[0];
};

export interface VerificationError {
  name: string;
  description: string;
  path: string;
}

export type VerificationReport = VerificationError[];

export const validateAction = async (
  action: string,
  potAction: Action['annotationSrc'],
  templates: Template[],
  type: 'input' | 'output',
): Promise<VerificationError[]> => {
  const dataGraph = await actionToDataGraph(action, type);
  const ds = actionToDomainSpecification(potAction, templates, type);
  // console.log(JSON.stringify(ds, null, 2));
  const verificationReport = await GraphComplianceVerification.isGraphValidAgainstDomainSpecification(
    dataGraph,
    ds,
    false,
    'ds',
  );
  // console.log(verificationReport);
  if (verificationReport['ds:errors']) {
    return verificationReport['ds:errors'].map((e: any) => ({
      name: e['schema:name'],
      description: e['schema:description'],
      path: e['ds:dsPath'],
    }));
  }
  return [];
};

const toDsUri = (uri: string) =>
  uri.replace(/^http:\/\/schema.org\//, 'schema:').replace('http://www.w3.org/2001/XMLSchema#', 'xsd:');

const srcPropToDSProp = (prop: ExpandedTemplateProperty): any => {
  const dsProp: any = {
    '@type': 'sh:PropertyShape',
    'sh:path': toDsUri(prop.path),
    'sh:or': prop.range.map((range) => {
      if (range.types.length === 1 && range.types[0].startsWith('http://www.w3.org/2001/XMLSchema#')) {
        return { 'sh:datatype': toDsUri(range.types[0]) };
      }
      const dsRange: any = {};
      if (range.types.length === 1 && toDsUri(toDataType(range.types[0])).startsWith('xsd:')) {
        dsRange['sh:datatype'] = toDsUri(toDataType(range.types[0]));
      } else {
        dsRange['sh:class'] = fromArray(range.types.map(toDataType).map(toDsUri));
      }

      if (range.props.length > 0) {
        dsRange['sh:node'] = {
          '@type': 'sh:NodeShape',
          'sh:property': range.props.map((p) => srcPropToDSProp(p)),
        };
      }
      return dsRange;
    }),
  };

  let inOrProps = [
    'minExclusive',
    'minInclusive',
    'maxExclusive',
    'maxInclusive',
    'minLength',
    'maxLength',
    'in',
    'hasValue',
  ] as const;
  inOrProps.forEach((p) => {
    if (prop[p]) {
      for (const o of dsProp['sh:or']) {
        o[`sh:${p}`] = prop[p];
      }
    }
  });

  let outerProps = ['minCount', 'maxCount'] as const;
  outerProps.forEach((p) => {
    if (prop[p]) {
      dsProp[`sh:${p}`] = prop[p];
    }
  });

  return dsProp;
};

const actionToDomainSpecification = (
  action: Action['annotationSrc'],
  templates: Template[],
  type: 'input' | 'output',
) => {
  const expandedActionAnnSrc = expandUsedActionTemplates(action, templates);
  const targetClass = fromArray(action.types.map(toDsUri));

  const actionStatusProp = {
    '@type': 'sh:PropertyShape',
    'sh:minCount': 1,
    'sh:path': 'schema:actionStatus',
    'sh:or': [
      {
        'sh:datatype': 'xsd:string',
        'sh:in':
          type === 'input'
            ? ['http://schema.org/ActiveActionStatus']
            : ['http://schema.org/CompletedActionStatus', 'http://schema.org/FailedActionStatus'],
      },
    ],
    'sh:maxCount': 1,
  };

  const ds: any = {
    '@context': dsContext,
    '@graph': [
      {
        '@id': '_:RootNode',
        '@type': ['sh:NodeShape', 'schema:CreativeWork'],
        'schema:author': {
          '@type': 'schema:Person',
          'schema:name': 'name',
          'schema:memberOf': {
            '@type': 'schema:Organization',
            'schema:name': 'org',
          },
        },
        'schema:name': 'ActionDS',
        'schema:description': 'action ds',
        'schema:schemaVersion': 'https://schema.org/version/9.0/',
        'ds:usedVocabularies': [],
        'schema:version': 1,
        'sh:targetClass': targetClass,
        'sh:property': [actionStatusProp, ...expandedActionAnnSrc[type].map(srcPropToDSProp)],
      },
    ],
  };

  return ds;
};

const dsContext = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  sh: 'http://www.w3.org/ns/shacl#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  schema: 'http://schema.org/',
  ds: 'http://vocab.sti2.at/ds/',
  'ds:usedVocabularies': {
    '@id': 'ds:usedVocabularies',
    '@type': '@id',
  },
  'sh:targetClass': {
    '@id': 'sh:targetClass',
    '@type': '@id',
  },
  'sh:property': {
    '@id': 'sh:property',
  },
  'sh:path': {
    '@id': 'sh:path',
    '@type': '@id',
  },
  'sh:datatype': {
    '@id': 'sh:datatype',
    '@type': '@id',
  },
  'sh:node': {
    '@id': 'sh:node',
  },
  'sh:class': {
    '@id': 'sh:class',
    '@type': '@id',
  },
  'sh:or': {
    '@id': 'sh:or',
    '@container': '@list',
  },
  'sh:in': {
    '@id': 'sh:in',
    '@container': '@list',
  },
  'sh:languageIn': {
    '@id': 'sh:languageIn',
    '@container': '@list',
  },
  'sh:equals': {
    '@id': 'sh:equals',
    '@type': '@id',
  },
  'sh:disjoint': {
    '@id': 'sh:disjoint',
    '@type': '@id',
  },
  'sh:lessThan': {
    '@id': 'sh:lessThan',
    '@type': '@id',
  },
  'sh:lessThanOrEquals': {
    '@id': 'sh:lessThanOrEquals',
    '@type': '@id',
  },
};

// copied from client/src/util/toAnnotation
export const expandUsedActionTemplates = (
  ann: ActionRessourceDesc,
  templates: Template[],
): ExpendedActionRessourceDesc => ({
  ...ann,
  input: ann.input?.map((t) => expandTemplateProp(t, templates)),
  output: ann.output?.map((t) => expandTemplateProp(t, templates)),
});

export const expandTemplateRessource = (
  template: TemplateRessourceDesc,
  templates: Template[],
): ExpandedTemplateRessourceDesc => ({
  ...template,
  props: template.props.map((prop) => expandTemplateProp(prop, templates)),
});

export const expandTemplateProp = (
  prop: TemplateProperty,
  templates: Template[],
): ExpandedTemplateProperty => {
  return {
    ...prop,
    range: prop.range.map((range) => {
      if ('templateId' in range) {
        const template = templates.find((template) => template.id === range.templateId);
        if (!template) {
          throw new Error(`Template <${range.templateId}> not found`);
        }
        return expandTemplateRessource(template.src, templates);
      }
      return expandTemplateRessource(range, templates);
    }),
  };
};

const toDataType = (s: string): string =>
  (({
    'http://schema.org/Text': 'http://www.w3.org/2001/XMLSchema#string',
    'http://schema.org/Boolean': 'http://www.w3.org/2001/XMLSchema#boolean',
    'http://schema.org/Date': 'http://www.w3.org/2001/XMLSchema#date',
    'http://schema.org/DateTime': 'http://www.w3.org/2001/XMLSchema#dateTime',
    'http://schema.org/Time': 'http://www.w3.org/2001/XMLSchema#time',
    'http://schema.org/Number': 'http://www.w3.org/2001/XMLSchema#double',
    'http://schema.org/Float': 'http://www.w3.org/2001/XMLSchema#float',
    'http://schema.org/Integer': 'http://www.w3.org/2001/XMLSchema#integer',
    'http://schema.org/URL': 'http://www.w3.org/2001/XMLSchema#anyURI',
  } as any)[s] || s);
