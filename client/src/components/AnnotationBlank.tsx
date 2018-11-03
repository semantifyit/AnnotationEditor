import * as React from 'react';
import Select from 'react-select';
import 'react-toastify/dist/ReactToastify.css';

import { fetchVocabs, getAllNodes, INode } from '../helpers/vocabs';
import { getDescriptionOfNode, getNameOfNode } from '../helpers/helper';
import { ISingleOption } from './DropDownSelect';
import Annotation from './Annotation';

interface IState {
  createdType: null | string;
  selectedValue: string;
  bases: null | INode[];
}

class AnnotationBlank extends React.Component<{}, IState> {
  public state: IState = {
    createdType: null,
    selectedValue: '',
    bases: null,
  };

  public async componentDidMount() {
    await fetchVocabs('schema', 'schema-pending', 'webapi');
    const bases = getAllNodes().filter((o) => o['@type'] === 'rdfs:Class');
    this.setState({ bases });
  }

  public createBase(value: string) {
    this.setState({ createdType: value });
  }

  public render() {
    if (!this.state.bases) {
      return <h1>Loading ...</h1>;
    }
    return (
      <div>
        <section
          className="jumbotron text-center"
          style={{ backgroundColor: '#fff' }}
        >
          <div className="container">
            <h1 className="jumbotron-heading">Create your Annotation</h1>
          </div>
        </section>
        <div className="row" style={{ margin: 0 }}>
          <h4>Choose a type:</h4>
          <div className="col-sm-4 col-sm-offset-4">
            <Select
              options={this.state.bases
                .map((c) => ({
                  value: c['@id'],
                  label: getNameOfNode(c),
                  title: getDescriptionOfNode(c),
                }))
                .sort((a, b) => a.label.localeCompare(b.label))}
              onChange={(e: ISingleOption) => this.createBase(e.value)}
              isSearchable={true}
            />
          </div>
        </div>
        <br />
        <div>
          {this.state.createdType && (
            <Annotation typeID={this.state.createdType} />
          )}
        </div>
      </div>
    );
  }
}

export default AnnotationBlank;
