import * as React from 'react';
import Select from 'react-select';

import { ISingleOption } from './DropDownSelect';
import Annotations from './Annotations';
import { fetchDSbyId, fetchPublicDS, IDSMap } from '../helpers/semantify';
import { VocabContext, IContext } from '../helpers/VocabContext';
import { joinNS } from '../helpers/properties';

interface IState {
  createdType: null | string;
  selectedValue: string;
  bases: null | IDSMap[];
}

class AnnotationTemplate extends React.Component<{}, IState> {
  public static contextType = VocabContext;
  public context: IContext;
  public state: IState = {
    createdType: null,
    selectedValue: '',
    bases: null,
  };

  public async componentDidMount() {
    await this.context.vocab.setDefaultVocabs('schema', 'schema-pending');
    const DS = await fetchPublicDS();
    this.setState({ bases: DS });
  }

  public async createBase(dsID: string) {
    const ds = await fetchDSbyId(dsID);
    if (!ds) {
      return;
    }
    await this.context.vocab.addVocab(
      'DomainSpecification',
      ds.content,
      'application/ld+json',
    );
    this.setState({
      createdType: joinNS(
        'schema',
        ds.content['@graph'][0]['sh:targetClass'].split(':')[1],
      ),
    });
  }

  public render() {
    if (!this.state.bases) {
      return <h1>Loading ...</h1>;
    }
    return (
      <div>
        <section className="jumbotron text-center">
          <div className="container">
            <h1 className="jumbotron-heading">
              Create an annotation from a template
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
            <Annotations
              typeIDs={[{ node: this.state.createdType, uid: '' }]}
              generateButton={true}
            />
          )}
        </div>
      </div>
    );
  }
}

export default AnnotationTemplate;
