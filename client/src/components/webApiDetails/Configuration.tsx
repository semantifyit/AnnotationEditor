import React from 'react';
import { WebApiConfig } from '../../../../server/src/models/WebApi';

interface Props {
  config: WebApiConfig;
  setConfig: (arg: WebApiConfig) => void;
}

const Configuration = ({ config, setConfig }: Props) => {
  const setUseMapping = (val: boolean) => setConfig({ ...config, useMapping: val });
  const setCodeEditor = (val: boolean) => setConfig({ ...config, showCodeEditor: val });

  return (
    <>
      <h3 className="mb-3">Configuration</h3>
      <div className="custom-control custom-switch mb-2">
        <input
          type="checkbox"
          className="custom-control-input"
          id="enableMapping"
          checked={config.useMapping}
          onChange={(e) => setUseMapping(e.target.checked)}
        />
        <label className="custom-control-label" htmlFor="enableMapping">
          Enable mapping
        </label>
      </div>
      <div className="custom-control custom-switch mb-2">
        <input
          type="checkbox"
          className="custom-control-input"
          id="enableCode"
          checked={config.showCodeEditor}
          onChange={(e) => setCodeEditor(e.target.checked)}
        />
        <label className="custom-control-label" htmlFor="enableCode">
          Enable Code Editor View
        </label>
      </div>
      <div className="mb-3" />
      More Comming soon..
    </>
  );
};

export default Configuration;
