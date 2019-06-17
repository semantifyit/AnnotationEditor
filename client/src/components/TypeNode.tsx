import * as React from 'react';
import uuidv1 from 'uuid/v1';

import { INode } from '../helpers/Vocab';
import {
  getNameOfNode,
  removeNS,
  getDescriptionOfNode,
  joinPaths,
  IRestriction,
  isEqProp,
  generateJSONLD,
  nodeBelongsToNS,
} from '../helpers/helper';

import PropertyNode from './PropertyNode';
import DropDownSelect, { ISingleOption } from './DropDownSelect';
import { IContext, VocabContext } from '../helpers/VocabContext';
import { flatten2DArr } from '../helpers/util';

interface IProps {
  nodeId: string;
  withBorder?: boolean;
  path: string[];
  canUseDashIOProps: boolean;
  additionalRestrictionIds?: string[];
  isIdPropNode?: boolean;
  changedType?(newTypes: string[]): void;
}

interface IProperty {
  nodeId: string;
  uid: string;
  defaultValue?: string;
}

interface IState {
  nodeIds: string[];
  propertyIds: IProperty[];
  selectedProp: string;
}

class TypeNode extends React.Component<IProps, IState> {
  public static contextType = VocabContext;
  public context: IContext;
  public state: IState = {
    nodeIds: [this.props.nodeId],
    propertyIds: [],
    selectedProp: '',
  };

  public restrictions: IRestriction[] = [];
  public existingMembersIds: string[] = [];
  public nodeUid = uuidv1();
  public baseUID = `baseid-${joinPaths(this.props.path)}-${this.nodeUid}`;
  public nodeRestrictionIds: string[] = [];

  public componentDidMount() {
    this.update();
  }

  public update() {
    const nodes: INode[] = this.state.nodeIds
      .map((n) => this.context.vocab.getNode(n) || undefined)
      .filter((n) => n !== undefined) as INode[]; // as INode since tsc can't properly understand the filter

    if (nodes.length === 0) {
      return;
    }

    /*
    const canUseDashIOProps =
      this.props.canUseDashIOProps ||
      this.context.vocab.nodesCanUseIOProps(nodes);
    */

    // since the node changed, reset the list of properties
    // reset the selected element for the select box
    const propNode = Object.entries(
      this.context.vocab.getPropertyNodeForType(this.props.nodeId),
    ).filter(([k, v]) => v.length > 0);

    const selectedProp = propNode.length > 0 ? propNode[0][1][0]['@id'] : '@id';

    this.setState({ nodeIds: [this.props.nodeId], selectedProp });

    // restrictions
    this.updateRestrictions();
    if (nodes.some((n) => this.context.vocab.isEnumNode(n))) {
      this.existingMembersIds = this.context.vocab
        .getMembersOfTypes(this.state.nodeIds)
        .map((n) => n['@id']);
      if (
        /*this.existingMembersIds.length > 0 ||  this.props.isIdPropNode && */ // also add @id for enums without members (e.g. businessFunction)
        nodeBelongsToNS(nodes[0], 'schema') // only add members for schema.org enumeration types
      ) {
        this.addProperty('@id');
      }
    }
  }

  public useRestrictions(
    restrictions: IRestriction[],
    resetProperties?: string[],
  ) {
    let properties: IProperty[] = [];
    restrictions.forEach((r) => {
      // only add if it doesn't already have that property (or minCount amount)
      if (
        r.minCount &&
        this.state.propertyIds.filter(({ nodeId }) => nodeId === r.property)
          .length < r.minCount
      ) {
        for (let i = 0; i < r.minCount; i += 1) {
          // maybe use foreach or smth
          properties.push({
            uid: uuidv1(),
            nodeId: r.property,
            defaultValue: r.defaultValue,
          });
        }
      }
    });

    properties = properties.filter((p) => this.canUseAnotherProp(p.nodeId));
    // if (properties.length !== 0) { // with it it doesn't remove props on @id change
    if (resetProperties && resetProperties.length > 0) {
      this.setState((state) => ({
        propertyIds: state.propertyIds
          .filter((prop) => resetProperties.includes(prop.nodeId))
          .concat(properties),
      }));
    } else {
      this.setState((state) => ({
        propertyIds: state.propertyIds.concat(properties),
      }));
    }

    // this.state.propertyIds = this.state.propertyIds.concat(properties);
    // }
  }

  public updateRestrictions(nIds?: string[]) {
    const nodeIds = nIds || this.state.nodeIds;
    const restrictions = this.context.vocab.getRestrictionsForTypes(
      nodeIds,
      this.props.additionalRestrictionIds,
    );
    // console.log(restrictions);
    this.restrictions = restrictions;
    // add properties
    this.useRestrictions(restrictions);
    this.forceUpdate(); // since we set this.restrictions and render reads from it.
    // probably better to put restrictions in state

    // sparql restrictions
    // Since the previous restrictions aren't set yet, and we need them for the sparql stuff we sleep a bit and try to find
    // the newly set nodes. In the current case of only one sparql restriction needing a previous restriction this is fine.
    // sorry gods of programming for this code
    setTimeout(async () => {
      const jsonld = generateJSONLD(this.baseUID, {
        pathStartsWith: joinPaths(this.props.path),
      }).jsonld;
      const sparqlRestrictions = await this.context.vocab.getSparqlRestrictionsForTypes(
        nodeIds,
        this.props.additionalRestrictionIds,
        jsonld,
      );
      this.restrictions = this.restrictions.concat(sparqlRestrictions);
      this.useRestrictions(sparqlRestrictions);
    }, 10);
  }

  public removeProp = (propUid: string, propId: string) => {
    const otherPropsWithSameId = this.state.propertyIds.filter(
      (p) => p.nodeId === propId,
    ).length;
    const canRemoveProp = this.restrictions
      .filter((r) => r.property === propId && r.minCount)
      .reduce(
        (acc, cur) =>
          acc && (cur.minCount ? cur.minCount < otherPropsWithSameId : false),
        true,
      );

    if (!canRemoveProp) {
      alert(`Cannot remove ${propId}`);
      return;
    }
    this.setState((state) => ({
      propertyIds: state.propertyIds.filter((p) => p.uid !== propUid),
    }));
  };

  public addPropertyClick = () => {
    this.addProperty(this.state.selectedProp);
  };

  public canUseAnotherProp = (propId: string): boolean =>
    this.restrictions
      .filter((r) => r.property === propId && r.maxCount)
      .reduce(
        (acc: boolean, cur) =>
          acc &&
          (cur.maxCount
            ? cur.maxCount >
              this.state.propertyIds.filter((p) => p.nodeId === propId).length
            : false),
        true,
      );

  public addProperty = (propId: string) => {
    const canUseAnotherProp = this.canUseAnotherProp(propId);

    if (!canUseAnotherProp) {
      alert(`Cannot use another ${propId}`);
      return;
    }

    this.setState((state) => {
      const uid = uuidv1();
      const propertyIds = state.propertyIds.concat({
        uid,
        nodeId: propId,
      });
      const selectedProp =
        !this.canUseAnotherProp(propId) || propId === '@id'
          ? ''
          : state.selectedProp;
      return { propertyIds, selectedProp };
    });
  };

  public changedTypesSelection = (e: ISingleOption[]) => {
    if (e.length > 0) {
      const newNodeIds = e.map((o) => o.value);
      this.setState({ nodeIds: newNodeIds });
      this.updateRestrictions(newNodeIds);
      if (this.props.changedType) {
        this.props.changedType(newNodeIds);
      }
    }
  };

  public getStyleOfSelectProp = (prop: INode) => {
    const propHasRestrictions = this.restrictions.some((r) =>
      isEqProp(r.property, prop['@id']),
    );
    if (!this.canUseAnotherProp(prop['@id'])) {
      // this shouldn't matter, since we set the option to disabled
      return { color: 'grey', fontStyle: 'italic' };
    }
    if (propHasRestrictions) {
      return { background: 'rgb(255,255,153)' };
    }
    return {};
  };

  public propValueChanged = (propId: string, propValue: string) => {
    if (propId === '@id') {
      const nodeRestrictions = this.context.vocab.getRestrictionsForNode(
        propValue,
      );
      this.restrictions = this.restrictions
        .filter(({ id }) => !this.nodeRestrictionIds.includes(id))
        .concat(nodeRestrictions);
      this.nodeRestrictionIds = nodeRestrictions.map((r) => r.id);
      this.useRestrictions(nodeRestrictions, ['@id']);
    }
  };

  public render() {
    const nodes: INode[] = this.state.nodeIds
      .map((n) => this.context.vocab.getNode(n) || undefined)
      .filter((n) => n !== undefined) as INode[]; // as INode since tsc can't properly understand the filter

    if (nodes.length === 0) {
      return <h1> Node not found </h1>;
    }
    const canUseDashIOProps =
      this.props.canUseDashIOProps ||
      this.context.vocab.nodesCanUseIOProps(nodes);

    const propertyNodeObj = Object.entries(
      this.context.vocab.getPropertyNodeForTypes(this.state.nodeIds),
    ).filter(([k, v]) => v.length > 0);

    let selectedProp = this.state.selectedProp;

    if (selectedProp === '') {
      if (propertyNodeObj.length > 0) {
        selectedProp = propertyNodeObj[0][1][0]['@id'];
      } else {
        selectedProp = '@id';
      }
    }
    if (nodes.length === 0) {
      return <h1>Node not found</h1>;
    }
    const typeSelectOptions = this.context.vocab
      .getSubClasses(this.props.nodeId)
      .map((c) => ({
        value: c,
        label: removeNS(c),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const divStyle = {
      border: this.props.withBorder ? '1px solid lightgrey' : '',
      borderRadius: this.props.withBorder ? '5px' : '',
      padding: '10px',
    };

    const typeTitle = nodes.map((n) => getNameOfNode(n)).join(', ');
    const typeHeader =
      nodes.length > 2
        ? `${nodes
            .slice(0, 2)
            .map((n) => getNameOfNode(n))
            .join(', ')}...`
        : typeTitle;

    const recommendedProps = flatten2DArr(
      propertyNodeObj.map(([, props]) => props),
    ).filter((prop) =>
      this.restrictions.some((r) => isEqProp(r.property, prop['@id'])),
    );

    return (
      <div style={divStyle} id={this.baseUID}>
        {!this.props.isIdPropNode && (
          <div>
            {nodes.map((n, i) => {
              const path =
                nodes.length > 1
                  ? joinPaths(this.props.path.concat('@type', i.toString()))
                  : joinPaths(this.props.path.concat('@type'));
              return <div key={i} data-value={n['@id']} data-path={path} />;
            })}
            <div className="row">
              <h4 title={typeTitle}>{typeHeader} </h4>
              {typeSelectOptions.length > 1 && (
                <DropDownSelect
                  multiSelect={true}
                  selectOptions={typeSelectOptions}
                  selectedOptions={typeSelectOptions.filter((o) =>
                    this.state.nodeIds.includes(o.value),
                  )}
                  onChangeSelection={this.changedTypesSelection}
                />
              )}
              <div className="col-sm-6 col-sm-offset-6  pull-right">
                <div className="input-group">
                  <select
                    className="custom-select"
                    value={selectedProp}
                    onChange={(e) =>
                      this.setState({ selectedProp: e.target.value })
                    }
                  >
                    >
                    {recommendedProps.length > 0 && (
                      <optgroup label="Recommended">
                        {recommendedProps.map((prop, i) => (
                          <option
                            disabled={!this.canUseAnotherProp(prop['@id'])}
                            key={i}
                            value={prop['@id']}
                            title={getDescriptionOfNode(prop)}
                          >
                            {getNameOfNode(prop)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {propertyNodeObj.map(([type, propArr], i) => (
                      <optgroup key={i} label={removeNS(type)}>
                        {propArr.map((prop, j) => (
                          <option
                            disabled={!this.canUseAnotherProp(prop['@id'])}
                            key={j}
                            value={prop['@id']}
                            title={getDescriptionOfNode(prop)}
                            style={this.getStyleOfSelectProp(prop)}
                          >
                            {getNameOfNode(prop)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <optgroup label="General">
                      <option
                        title="IRI of the resource"
                        value="@id"
                        disabled={this.state.propertyIds.some(
                          ({ nodeId }) => nodeId === '@id',
                        )}
                      >
                        @id
                      </option>
                    </optgroup>
                  </select>
                  <div className="input-group-append">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={this.addPropertyClick}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {this.state.propertyIds.map((propId, i) => {
          const propIds = this.state.propertyIds.slice(0); // clone array
          propIds.splice(i, 1);
          const existOtherPropsWithSamePropId = propIds
            .map((p) => p.nodeId)
            .includes(propId.nodeId);
          let propsBefore;
          if (existOtherPropsWithSamePropId) {
            propsBefore = this.state.propertyIds
              .map((p) => p.nodeId)
              .slice(0, i)
              .filter((id) => id === propId.nodeId).length;
          }
          return (
            <PropertyNode
              existingMembersIds={
                propId.nodeId === '@id' && nodeBelongsToNS(nodes[0], 'schema')
                  ? this.existingMembersIds
                  : []
              }
              nodeId={propId.nodeId}
              uid={propId.uid}
              key={propId.uid}
              path={this.props.path}
              removeProp={this.removeProp}
              arrIndex={propsBefore}
              canUseDashIOProps={canUseDashIOProps}
              restriction={this.restrictions.filter(
                (r) => isEqProp(r.property, propId.nodeId), // func call because of -input -output props
              )}
              valueChanged={this.propValueChanged}
            />
          );
        })}
      </div>
    );
  }
}

export default TypeNode;
