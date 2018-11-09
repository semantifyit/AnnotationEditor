import * as React from 'react';
import { Manager, Reference, Popper } from 'react-popper';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import onClickOutside from 'react-onclickoutside';
import { Placement } from 'popper.js';

export interface ISingleOption {
  label: string;
  value: string;
}
interface IProps {
  multiSelect: boolean;
  popperPlacement?: Placement;
  selectOptions: ISingleOption[];
  selectedOptions: ISingleOption[] | ISingleOption;
  onChangeSelection(val: any): void;
}

interface IState {
  isOpen: boolean;
}

class DropDownSelect extends React.Component<IProps, IState> {
  public state: IState = {
    isOpen: false,
  };

  public toggleOpen = () => {
    this.setState((state) => ({ isOpen: !state.isOpen }));
  };

  public handleClickOutside() {
    this.setState({ isOpen: false });
  }

  public render() {
    return (
      <Manager>
        <Reference>
          {({ ref }: { ref: any }) => (
            <span
              ref={ref}
              onClick={this.toggleOpen}
              style={{ cursor: 'pointer', paddingLeft: '5px' }}
            >
              <FontAwesomeIcon
                icon={this.state.isOpen ? 'angle-up' : 'angle-down'}
                size="lg"
              />
            </span>
          )}
        </Reference>
        {this.state.isOpen && (
          <Popper placement={this.props.popperPlacement || 'right'}>
            {({
              ref,
              style,
              placement,
            }: {
              ref: any;
              style: any;
              placement: any;
            }) => (
              <div
                className="ignore-react-onclickoutside"
                ref={ref}
                style={{
                  ...style,
                  zIndex: 100,
                  width: '320px',
                  border: '1px solid lightgrey',
                  borderRadius: '5px',
                  marginLeft: '10px',
                  padding: '10px',
                  background: 'white',
                }}
                data-placement={placement}
              >
                <Select
                  options={this.props.selectOptions}
                  onChange={this.props.onChangeSelection}
                  isMulti={this.props.multiSelect}
                  defaultValue={this.props.selectedOptions}
                  isSearchable={true}
                />
              </div>
            )}
          </Popper>
        )}
      </Manager>
    );
  }
}

export default onClickOutside(DropDownSelect);
