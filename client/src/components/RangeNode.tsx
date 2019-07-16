import * as React from 'react';
import { Moment } from 'moment';
import DateTime from 'react-datetime';
import classNames from 'classnames';

import {
  getNameOfNode,
  getDescriptionOfNode,
  joinPaths,
  IRestriction,
  removeNS,
  isTerminalNode,
} from '../helpers/helper';
import TypeNode from './TypeNode';
import { VocabContext, IContext } from '../helpers/VocabContext';
import * as p from '../helpers/properties';

interface IProps {
  nodeId: string;
  path: string[];
  canUseDashIOProps: boolean;
  restriction: IRestriction[];
  additionalRestrictionIds: string[];
  existingMembersIds: string[];
  makeRangeIdNode: boolean;
  valueChanged(propValue: string): void;
}

interface IState {
  value: string;
  valueIncorrectnessReason: string | null;
}

class RangeNode extends React.Component<IProps, IState> {
  public static contextType = VocabContext;
  public context: IContext;
  public state: IState = {
    value: '',
    valueIncorrectnessReason: null,
  };

  public enumerations: null | string[] = null; // for shacl sh:in stuff

  constructor(props: IProps, context: IContext) {
    // cannot use this.context inside constructor
    super(props);
    const node = context.vocab.getNode(this.props.nodeId);
    if (node && context.vocab.isEnumNode(node)) {
      const vocab = context.vocab;
      const enums = vocab.getEnumValues(node['@id']);
      if (enums.length > 0) {
        this.state.value = enums[0]['@id'];
      }
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
        this.state.value = valueInRestriction[0].valueIn[0];
      }
    }

    if (this.props.existingMembersIds.length > 0) {
      this.state.value = this.props.existingMembersIds[0];
      this.props.valueChanged(this.state.value);
    }
  }

  public handleChange(e: React.ChangeEvent<any>) {
    const { value } = e.target;
    let valueIncorrectnessReason = null;
    this.props.restriction.forEach((r) => {
      if (r.pattern && !value.match(r.pattern)) {
        valueIncorrectnessReason = `Value doesn't match pattern: ${r.pattern}`;
      } else if (
        r.minInclusive &&
        r.maxInclusive &&
        (value < r.minInclusive || value > r.maxInclusive)
      ) {
        valueIncorrectnessReason = `Value must be between ${r.minInclusive} and ${r.maxInclusive}`;
      } else if (r.minInclusive && value < r.minInclusive) {
        valueIncorrectnessReason = `Value can't be smaller than ${r.minInclusive}`;
      } else if (r.maxInclusive && value > r.maxInclusive) {
        valueIncorrectnessReason = `Value can't be bigger than ${r.maxInclusive}`;
      }
    });
    this.setState({ value, valueIncorrectnessReason });
    this.props.valueChanged(value);
  }

  public handleTime(e: Moment, format: string) {
    this.setState({ value: e.format(format) });
  }

  public makeSelect = (values: string[]) => (
    <div className="input-group">
      <select
        className="custom-select"
        value={this.state.value}
        onChange={(e) => this.handleChange(e)}
      >
        {values.map((val, i) => (
          <option key={i} value={val} title={val}>
            {val}
          </option>
        ))}
      </select>
    </div>
  );

  public getInputField(nodeId: string) {
    if (this.enumerations) {
      return this.makeSelect(this.enumerations);
    }
    if (this.props.existingMembersIds.length > 0) {
      // this.state.value = this.props.existingMembersIds[0];
      return this.makeSelect(this.props.existingMembersIds);
    }
    const className = classNames({
      'form-control': true,
      'input-highlight': this.state.valueIncorrectnessReason || false,
    });
    switch (nodeId) {
      case p.xsdString:
      case p.xsdAnyURI:
      case p.schemaURL:
      case p.schemaText:
      case p.rdfsLiteral:
        return (
          <div>
            <input
              type="text"
              className={className}
              placeholder={removeNS(nodeId)}
              value={this.state.value}
              onChange={(e) => this.handleChange(e)}
            />
            {this.state.valueIncorrectnessReason && (
              <small style={{ color: 'red' }}>
                {this.state.valueIncorrectnessReason}
              </small>
            )}
          </div>
        );
      case p.schemaInteger:
      case p.schemaNumber:
      case p.schemaFloat:
      case p.xsdDecimal:
      case p.xsdInteger:
        return (
          <div>
            <input
              type="number"
              className={className}
              placeholder={removeNS(nodeId)}
              value={this.state.value}
              onChange={(e) => this.handleChange(e)}
            />
            {this.state.valueIncorrectnessReason && (
              <small style={{ color: 'red' }}>
                {this.state.valueIncorrectnessReason}
              </small>
            )}
          </div>
        );
      case p.schemaBoolean:
      case p.xsdBoolean:
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
      case p.schemaDate:
      case p.xsdDate:
        return (
          <DateTime
            timeFormat={false}
            defaultValue={new Date()}
            value={this.state.value}
            onChange={(e) =>
              typeof e !== 'string' && this.handleTime(e, 'YYYY-MM-DD')
            }
          />
        );
      case p.schemaDateTime:
      case p.xsdDateTime:
        return (
          <DateTime
            defaultValue={new Date()}
            value={this.state.value ? new Date(this.state.value) : new Date()}
            onChange={(e) =>
              typeof e !== 'string' && this.setState({ value: e.toISOString() })
            }
          />
        );
      case p.schemaTime:
      case p.xsdTime:
        return (
          <DateTime
            dateFormat={false}
            defaultValue={new Date()}
            value={this.state.value}
            onChange={(e) =>
              typeof e !== 'string' && this.handleTime(e, 'HH:mm')
            }
          />
        );
      default:
        const node = this.context.vocab.getNode(nodeId);
        if (node && this.context.vocab.isEnumNode(node)) {
          const enumValues = this.context.vocab.getEnumValues(node['@id']);
          if (enumValues.length === 0) {
            // copy pasta from xsdString TODO extract function
            return (
              <div>
                <input
                  type="text"
                  className={className}
                  placeholder={removeNS(nodeId)}
                  value={this.state.value}
                  onChange={(e) => this.handleChange(e)}
                />
                {this.state.valueIncorrectnessReason && (
                  <small style={{ color: 'red' }}>
                    {this.state.valueIncorrectnessReason}
                  </small>
                )}
              </div>
            );
          }
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
        if (node && this.context.vocab.isSpecialTerminalNode(node)) {
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
    const isTerminal = isTerminalNode(this.props.nodeId);
    if (isTerminal && !this.props.makeRangeIdNode) {
      return (
        <div className="form-group">
          <div
            data-value={this.state.value}
            data-path={joinPaths(this.props.path)}
          />
          {this.getInputField(this.props.nodeId)}
        </div>
      );
    }
    const node = this.context.vocab.getNode(this.props.nodeId);
    if (!node) {
      return <h1>Node not found</h1>;
    }
    return (
      <TypeNode
        nodeId={this.props.nodeId}
        withBorder={true}
        path={this.props.path}
        canUseDashIOProps={this.props.canUseDashIOProps}
        additionalRestrictionIds={this.props.additionalRestrictionIds}
        isIdPropNode={this.props.makeRangeIdNode}
      />
    );
  }
}

export default RangeNode;
