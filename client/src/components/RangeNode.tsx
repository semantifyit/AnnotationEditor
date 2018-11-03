import * as React from 'react';
import { Moment } from 'moment';
import * as DateTime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';

import {
  getNode,
  getNameOfNode,
  isTerminalNode,
  removeNS,
  getPropertyNodeForType,
  getDescriptionOfNode,
  getSuperClasses,
  getEnumValues,
  isEnumNode,
  isSpecialTerminalNode,
  joinPaths,
  IRestriction,
} from '../helpers/helper';
import TypeNode from './TypeNode';
import { INode } from '../helpers/vocabs';

interface IProps {
  nodeId: string;
  path: string[];
  canUseDashIOProps: boolean;
  restriction: IRestriction[];
  additionalRestrictionIds: string[];
}

interface IState {
  value: string;
}

class RangeNode extends React.Component<IProps, IState> {
  public state: IState = {
    value: '',
  };

  public enumerations: null | string[] = null; // for shacl sh:in stuff

  constructor(props: IProps) {
    super(props);
    const node = getNode(this.props.nodeId);
    if (node && isEnumNode(node)) {
      this.state.value = getEnumValues(node['@id'])[0]['@id'];
    }

    if (this.props.restriction) {
      // default value restriction
      const defaultValueRestriction = this.props.restriction.filter(
        (r) => r.defaultValue,
      );
      if (
        defaultValueRestriction.length > 0 &&
        defaultValueRestriction[0].defaultValue
      ) {
        this.state.value = defaultValueRestriction[0].defaultValue;
      }

      // sh:in restriction -> treat as enum
      const valueInRestriction = this.props.restriction.filter(
        (r) => r.valueIn,
      );
      if (valueInRestriction.length > 0 && valueInRestriction[0].valueIn) {
        this.enumerations = valueInRestriction[0].valueIn;
      }
    }
  }

  public handleChange(e: React.ChangeEvent<any>) {
    this.setState({ value: e.target.value });
  }

  public handleTime(e: Moment, format: string) {
    this.setState({ value: e.format(format) });
  }

  public getInputField(node: INode) {
    if (this.enumerations) {
      return (
        <div className="input-group">
          <select
            className="custom-select"
            value={this.state.value}
            onChange={(e) => this.handleChange(e)}
          >
            {this.enumerations.map((enumVal, i) => (
              <option key={i} value={enumVal['@id']} title={enumVal}>
                {enumVal}
              </option>
            ))}
          </select>
        </div>
      );
    }
    switch (getNameOfNode(node)) {
      case 'URL':
      case 'Text':
        return (
          <input
            type="text"
            className="form-control"
            placeholder={getNameOfNode(node)}
            value={this.state.value}
            onChange={(e) => this.handleChange(e)}
          />
        );
      case 'Integer':
      case 'Number':
      case 'Float':
        return (
          <input
            type="number"
            className="form-control"
            placeholder={getNameOfNode(node)}
            value={this.state.value}
            onChange={(e) => this.handleChange(e)}
          />
        );
      case 'Boolean':
        return (
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              value={this.state.value}
              onChange={(e) => this.handleChange(e)}
            />
          </div>
        );
      case 'Date':
        return (
          <DateTime
            /*dateFormat="YYYY-MM-DD"*/ timeFormat={false}
            defaultValue={new Date()}
            value={this.state.value}
            onChange={(e) =>
              typeof e !== 'string' && this.handleTime(e, 'YYYY-MM-DD')
            }
          />
        );
      case 'DateTime':
        return (
          <DateTime
            /*dateFormat="YYYY-MM-DD" timeFormat="HH:mm"*/ defaultValue={
              new Date()
            }
            value={this.state.value ? new Date(this.state.value) : new Date()}
            onChange={(e: Moment) => {
              this.setState({ value: e.toISOString() });
            }}
          />
        );
      case 'Time':
        return (
          <DateTime
            dateFormat={false}
            /*timeFormat="HH:mm"*/ defaultValue={new Date()}
            value={this.state.value}
            onChange={(e) =>
              typeof e !== 'string' && this.handleTime(e, 'HH:mm')
            }
          />
        );
      default:
        if (isEnumNode(node)) {
          const enumValues = getEnumValues(node['@id']);
          return (
            <div className="input-group">
              <select
                className="custom-select"
                value={this.state.value}
                onChange={(e) => this.handleChange(e)}
              >
                {enumValues.map((enumVal, i) => (
                  <option
                    key={i}
                    value={enumVal['@id']}
                    title={getDescriptionOfNode(enumVal)}
                  >
                    {getNameOfNode(enumVal)}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (isSpecialTerminalNode(node)) {
          return (
            <input
              type="text"
              className="form-control"
              placeholder={getNameOfNode(node)}
              value={this.state.value}
              onChange={(e) => this.handleChange(e)}
            />
          );
        }
        return <h1>DataType not found</h1>;
    }
  }

  public render() {
    const node = getNode(this.props.nodeId);
    if (!node) {
      return <h1>Node not found</h1>;
    }
    const isTerminal = isTerminalNode(node);
    if (isTerminal) {
      return (
        <div className="form-group">
          <div
            data-value={this.state.value}
            data-path={joinPaths(this.props.path)}
          />
          {this.getInputField(node)}
        </div>
      );
    }

    return (
      <TypeNode
        nodeId={this.props.nodeId}
        withBorder={true}
        path={this.props.path}
        canUseDashIOProps={this.props.canUseDashIOProps}
        additionalRestrictionIds={this.props.additionalRestrictionIds}
      />
    );
  }
}

export default RangeNode;
