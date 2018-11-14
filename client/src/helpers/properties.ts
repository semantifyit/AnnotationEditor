import { joinNS } from './helper';

export const rdfProperty = joinNS('rdf', 'Property');

export const rdfsLabel = joinNS('rdfs', 'label');
export const rdfsSubClassOf = joinNS('rdfs', 'subClassOf');

export const schemaURL = joinNS('schema', 'URL');
export const schemaDomainIncludes = joinNS('schema', 'domainIncludes');
export const schemaEnumeration = joinNS('schema', 'Enumeration');
export const schemaQuantity = joinNS('schema', 'Quantity');
export const schemaDataType = joinNS('schema', 'DataType');
export const schemaRangeIncludes = joinNS('schema', 'rangeIncludes');
export const schemaText = joinNS('schema', 'Text');
export const schemaAction = joinNS('schema', 'Action');
export const schemaPropertyValueSpecification = joinNS(
  'schema',
  'PropertyValueSpecification',
);

export const shDatatype = joinNS('sh', 'datatype');
export const shClass = joinNS('sh', 'class');
export const shNodeKind = joinNS('sh', 'nodeKind');
export const shNodeShape = joinNS('sh', 'NodeShape');
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
