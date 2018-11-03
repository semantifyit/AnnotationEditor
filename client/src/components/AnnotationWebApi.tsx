import * as React from 'react';
import TypeNode from './TypeNode';
import { set, has } from 'lodash';

import { fetchVocabs, getAllNodes, INode } from '../helpers/vocabs';
import {
  removeNS,
  getDescriptionOfNode,
  getNameOfNode,
  getNode,
  setProp,
} from '../helpers/helper';

const acceptableBases = [
  'Thing',
  'Place',
  'WebAPI',
  'Action',
  'Event',
  'CreativeWork',
];

interface IState {
  createdType: null | string;
  selectedValue: string;
  bases: null | INode[];
}

class WebApi extends React.Component<{}, IState> {
  public state: IState = {
    createdType: null,
    selectedValue: '',
    bases: null,
  };

  public async componentDidMount() {
    await fetchVocabs('schema', 'schema-pending', 'webapi');
    const bases = getAllNodes()
      .filter((o) => o['@type'] === 'rdfs:Class')
      .filter((o) => acceptableBases.includes(removeNS(o['@id'])));
    this.setState({ bases, selectedValue: bases[0]['@id'] });
  }

  public createBase() {
    const previousState = this.state;
    previousState.createdType = this.state.selectedValue;
    this.setState(previousState);
  }

  public generateJSONLD() {
    const jsonld = {
      '@context': {
        '@vocab': 'http://schema.org/',
        webapi: 'http://actions.semantify.it/vocab/',
      },
    };
    const terminals = document.querySelectorAll('[data-path]');
    terminals.forEach((t: HTMLElement) => {
      const { path, value } = t.dataset;
      if (path && value) {
        const schemaNSPath = path.replace(/schema:/g, '');
        const schemaNSValue = value.replace(/^schema:/g, '');
        set(jsonld, schemaNSPath, schemaNSValue);
      }
    });
    console.log(JSON.stringify(jsonld, null, 2));
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
              Create your semantic Web API Description
            </h1>
          </div>
        </section>
        <div className="row" style={{ margin: 0 }}>
          <h4>Choose a type:</h4>
          <div className="col-sm-4 col-sm-offset-4">
            <div className="input-group">
              <select
                className="custom-select"
                value={this.state.selectedValue}
                onChange={(e) =>
                  this.setState({ selectedValue: e.target.value })
                }
              >
                {this.state.bases.map((b, i) => (
                  <option
                    key={i}
                    value={b['@id']}
                    title={getDescriptionOfNode(b)}
                  >
                    {getNameOfNode(b)}
                  </option>
                ))}
              </select>
              <div className="input-group-append">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => this.createBase()}
                  disabled={this.state.createdType !== null}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
        <br />
        <div>
          {this.state.createdType && (
            <div>
              <hr />
              <TypeNode
                nodeId={this.state.createdType}
                path={[]}
                canUseDashIOProps={false}
              />
              <button
                onClick={() => this.generateJSONLD()}
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '100px' }}
              >
                Generate
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default WebApi;
