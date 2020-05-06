import React, { useState } from 'react';
import Select from 'react-select';
import { FaFileImport } from 'react-icons/fa';
import ky from 'ky';

import VocabHandler, { unUsePrefix } from '../../util/VocabHandler';
import {
  Template as ITemplate,
  WebApiConfig,
  TemplateRessourceDesc,
} from '../../../../server/src/models/WebApi';
import Annotation from './Annotation';
import { dsToTemplate } from '../../util/webApi';
import { toArray } from '../../util/utils';
import ModalBtn from '../ModalBtn';

interface Props {
  template: ITemplate;
  setBaseType: (type: string) => void;
  setAnnotation: (ann: TemplateRessourceDesc) => void;
  vocabHandler: VocabHandler;
  config: WebApiConfig;
  potTemplates: ITemplate[];
}

const Template = ({ template, setAnnotation, setBaseType, vocabHandler, config, potTemplates }: Props) => {
  const [dsHash, setDsHash] = useState('');
  const [dsImportResult, setDsImportResult] = useState<[undefined | 'success' | 'danger', string]>([
    undefined,
    '',
  ]);

  const annotation = template.src;
  const createClick = () => {
    template.baseType && setAnnotation({ type: 'template', types: [template.baseType], props: [] });
  };
  const isEmptyAnnotation = annotation.types.length === 0 && annotation.props.length === 0;

  const importDSClick = async () => {
    try {
      const resp: { content: any; name: string } = await ky
        .get(`https://semantify.it/api/domainspecification/hash/${dsHash}`)
        .json();
      if (resp.content) {
        setAnnotation(dsToTemplate(resp.content));
        setBaseType(
          // eslint-disable-next-line react-hooks/rules-of-hooks
          unUsePrefix(toArray(resp.content['@graph'][0]['sh:targetClass'])[0], resp.content['@context']),
        );
        setDsImportResult(['success', `Successfully imported DS ${resp.name}`]);
      } else {
        setDsImportResult(['danger', 'Something went wrong']);
      }
    } catch (e) {
      setDsImportResult(['danger', e.toString()]);
    }
  };

  const options = vocabHandler.getClassesDescr().map((desc) => ({ value: desc.id, label: desc.name }));
  return (
    <>
      <div className="d-flex flexSpaceBetween mb-4">
        <div className="d-flex">
          <h4 className="d-inline">Choose a type: </h4>
          <div className="mx-3 d-inline-block" style={{ width: '20rem' }}>
            <Select
              options={options}
              onChange={(option: any) => setBaseType(option?.value)}
              isSearchable={true}
              defaultValue={options.find(({ value }) => value === template.baseType)}
            />
          </div>
          <button className="btn btn-primary" onClick={createClick} disabled={!template.baseType}>
            Create
          </button>
        </div>
        <ModalBtn
          modalTitle="Import Template"
          btnClassName="btn-primary"
          btnContent={() => (
            <>
              <FaFileImport /> Import
            </>
          )}
        >
          {!isEmptyAnnotation && (
            <div className="alert alert-warning" role="alert">
              A template already exists, any import will overwrite the existing template
            </div>
          )}
          <h5>From Semantify.it</h5>
          <div className="form-group">
            <label htmlFor="importDSHash">Domainspecification Hash</label>
            <div className="d-flex">
              <input
                type="text"
                className="form-control"
                id="importDSHash"
                placeholder="DS hash (~9 characters)"
                value={dsHash}
                onChange={(e) => setDsHash(e.target.value)}
              />
              <button type="button" className="btn btn-success ml-2" onClick={importDSClick}>
                Import
              </button>
            </div>
          </div>
          {dsImportResult[0] && (
            <div className={`alert alert-${dsImportResult[0]}`} role="alert">
              {dsImportResult[1]}
            </div>
          )}
          <hr className="my-4" />
          <h5>From another WebAPI</h5>
          Coming soon ...
        </ModalBtn>
      </div>
      {template.baseType && annotation.types.length > 0 && (
        <Annotation
          baseType={template.baseType}
          // key={template.baseType}
          annotation={annotation}
          setAnnotation={setAnnotation}
          vocabHandler={vocabHandler}
          config={config}
          potTemplates={potTemplates}
        />
      )}
    </>
  );
};

export default Template;
