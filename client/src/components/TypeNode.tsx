import * as React from 'react';
import * as uuidv1 from 'uuid/v1';

import { INode } from '../helpers/Vocab';
import {
  getNameOfNode,
  removeNS,
  getDescriptionOfNode,
  joinPaths,
  IRestriction,
  isEqProp,
  generateJSONLD,
} from '../helpers/helper';

import PropertyNode from './PropertyNode';
import DropDownSelect, { ISingleOption } from './DropDownSelect';
import { set } from 'lodash';
import { IContext, VocabContext } from '../helpers/VocabContext';

interface IProps {
  nodeId: string;
  withBorder?: boolean;
  path: string[];
  canUseDashIOProps: boolean;
  additionalRestrictionIds?: string[];
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

  public nodeUid = uuidv1();
  public baseUID = `baseid-${joinPaths(this.props.path)}-${this.nodeUid}`;

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

    const canUseDashIOProps =
      this.props.canUseDashIOProps ||
      this.context.vocab.nodesCanUseIOProps(nodes);

    this.state.propertyIds = []; // since the node changed, reset the list of properties
    // reset the selected element for the select box
    this.state.selectedProp = Object.entries(
      this.context.vocab.getPropertyNodeForType(this.props.nodeId),
    ).filter(([k, v]) => v.length > 0)[0][1][0]['@id'];
    this.state.nodeIds = [this.props.nodeId];

    // restrictions
    this.updateRestrictions();
  }

  public useRestrictions(restrictions: IRestriction[]) {
    let properties: IProperty[] = [];
    restrictions.forEach((r) => {
      if (r.minCount) {
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
    if (properties.length !== 0) {
      this.setState((state) => ({
        propertyIds: state.propertyIds.concat(properties),
      }));
      // this.state.propertyIds = this.state.propertyIds.concat(properties);
    }
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
      const jsonld = generateJSONLD(this.baseUID, joinPaths(this.props.path));
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
    const canRemoveProp = this.restrictions
      .filter((r) => r.property === propId && r.minCount)
      .reduce(
        (acc, cur) =>
          acc &&
          (cur.minCount &&
            cur.minCount <
              this.state.propertyIds.filter((p) => p.uid === propUid).length),
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
        (acc, cur) =>
          acc &&
          (cur.maxCount &&
            cur.maxCount >
              this.state.propertyIds.filter((p) => p.nodeId === propId).length),
        true,
      ) as boolean;

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
    }
  };

  public getStyleOfSelectProp = (prop: INode) => {
    const propHasRestrictions =
      this.restrictions.filter((r) => isEqProp(r.property, prop['@id']))
        .length > 0;
    if (!this.canUseAnotherProp(prop['@id'])) {
      // this shouldn't matter, since we set the option to disabled
      return { color: 'grey', fontStyle: 'italic' };
    }
    if (propHasRestrictions) {
      return { background: 'rgb(255,255,153)' };
    }
    return {};
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

    if (this.state.selectedProp === '') {
      this.state.selectedProp = propertyNodeObj[0][1][0]['@id'];
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

    return (
      <div style={divStyle} id={this.baseUID}>
        {nodes.map((n, i) => {
          const path =
            nodes.length > 1
              ? joinPaths(this.props.path.concat('@type', `[${i}]`))
              : joinPaths(this.props.path.concat('@type'));
          return <div key={i} data-value={n['@id']} data-path={path} />;
        })}
        <div className="row">
          <h4 title={typeTitle}>{typeHeader} </h4>
          <DropDownSelect
            multiSelect={true}
            selectOptions={typeSelectOptions}
            selectedOptions={typeSelectOptions.filter((o) =>
              this.state.nodeIds.includes(o.value),
            )}
            onChangeSelection={this.changedTypesSelection}
          />
          <div className="col-sm-6 col-sm-offset-6  pull-right">
            <div className="input-group">
              <select
                className="custom-select"
                value={this.state.selectedProp}
                onChange={(e) =>
                  this.setState({ selectedProp: e.target.value })
                }
              >
                >
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
            />
          );
        })}
      </div>
    );
  }
}

export default TypeNode;
