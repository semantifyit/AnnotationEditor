import * as React from 'react';
import Select from 'react-select';
import 'react-toastify/dist/ReactToastify.css';

import { addVocab, fetchVocabs } from '../helpers/vocabs';
import { ISingleOption } from './DropDownSelect';
import Annotation from './Annotation';
import {
  fetchDSbyId,
  fetchPublicDS,
  IDSMap,
  transformDSToShacl,
} from '../helpers/semantify';

interface IState {
  createdType: null | string;
  selectedValue: string;
  bases: null | IDSMap[];
}

class AnnotationTemplate extends React.Component<{}, IState> {
  public state: IState = {
    createdType: null,
    selectedValue: '',
    bases: null,
  };

  public async componentDidMount() {
    await fetchVocabs('schema', 'schema-pending');
    const DS = await fetchPublicDS();
    this.setState({ bases: DS });
  }

  public async createBase(dsID: string) {
    const ds = await fetchDSbyId(dsID);
    if (!ds) {
      return;
    }
    const shaclDS = transformDSToShacl(ds.content);
    addVocab(shaclDS);
    this.setState({
      createdType: ds.content['dsv:class'][0]['dsv:baseClass']['@id'],
    });
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
            <h1 className="jumbotron-heading">
              Create your Annotation from a templace
            </h1>
          </div>
        </section>
        <div className="row" style={{ margin: 0 }}>
          <h4>Choose a template:</h4>
          <div className="col-sm-4 col-sm-offset-4">
            <Select
              options={this.state.bases
                .map((c) => ({
                  value: c.id,
                  label: c.name,
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

export default AnnotationTemplate;
