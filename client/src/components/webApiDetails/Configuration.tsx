import React from 'react';
import { WebApiConfig } from '../../../../server/src/models/WebApi';
import { SessionConfig } from './WebApiCreate';
import Editor from '../Editor';

interface Props {
  config: WebApiConfig;
  setConfig: (arg: WebApiConfig) => void;
  sessionConfig: SessionConfig;
  setSessionConfig: (arg: SessionConfig) => void;
}

const Configuration = ({ config, setConfig, sessionConfig, setSessionConfig }: Props) => {
  const setUseMapping = (val: boolean) => setConfig({ ...config, useMapping: val });
  const setCodeEditor = (val: boolean) => setSessionConfig({ ...sessionConfig, showCodeEditor: val });

  const setFunctionVal = (type: 'handlebars' | 'xquery' | 'javascript' | 'rml') => (val: string) =>
    setConfig({ ...config, [type]: { ...config[type], functions: val } });

  const setRMLXpathLib = (val: string) => setConfig({ ...config, rml: { ...config.rml, xpathLib: val } });

  return (
    <>
      <h4 className="mb-3">General</h4>
      <div className="custom-control custom-switch mb-2">
        <input
          type="checkbox"
          className="custom-control-input"
          id="enableMapping"
          checked={config.useMapping}
          onChange={(e) => setUseMapping(e.target.checked)}
        />
        <label className="custom-control-label" htmlFor="enableMapping">
          Enable mapping (coming soon...)
        </label>
      </div>
      <div className="custom-control custom-switch mb-2">
        <input
          type="checkbox"
          className="custom-control-input"
          id="enableCode"
          checked={sessionConfig.showCodeEditor}
          onChange={(e) => setCodeEditor(e.target.checked)}
        />
        <label className="custom-control-label" htmlFor="enableCode">
          Enable Code Editor View
        </label>
      </div>
      <div className="mb-3" />
      <hr className="mb-5" />
      <h4 className="mb-3">Mapping Languages</h4>
      <p>Add custom helpers for mapping languages. Some examples are given below.</p>
      <div className="mb-3">
        <h5>Handlebars</h5>
        <p>
          Exposed variables: <i>Handlebars</i>, <i>spp</i>, <i>sppList</i>
        </p>
        <Editor
          value={config.handlebars.functions}
          setValue={setFunctionVal('handlebars')}
          mode="javascript"
          resizable={true}
        />
      </div>
      <div className="mb-3">
        <h5>XQuery</h5>
        <p>
          Exposed variables: <i>registerCustomXPathFunction</i>, <i>registerXQueryModule</i>, <i>spp</i>,{' '}
          <i>sppList</i>
        </p>
        <Editor
          value={config.xquery.functions}
          setValue={setFunctionVal('xquery')}
          mode="javascript"
          resizable={true}
        />
      </div>
      <div className="mb-3">
        <h5>JavaScript</h5>
        <p>
          Write function to current context, exposed variables: <i>spp</i>, <i>sppList</i>
        </p>
        <Editor
          value={config.javascript.functions}
          setValue={setFunctionVal('javascript')}
          mode="javascript"
          resizable={true}
        />
      </div>
      <div className="mb-3">
        <h5>RML</h5>
        <p>
          Write function to current context. Will be available with namespace{' '}
          <i>http://actions.semantify.it/wasa/func/</i>
        </p>
        <Editor
          value={config.rml.functions}
          setValue={setFunctionVal('rml')}
          mode="javascript"
          resizable={true}
        />
        <div className="form-inline mt-2">
          <label>Choose a xpathLibrary for RocketRML:</label>
          <select
            className="custom-select custom-select-sm ml-2"
            value={config.rml.xpathLib}
            onChange={(e) => setRMLXpathLib(e.target.value)}
          >
            {['default', 'pugixml', 'fontoxpath'].map((v) => (
              <option value={v} key={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="mt-5">More Comming soon..</p>
    </>
  );
};

export default Configuration;
