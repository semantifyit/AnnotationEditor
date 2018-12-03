import * as React from 'react';
import Select from 'react-select';
import { Button } from 'reactstrap';
import uuidv1 from 'uuid/v1';

import { getDescriptionOfNode, getNameOfNode } from '../helpers/helper';
import { ISingleOption } from './DropDownSelect';
import Annotations from './Annotations';
import VocabSelection from './VocabSelection';
import { INode } from '../helpers/Vocab';
import { IContext, VocabContext } from '../helpers/VocabContext';
import * as p from '../helpers/properties';
import { haveCommon } from '../helpers/util';

interface IState {
  createdTypes: { uid: string; node: string }[];
  selectedValue: string;
  bases: null | INode[];
}

class AnnotationBlank extends React.Component<{}, IState> {
  public static contextType = VocabContext;
  public context: IContext;
  public state: IState = {
    createdTypes: [],
    selectedValue: '',
    bases: null,
  };

  public getBases = (): INode[] =>
    this.context.vocab
      .getAllNodes()
      .filter((o) => o['@type'] && haveCommon(o['@type'], p.classes));

  public async componentDidMount() {
    await this.context.vocab.setDefaultVocabs('schema');
    this.setState({ bases: this.getBases() });
  }

  public createBase(value: string) {
    this.setState((state) => ({
      createdTypes: state.createdTypes.concat({ node: value, uid: uuidv1() }),
    }));
  }

  public reloadPage = () => {
    this.setState({ bases: this.getBases() });
  };

  public removeBase = (uidToRemove: string) => {
    this.setState((state) => ({
      createdTypes: state.createdTypes.filter(({ uid }) => uid !== uidToRemove),
    }));
  };

  public render() {
    if (!this.state.bases) {
      return <h1>Loading ...</h1>;
    }
    return (
      <div>
        <section className="jumbotron text-center">
          <div className="container">
            <h1 className="jumbotron-heading">Create your Annotation</h1>
          </div>
        </section>
        <div className="float-right">
          <VocabSelection reloadClick={this.reloadPage} />
        </div>
        <div className="row" style={{ margin: 0 }}>
          <h4>Choose a type:</h4>
          <div className="col-sm-4 col-sm-offset-4">
            <Select
              options={this.state.bases
                .sort((a, b) =>
                  getNameOfNode(a).localeCompare(getNameOfNode(b)),
                )
                .map((c) => ({
                  value: c['@id'],
                  label: getNameOfNode(c),
                  title: getDescriptionOfNode(c),
                }))}
              onChange={(e: ISingleOption) =>
                this.setState({ selectedValue: e.value })
              }
              isSearchable={true}
            />
          </div>
          <Button
            color="primary"
            disabled={this.state.selectedValue === ''}
            onClick={() =>
              this.state.selectedValue !== '' &&
              this.createBase(this.state.selectedValue)
            }
          >
            New
          </Button>
        </div>
        <br />
        <div>
          {this.state.createdTypes.length > 0 && (
            <Annotations
              typeIDs={this.state.createdTypes}
              generateButton={true}
              removeAnnotation={this.removeBase}
            />
          )}
        </div>
      </div>
    );
  }
}

export default AnnotationBlank;
