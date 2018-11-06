import * as React from 'react';

import {
  getNode,
  getNameOfNode,
  removeNS,
  extractIds,
  IRestriction,
  makeArray,
} from '../helpers/helper';
import { INode } from '../helpers/vocabs';
import RangeNode from './RangeNode';
import DropDownSelect, { ISingleOption } from './DropDownSelect';

interface IProps {
  nodeId: string;
  uid: string;
  path: string[];
  canUseDashIOProps: boolean;
  arrIndex?: undefined | number;
  restriction: IRestriction[];
  removeProp(uid: string, id: string): void;
}

interface IState {
  selectedRange: string;
  nodeId: string;
}

class PropertyNode extends React.Component<IProps, IState> {
  public node: INode | undefined;

  public ranges: string[] = [];
  public rangeRestrictions: any = {};

  public state: IState = {
    selectedRange: '',
    nodeId: this.props.nodeId,
  };

  public shouldComponentUpdate(nextProps: IProps, nextState: IState) {
    // if the parent type node calls setState, don't re-render properties
    return (
      nextProps.nodeId !== this.props.nodeId ||
      this.state.nodeId !== nextState.nodeId ||
      this.state.selectedRange !== nextState.selectedRange
    );
  }

  public changedPropSelection = (e: ISingleOption) => {
    const node = getNode(e.value);
    if (!node) {
      return;
    }
    this.ranges = extractIds(node['schema:rangeIncludes']);
    this.setState({ nodeId: e.value, selectedRange: this.ranges[0] });
  };

  public render() {
    const node = getNode(this.state.nodeId);
    if (!node) {
      return <h1>Node not found</h1>;
    }
    if (this.props.restriction) {
      const restrictions = this.props.restriction.filter(
        (r) => r.property === this.state.nodeId,
      );
      const rangeRestrictions = restrictions.filter((r) => r.propertyRanges);
      if (rangeRestrictions.length > 0 && rangeRestrictions[0].propertyRanges) {
        const pRange = rangeRestrictions[0].propertyRanges;
        this.ranges = pRange.map((p) => p.nodeId);

        this.rangeRestrictions = pRange.reduce((acc, cur) => {
          acc[cur.nodeId] = cur.restrictionId;
          return acc;
        }, {});
        if (this.state.selectedRange === '') {
          this.state.selectedRange = this.ranges[0];
        }
      }
    }

    this.ranges = extractIds(node['schema:rangeIncludes']);
    if (this.state.selectedRange === '') {
      this.state.selectedRange = this.ranges[0];
    }

    const path =
      this.props.arrIndex === undefined
        ? this.props.path.concat(node['@id'])
        : this.props.path.concat(node['@id'], `[${this.props.arrIndex}]`);

    const nameOfNode = getNameOfNode(node);
    const nameOfNodeWoIO = nameOfNode
      .replace(/-input$/, '')
      .replace(/-output/, '');
    const idOfNode = node['@id'];
    const idOfNodeWoIO = idOfNode.replace(/-input$/, '').replace(/-output/, '');
    const propIOOptions = [
      { value: idOfNodeWoIO, label: nameOfNodeWoIO },
      { value: `${idOfNodeWoIO}-input`, label: `${nameOfNodeWoIO}-input` },
      { value: `${idOfNodeWoIO}-output`, label: `${nameOfNodeWoIO}-output` },
    ];

    return (
      <div className="row">
        <div className="col-sm-3" style={{ padding: 0 }}>
          <div className="row">
            <div
              className={this.ranges.length > 1 ? 'col-sm-8' : 'col-sm-12'}
              style={{ padding: 0 }}
            >
              <span
                style={{
                  fontWeight: 500,
                  fontSize: '1.3rem',
                  wordWrap: 'break-word',
                }}
              >
                {nameOfNode}
              </span>
              {this.props.canUseDashIOProps && (
                <DropDownSelect
                  multiSelect={false}
                  selectOptions={propIOOptions}
                  selectedOptions={
                    propIOOptions.find((p) => p.value === this.state.nodeId) ||
                    propIOOptions[0]
                  }
                  onChangeSelection={this.changedPropSelection}
                />
              )}
            </div>
            {this.ranges.length > 1 && (
              <div className="col-sm-4" style={{ padding: 0 }}>
                <div className="input-group">
                  <select
                    className="custom-select"
                    value={this.state.selectedRange}
                    onChange={(e) =>
                      this.setState({ selectedRange: e.target.value })
                    }
                  >
                    {this.ranges.map((r, i) => (
                      <option key={i} value={r}>
                        {removeNS(r)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="col-sm-8" style={{ padding: '5px' }}>
          <RangeNode
            nodeId={this.state.selectedRange}
            key={this.state.selectedRange}
            path={path}
            canUseDashIOProps={this.props.canUseDashIOProps}
            restriction={this.props.restriction}
            additionalRestrictionIds={makeArray(
              this.rangeRestrictions[this.state.selectedRange],
            ).filter((n) => n)}
          />
        </div>
        <div className="col-sm-1" style={{ padding: '0' }}>
          <button
            type="button"
            className="close"
            aria-label="Close"
            title="Remove this property"
            onClick={() =>
              this.props.removeProp(this.props.uid, this.state.nodeId)
            }
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>
    );
  }
}

export default PropertyNode;
