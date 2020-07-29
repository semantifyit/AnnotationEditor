import VocabHandler from './VocabHandler';

export type Namespace = 'xsd' | 'rdf' | 'rdfs' | 'owl' | 'schema' | 'sh' | 'wasa';

export const commonNamespaces = {
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  schema: 'http://schema.org/',
  sh: 'http://www.w3.org/ns/shacl#',
  wasa: 'https://vocab.sti2.at/wasa/',
};

type PropertyObj<T extends string> = { [P in T]: string };

const toProperties = <T extends string>(prefix: string, properties: T[]): PropertyObj<T> =>
  Object.fromEntries(properties.map((p) => [p, prefix + p])) as any;

export const joinNS = (namespace: Namespace, nodeId: string): string => commonNamespaces[namespace] + nodeId;

// XSD
export const xsdString = joinNS('xsd', 'string');
export const xsdDecimal = joinNS('xsd', 'decimal');
export const xsdInteger = joinNS('xsd', 'integer');
export const xsdBoolean = joinNS('xsd', 'boolean');
export const xsdDate = joinNS('xsd', 'date');
export const xsdTime = joinNS('xsd', 'time');
export const xsdDateTime = joinNS('xsd', 'dateTime');
export const xsdAnyURI = joinNS('xsd', 'anyURI');

export const xsd = toProperties(commonNamespaces.xsd, [
  'string',
  'decimal',
  'integer',
  'float',
  'double',
  'boolean',
  'date',
  'time',
  'dateTime',
  'anyURI',
]);

// RDF
export const rdfProperty = joinNS('rdf', 'Property');
export const rdfLangString = joinNS('rdf', 'langString');

// RDFS
export const rdfsLabel = joinNS('rdfs', 'label');
export const rdfsComment = joinNS('rdfs', 'comment');
export const rdfsClass = joinNS('rdfs', 'Class');
export const rdfsSubClassOf = joinNS('rdfs', 'subClassOf');
export const rdfsRange = joinNS('rdfs', 'range');
export const rdfsDomain = joinNS('rdfs', 'domain');
export const rdfsLiteral = joinNS('rdfs', 'Literal');

// SCHEMA
export const schemaBoolean = joinNS('schema', 'Boolean');
export const schemaDate = joinNS('schema', 'Date');
export const schemaTime = joinNS('schema', 'Time');
export const schemaDateTime = joinNS('schema', 'DateTime');
export const schemaFloat = joinNS('schema', 'Float');
export const schemaNumber = joinNS('schema', 'Number');
export const schemaInteger = joinNS('schema', 'Integer');
export const schemaURL = joinNS('schema', 'URL');
export const schemaDomainIncludes = joinNS('schema', 'domainIncludes');
export const schemaEnumeration = joinNS('schema', 'Enumeration');
export const schemaQuantity = joinNS('schema', 'Quantity');
export const schemaDataType = joinNS('schema', 'DataType');
export const schemaRangeIncludes = joinNS('schema', 'rangeIncludes');
export const schemaText = joinNS('schema', 'Text');
export const schemaAction = joinNS('schema', 'Action');
export const schemaWebAPI = joinNS('schema', 'WebAPI');
export const schemaPropertyValueSpecification = joinNS('schema', 'PropertyValueSpecification');

export const schema = toProperties(commonNamespaces.schema, [
  'Boolean',
  'Date',
  'Time',
  'DateTime',
  'Float',
  'Number',
  'Integer',
  'URL',
  'domainIncludes',
  'Enumeration',
  'Quantity',
  'DataType',
  'rangeIncludes',
  'Text',
  'Action',
  'WebAPI',
  'PropertyValueSpecification',
]);

// SHACL
export const shDatatype = joinNS('sh', 'datatype');
export const shClass = joinNS('sh', 'class');
export const shNodeKind = joinNS('sh', 'nodeKind');
export const shNodeShape = joinNS('sh', 'NodeShape');
export const shPropertyShape = joinNS('sh', 'PropertyShape');
export const shSPARQLTargetType = joinNS('sh', 'SPARQLTargetType');
export const shIRI = joinNS('sh', 'IRI');
export const shPath = joinNS('sh', 'path');
export const shDefaultValue = joinNS('sh', 'defaultValue');
export const shIn = joinNS('sh', 'in');
export const shOr = joinNS('sh', 'or');
export const shMinInclusive = joinNS('sh', 'minInclusive');
export const shMaxInclusive = joinNS('sh', 'maxInclusive');
export const shPattern = joinNS('sh', 'pattern');
export const shNode = joinNS('sh', 'node');
export const shMinCount = joinNS('sh', 'minCount');
export const shMaxCount = joinNS('sh', 'maxCount');
export const shProperty = joinNS('sh', 'property');
export const shTarget = joinNS('sh', 'target');
export const shSelect = joinNS('sh', 'select');
export const shTargetClass = joinNS('sh', 'targetClass');
export const shTargetNode = joinNS('sh', 'targetNode');
export const shShapesGraph = joinNS('sh', 'shapesGraph');

export const sh = toProperties(commonNamespaces.sh, [
  'datatype',
  'class',
  'nodeKind',
  'NodeShape',
  'PropertyShape',
  'SPARQLTargetType',
  'IRI',
  'path',
  'defaultValue',
  'in',
  'or',
  'minInclusive',
  'maxInclusive',
  'pattern',
  'node',
  'minCount',
  'maxCount',
  'property',
  'target',
  'select',
  'targetClass',
  'targetNode',
  'shapesGraph',
  'group',
  'inversePath',
  'zeroOrMorePath',
  'oneOrMorePath',
  'zeroOrOnePath',
  'alternativePath',
]);

// OWL
export const owlClass = joinNS('owl', 'Class');
export const owlDatatypeProperty = joinNS('owl', 'DatatypeProperty');
export const owlObjectProperty = joinNS('owl', 'Class');

// Action / WASA
export const wasa = toProperties(commonNamespaces.wasa, [
  'source',
  'target',
  'propertyMapping',
  'from',
  'to',
  'iterator',
  'actionShape',
  'Input',
  'Output',
  'ActionLink',
  'PropertyMap',
  'script',
  'condition',
  'SPARQLImplementation',
  'JavaScriptImplementation',
]);

// Property groups
export const ranges = [schemaRangeIncludes, rdfsRange];
export const domains = [schemaDomainIncludes, rdfsDomain];
export const classes = [rdfsClass, owlClass];
export const properties = [rdfProperty, owlDatatypeProperty, owlObjectProperty];

export const specialCaseTerminals = [schemaQuantity];

export const terminalNodes = [
  // XSD
  xsdBoolean,
  xsdDate,
  xsdDateTime,
  xsdDecimal,
  xsdBoolean,
  xsdInteger,
  xsdString,
  xsdTime,
  xsdAnyURI,
  // RDF
  rdfLangString,
  // RDFs
  rdfsLiteral,
  // Schema
  schemaText,
  schemaURL,
  schemaNumber,
  schemaFloat,
  schemaInteger,
  schemaBoolean,
  schemaDate,
  schemaTime,
  schemaDateTime,
  // special case schema
  schemaQuantity,
  // own terminals
];

export const getDefaultVocabHandler = () =>
  new VocabHandler([], {
    schema: 'http://schema.org/',
    wasa: 'https://vocab.sti2.at/wasa/',
  });
