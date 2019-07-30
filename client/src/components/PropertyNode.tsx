import * as React from 'react';
import Split from 'split.js';

import {
  getNameOfNode,
  removeNS,
  IRestriction,
  makeIdArr,
  getRanges,
} from '../helpers/helper';
import { INode } from '../helpers/Vocab';
import RangeNode from './RangeNode';
import DropDownSelect, { ISingleOption } from './DropDownSelect';
import { makeArray } from '../helpers/util';
import { VocabContext, IContext } from '../helpers/VocabContext';
import * as p from '../helpers/properties';

interface IProps {
  nodeId: string;
  uid: string;
  path: string[];
  canUseDashIOProps: boolean;
  arrIndex?: undefined | number;
  restriction: IRestriction[];
  existingMembersIds: string[];
  removeProp(uid: string, id: string): void;
  valueChanged(propId: string, propValue: string): void;
}

interface IState {
  selectedRange: string;
  nodeId: string;
}

class PropertyNode extends React.Component<IProps, IState> {
  public static contextType = VocabContext;
  public context: IContext;
  public node: INode | undefined;

  public ranges: string[] = [];
  public rangeRestrictions: { [nodeId: string]: string[] } = {};
  public makeRangeIdNode = false;

  public state: IState = {
    selectedRange: '',
    nodeId: this.props.nodeId,
  };

  // removed since it didnt allow forceUpdate from TypeNode-component to re render children
  /*public shouldComponentUpdate(nextProps: IProps, nextState: IState) {
    // if the parent type node calls setState, don't re-render properties
    return (
      nextProps.nodeId !== this.props.nodeId ||
      nextProps.arrIndex !== this.props.arrIndex ||
      !arraysAreEquals(nextProps.path, this.props.path) ||
      this.state.nodeId !== nextState.nodeId ||
      this.state.selectedRange !== nextState.selectedRange
    );
  }*/

  public changedPropSelection = (e: ISingleOption) => {
    this.setState({ nodeId: e.value, selectedRange: '' });
  };

  public initSplit() {
    if (
      !this.context.vocab.getNode(this.state.nodeId) &&
      this.state.nodeId !== '@id'
    ) {
      // if node doesn't exist
      return;
    }
    Split(
      [`#split-first-${this.props.uid}`, `#split-second-${this.props.uid}`],
      { sizes: [30, 70], minSize: [100, 150] },
    );
  }
  public componentDidMount() {
    this.initSplit();
  }
  public componentDidUpdate() {
    // this.initSplit();
  }

  public render() {
    let node = this.context.vocab.getNode(this.state.nodeId);
    if (!node) {
      if (this.state.nodeId === '@id') {
        node = {
          '@id': '@id',
          [p.rdfsRange]: makeIdArr(p.xsdAnyURI),
        };
      } else {
        return <h1>Node not found</h1>;
      }
    }
    this.ranges = getRanges(node);
    let selectedRange = this.state.selectedRange;
    if (this.ranges.length === 0) {
      selectedRange = p.xsdString;
    }

    if (this.props.restriction) {
      const restrictions = this.props.restriction.filter(
        (r) => r.property === this.state.nodeId,
      );
      const rangeRestrictions = restrictions.filter((r) => r.propertyRanges);
      if (rangeRestrictions.length > 0 && rangeRestrictions[0].propertyRanges) {
        const pRange = rangeRestrictions[0].propertyRanges;
        this.ranges = pRange.map((r) => r.nodeId);

        this.rangeRestrictions = pRange.reduce((acc: any, cur) => {
          acc[cur.nodeId] = cur.restrictionIds;
          return acc;
        }, {});
        if (selectedRange === '') {
          // without can't change range when ranges have restrictions
          selectedRange = this.ranges[0];
        }
      }
      const nodeIdRestrictions = restrictions.filter((r) => r.rangeIsIdNode);
      if (nodeIdRestrictions.length > 0) {
        this.makeRangeIdNode = true;
      }
    }

    if (selectedRange === '') {
      selectedRange = this.ranges[0];
    }

    const path =
      this.props.arrIndex === undefined
        ? this.props.path.concat(node['@id'])
        : this.props.path.concat(node['@id'], this.props.arrIndex.toString());

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
        <div
          className="split"
          style={{ padding: 0 }}
          id={`split-first-${this.props.uid}`}
        >
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
              {this.props.canUseDashIOProps && this.state.nodeId !== '@id' && (
                <DropDownSelect
                  multiSelect={false}
                  selectOptions={propIOOptions}
                  selectedOptions={
                    propIOOptions.find((o) => o.value === this.state.nodeId) ||
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
                    value={selectedRange}
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
        <div
          className="split"
          style={{ padding: '5px' }}
          id={`split-second-${this.props.uid}`}
        >
          {/*button before the rangeNode doesn't make sense, works though; stupid CSS */}
          <button
            style={{ float: 'right' }}
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
          <div style={{ paddingRight: '20px' }}>
            <div style={{ width: '100%' }}>
              <RangeNode
                nodeId={selectedRange}
                key={selectedRange}
                path={path}
                canUseDashIOProps={this.props.canUseDashIOProps}
                restriction={this.props.restriction}
                additionalRestrictionIds={makeArray(
                  this.rangeRestrictions[selectedRange],
                ).filter((n) => n)}
                existingMembersIds={this.props.existingMembersIds}
                makeRangeIdNode={this.makeRangeIdNode}
                valueChanged={(value) =>
                  this.props.valueChanged(this.state.nodeId, value)
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default PropertyNode;
