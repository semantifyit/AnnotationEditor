import React, { useEffect, useState, PropsWithChildren, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaArrowRight,
  FaArrowLeft,
  FaVial,
  FaPlusCircle,
  FaFileAlt,
  FaCog,
  FaCode,
  FaLanguage,
  FaSave,
  FaRegFile,
  FaFeatherAlt,
  FaTimesCircle,
  FaCheckCircle,
  FaLink,
  FaProjectDiagram,
} from 'react-icons/fa';
import { IconType } from 'react-icons/lib/cjs';
import ky from 'ky';
import classnames from 'classnames';
import { toast } from 'react-toastify';
import { useHotkeys } from 'react-hotkeys-hook';

// import uuid from 'uuid/v1';

import '../../styles/webApiDetail.css';
import {
  WebApi,
  // Annotation as IAnnotation,
  RessourceDesc,
  ActionRefs,
  ActionLink as IActionLink,
  ActionRessourceDesc,
  TemplateRessourceDesc,
  PotentialActionLink,
} from '../../../../server/src/models/WebApi';
import { VocabLeanDoc as Vocab } from '../../../../server/src/models/Vocab';
import {
  createEmptyWebApi,
  createEmptyAction,
  createEmptyTemplate,
  defaultNewTemplateName,
  defaultNewActionName,
  getNameOfAction,
  setNameOfAction,
  getNameOfWebApi,
} from '../../util/webApi';
import { clone, memoize, maxOfArray, Optional } from '../../util/utils';
import Annotation from './Annotation';
import Configuration from './Configuration';
import Functions from './Functions';
import RequestMapping from './RequestMapping';
import ResponseMapping from './ResponseMapping';
import TestMapping from './TestMapping';
import Vocabularies from './Vocabularies';
import VocabHandler from '../../util/VocabHandler';
import Template from './Template';
import ActionLinks from './ActionLinks';
import { useActionStore } from '../../util/ActionStore';
import { Loading } from '../Loading';
import {
  actionLinksToAnnotation,
  actionToAnnotation,
  templateToAnnotation,
  webApiToAnnotation,
} from '../../util/toAnnotation';

export interface WebApiDetailPageProps {
  webApi: WebApi;
}

const pages: [string, IconType][] = [
  ['WebAPI Annotation', FaFileAlt],
  ['Vocabularies', FaLanguage],
  ['Functions', FaCode],
  ['Configuration', FaCog],
];

const actionPages: [string, IconType][] = [
  ['Annotation', FaFileAlt],
  ['Preceding Actions', FaLink],
  ['Potential Actions', FaProjectDiagram],
  ['Request Mapping', FaArrowRight],
  ['Response Mapping', FaArrowLeft],
  ['Testing', FaVial],
];

interface SelectedPage {
  type: 'main' | 'actions' | 'templates';
  main: number;
  sub: number;
}
const newPage = (type: SelectedPage['type'], main: number, sub: number): SelectedPage => ({
  type,
  main,
  sub,
});
const isSamePage = (p1?: SelectedPage, p2?: SelectedPage): boolean =>
  (p1 && p2 && p1.type === p2.type && p1.main === p2.main && p1.sub === p2.sub) || false;

type DetailPageProps = PropsWithChildren<{
  webApi: WebApi;
  page: SelectedPage;
  title: string;
  disableSaveBtn: boolean;
  setPage: (n: SelectedPage) => void;
  newAction: () => void;
  setActionName: (name: string, index: number) => void;
  deleteAction: (n: number) => void;
  newTemplate: () => void;
  setTemplateName: (name: string, index: number) => void;
  deleteTemplate: (n: number) => void;
  save: () => void;
}>;

const WebAPIDetailsPage = ({
  children,
  webApi,
  page,
  disableSaveBtn,
  setPage,
  newAction,
  setActionName,
  deleteAction,
  newTemplate,
  setTemplateName,
  deleteTemplate,
  save,
  title,
}: DetailPageProps) => {
  const [editingPage, setEditingPage] = useState<Optional<SelectedPage>>(undefined);
  const [editingText, setEditingText] = useState('');

  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // TODO update eslint bug https://github.com/typescript-eslint/typescript-eslint/issues/1138
    // eslint-disable-next-line no-unused-expressions
    editRef?.current?.focus();
  }, [editingPage]);

  const saveEditClick = (type: 'actions' | 'templates', index: number) => {
    type === 'actions' ? setActionName(editingText, index) : setTemplateName(editingText, index);
    setEditingPage(undefined);
  };

  return (
    <>
      <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
        <Link className="navbar-brand col-sm-3 col-md-2 mr-0" to="/webAPI">
          <FaChevronLeft /> Back
        </Link>
        <h3 className="w-100 text-center mb-0 text-white">{title}</h3>
        <ul className="navbar-nav px-3">
          <li className="nav-item text-nowrap">
            <button onClick={save} className="btn btn-success py-1" disabled={disableSaveBtn}>
              <FaSave /> Save
            </button>
          </li>
        </ul>
      </nav>
      <div className="container-fluid">
        <div className="row">
          <nav className="col-md-2 d-none d-md-block bg-light sidebar">
            <div className="sidebar-sticky">
              <ul className="nav flex-column">
                {pages.map(([name, Icon], i) => (
                  <li key={i} className="nav-item">
                    <span
                      className={classnames('nav-link', {
                        active: page.type === 'main' && page.main === i,
                      })}
                      onClick={() => setPage(newPage('main', i, 0))}
                    >
                      <Icon className="feather" />
                      {name}
                    </span>
                  </li>
                ))}
              </ul>
              <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-5 mb-1 text-muted">
                <span>Actions</span>
                <FaPlusCircle className="pointer" title="Create new Action" onClick={newAction} />
              </h6>
              <ul className="nav flex-column mb-2">
                {webApi.actions.map((action, i) => {
                  const isActive = page.type === 'actions' && page.main === i;
                  const Icon = isActive ? FaChevronDown : FaChevronRight;
                  const isEditingName = isSamePage(editingPage, newPage('actions', i, 0));
                  return (
                    <li key={i} className="nav-item">
                      <span
                        className={classnames('nav-link d-flex flexSpaceBetween', {
                          active: isActive,
                        })}
                        onClick={() => !isEditingName && setPage(newPage('actions', i, 0))}
                      >
                        <span className="d-flex flexSpaceBetween break-word">
                          <Icon className="feather" />{' '}
                          {isEditingName ? (
                            <input
                              ref={editRef}
                              className="form-control form-control-sm"
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                            />
                          ) : (
                            getNameOfAction(action)
                          )}
                        </span>
                        {isEditingName ? (
                          <span className="d-flex">
                            <FaCheckCircle
                              title="Save"
                              className="ml-1 side-save-btn"
                              onClick={() => saveEditClick('actions', i)}
                            />
                            <FaTimesCircle
                              title="Cancel"
                              className="side-cancel-btn ml-1"
                              onClick={() => setEditingPage(undefined)}
                            />
                          </span>
                        ) : (
                          <span className="side-hidden-btns">
                            <FaFeatherAlt
                              title="Edit Name"
                              className="side-edit-btn"
                              onClick={() => {
                                setEditingText(getNameOfAction(action));
                                setEditingPage(newPage('actions', i, 0));
                              }}
                            />
                            <FaTimesCircle
                              title="Delele"
                              className="ml-1 side-delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAction(i);
                              }}
                            />
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <ul className="nav flex-column submenu">
                          {actionPages.map(([name, SubIcon], j) => (
                            <li
                              key={j}
                              className="nav-item"
                              onClick={() => setPage(newPage('actions', i, j))}
                            >
                              <span
                                className={classnames('nav-link', {
                                  active: page.type === 'actions' && page.sub === j,
                                })}
                                style={{
                                  fontWeight: page.type === 'actions' && page.sub === j ? 500 : 400,
                                }}
                              >
                                <SubIcon className="feather" />
                                {name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>

              <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-5 mb-1 text-muted">
                <span>Templates</span>
                <FaPlusCircle className="pointer" title="Create new Action" onClick={newTemplate} />
              </h6>
              <ul className="nav flex-column mb-2">
                {webApi.templates.map((template, i) => {
                  const isEditingName = isSamePage(editingPage, newPage('templates', i, 0));
                  return (
                    <li key={i} className="nav-item">
                      <span
                        className={classnames('nav-link d-flex flexSpaceBetween', {
                          active: page.type === 'templates' && page.main === i,
                        })}
                        onClick={() => !isEditingName && setPage(newPage('templates', i, 0))}
                      >
                        <span className="d-flex flexSpaceBetween break-word">
                          <FaRegFile className="feather" />
                          {isEditingName ? (
                            <input
                              ref={editRef}
                              className="form-control form-control-sm"
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                            />
                          ) : (
                            template.name
                          )}
                        </span>
                        {isEditingName ? (
                          <span className="d-flex">
                            <FaCheckCircle
                              title="Save"
                              className="ml-1 side-save-btn"
                              onClick={() => saveEditClick('templates', i)}
                            />
                            <FaTimesCircle
                              title="Cancel"
                              className="side-cancel-btn ml-1"
                              onClick={() => setEditingPage(undefined)}
                            />
                          </span>
                        ) : (
                          <span className="side-hidden-btns">
                            <FaFeatherAlt
                              title="Edit Name"
                              className="side-edit-btn"
                              onClick={() => {
                                setEditingText(template.name);
                                setEditingPage(newPage('templates', i, 0));
                              }}
                            />
                            <FaTimesCircle
                              title="Delele"
                              className="ml-1 side-delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTemplate(i);
                              }}
                            />
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
          <main role="main" className="col-md-9 ml-sm-auto col-lg-10 px-4 mt-2">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};

const getVocabHandler = memoize<any, any>(
  (vocabIds: string[], prefixes: Record<string, string>, availableVocabsKey: string, availableVocabs: any) =>
    new VocabHandler(
      vocabIds.map((vocabId) => availableVocabs.find((vocab: any) => vocab._id === vocabId)?.vocab ?? '[]'),
      prefixes,
    ),
  undefined,
  [3],
);

const useWebApi = (id?: string): [WebApi, React.Dispatch<React.SetStateAction<WebApi>>, boolean] => {
  const emptyWebApi: WebApi = createEmptyWebApi();

  const [webApi, setWebApi] = useState<WebApi>(emptyWebApi);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      ky.get(`/api/webApi/${id}`)
        .json()
        .then((resp) => {
          setIsLoading(false);
          setWebApi(resp as WebApi);
        });
    } else {
      setIsLoading(false);
    }
  }, [id]);

  return [webApi, setWebApi, isLoading];
};

const useAvailableVocabs = (): [Vocab[], (v: Vocab[]) => void, boolean] => {
  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    ky.get('/api/vocab/')
      .json()
      .then((resp) => {
        setVocabs(resp as Vocab[]);
        setIsLoading(false);
      });
  }, []);
  return [vocabs, setVocabs, isLoading];
};

const useOtherActionsRefs = (): [ActionRefs, boolean] => {
  const [otherActions, setOtherActions] = useState<ActionRefs>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    ky.get('/api/webApi/actions')
      .json()
      .then((resp) => {
        setOtherActions(resp as ActionRefs);
        setIsLoading(false);
      });
  }, []);
  return [otherActions, isLoading];
};

const WebApiCreate = () => {
  const params: { id?: string } = useParams();
  const [id, setId] = useState(params.id);
  const [webApi, setWebApi, isLoadingWebApi] = useWebApi(id);
  const [otherActionRefs, isLoadingOtherActionRefs] = useOtherActionsRefs();
  const [availableVocabs, setAvailableVocabs, isLoadingVocabs] = useAvailableVocabs();
  const [page, setPage] = useState<SelectedPage>({ type: 'main', main: 0, sub: 0 }); //({ type: 'main', main: 0, sub: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [getActions] = useActionStore();

  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    save();
  });

  const actionRefs = [
    {
      id: webApi.id,
      name: getNameOfWebApi(webApi) + ' (This WebApi)',
      actions: webApi.actions.map((action) => ({
        id: action.id,
        name: getNameOfAction(action),
        action,
      })),
    },
    ...otherActionRefs,
  ];

  // console.log(page, subPage);

  const isReady = !isLoadingVocabs && !isLoadingWebApi && !isLoadingOtherActionRefs;

  const setSelectedVocabs = (vocabs: string[]) => {
    const newWebApi = clone(webApi);
    newWebApi.vocabs = vocabs;
    setWebApi(newWebApi);
  };

  // only for now set default selected vocabs hardcoded, in future dynamic selection (e.g per user)
  if (availableVocabs.length > 0 && webApi.vocabs.length === 0) {
    setSelectedVocabs(
      availableVocabs
        .filter((v) => v.name === 'Schema.org' || v.name === 'Schema.org Pending')
        .map(({ _id }) => _id),
    );
  }

  const namesCount = (names: string[], defaultName: string): number =>
    maxOfArray(
      names
        .filter((name) => name.includes(defaultName))
        .map((name) => {
          const regMatch = new RegExp(`${defaultName}( \\(([0-9]+)\\))?`).exec(name);
          return parseInt(regMatch ? regMatch?.[2] ?? '-1' : '', 10);
        })
        .filter((n) => !isNaN(n)),
    ) + 1;

  const newAction = () => {
    const newWebApi = clone(webApi);
    const actionsWithDefaultName = namesCount(
      newWebApi.actions.map((action) => getNameOfAction(action)),
      defaultNewActionName,
    );

    newWebApi.actions.push(createEmptyAction(actionsWithDefaultName, webApi.id));
    setWebApi(newWebApi);
    setPage(newPage('actions', newWebApi.actions.length - 1, 0));
  };

  const setActionName = (name: string, index: number) => {
    const newWebApi = clone(webApi);
    setNameOfAction(newWebApi.actions[index], name);
    setWebApi(newWebApi);
  };

  const newTemplate = () => {
    const newWebApi = clone(webApi);
    const templatesWithDefaultName = namesCount(
      newWebApi.templates.map(({ name }) => name),
      defaultNewTemplateName,
    );
    newWebApi.templates.push(createEmptyTemplate(templatesWithDefaultName));
    setWebApi(newWebApi);
    setPage(newPage('templates', newWebApi.templates.length - 1, 0));
  };

  const setTemplateName = (name: string, index: number) => {
    const newWebApi = clone(webApi);
    newWebApi.templates[index].name = name;
    setWebApi(newWebApi);
  };

  const deleteOfType = (type: 'actions' | 'templates') => (n: number) => {
    const newWebApi = clone(webApi);
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to delete?')) {
      newWebApi[type].splice(n, 1);
      if (n > page.main) {
        // dont change page
      } else if (n === page.main) {
        if (n === 0) {
          setPage(newPage('main', 0, 0));
        } else {
          setPage(newPage(type, n - 1, 0));
        }
      } else {
        // n < page.main
        setPage(newPage(type, page.main - 1, page.sub));
      }
      setWebApi(newWebApi);
    }
  };

  const deleteAction = deleteOfType('actions');
  const deleteTemplate = deleteOfType('templates');

  const setSubPage = (n: number) => setPage((oldPage) => ({ ...oldPage, sub: n }));

  const goToReqMapping = () => setSubPage(3);
  const goToRespMapping = () => setSubPage(4);
  const goToTestMapping = () => setSubPage(5);

  const availableVocabsKey = availableVocabs.map((vocab) => vocab._id).join('.');
  const vocabHandler = getVocabHandler(webApi.vocabs, webApi.prefixes, availableVocabsKey, availableVocabs);

  const getDetailsPage = () => {
    if (page.type === 'main') {
      switch (pages[page.main][0]) {
        case 'WebAPI Annotation': {
          const setAnnotation = (annotation: RessourceDesc) => {
            const newWebApi = clone(webApi);
            newWebApi.annotationSrc = annotation;
            //newWebApi.annotation = webApiToAnnotation(webApi, vocabHandler);
            setWebApi(newWebApi);
          };
          return (
            <Annotation
              baseType="http://schema.org/WebAPI"
              key={-1}
              vocabHandler={vocabHandler}
              annotation={webApi.annotationSrc}
              setAnnotation={setAnnotation}
              config={webApi.config}
              potTemplates={[]}
              getAnnotation={() => webApiToAnnotation(webApi, vocabHandler)}
            />
          );
        }
        case 'Vocabularies': {
          const setPrefixes = (prefixes: Record<string, string>) => {
            const newWebApi = clone(webApi);
            newWebApi.prefixes = prefixes;
            setWebApi(newWebApi);
          };
          return (
            <Vocabularies
              availableVocabs={availableVocabs}
              selectedVocabs={webApi.vocabs}
              setSelectedVocabs={setSelectedVocabs}
              prefixes={webApi.prefixes}
              setPrefixes={setPrefixes}
              addVocab={(vocab) => setAvailableVocabs([...availableVocabs, vocab])}
            />
          );
        }
        case 'Functions':
          return <Functions />;
        case 'Configuration': {
          const setConfig = (newConfig: any) => {
            const newWebApi = clone(webApi);
            newWebApi.config = newConfig;
            setWebApi(newWebApi);
          };
          return <Configuration config={webApi.config} setConfig={setConfig} />;
        }

        default:
          return <h1>Page not found</h1>;
      }
    } else if (page.type === 'actions') {
      const annIndex = page.main;
      const action = webApi.actions[annIndex];

      switch (actionPages[page.sub][0]) {
        case 'Annotation': {
          const setAnnotation = (annotation: ActionRessourceDesc) => {
            const newWebApi = clone(webApi);
            newWebApi.actions[annIndex].annotationSrc = annotation;
            // newWebApi.actions[annIndex].annotation = actionToAnnotation(
            //   newWebApi.actions[annIndex],
            //   vocabHandler,
            //   webApi.templates,
            // );
            setWebApi(newWebApi);
          };
          // console.log(webApi.actions[annIndex].annotation);
          return (
            <Annotation
              isAction={true}
              baseType="http://schema.org/Action"
              key={annIndex}
              // annotation={annJsonLDToAnnSrc(webApi.actions[annIndex].annotation, vocabHandler)}
              annotation={action.annotationSrc}
              setAnnotation={setAnnotation}
              vocabHandler={vocabHandler}
              config={webApi.config}
              potTemplates={webApi.templates}
              getAnnotation={() => actionToAnnotation(action, vocabHandler, webApi.templates)}
            />
          );
        }
        case 'Potential Actions': {
          const setActionLink = (actionLinks: IActionLink[]) => {
            const newWebApi = clone(webApi);
            newWebApi.actions[annIndex].potentialActionLinks = actionLinks as PotentialActionLink[];
            // newWebApi.actions[annIndex].annotation = actionToAnnotation(
            //   newWebApi.actions[annIndex],
            //   vocabHandler,
            //   webApi.templates,
            // );
            setWebApi(newWebApi);
          };
          return (
            <ActionLinks
              type="Potential"
              webApi={webApi}
              baseAction={webApi.actions[annIndex]}
              actionRefs={actionRefs}
              actionLinks={webApi.actions[annIndex].potentialActionLinks}
              setActionLinks={setActionLink}
              getActions={getActions}
              config={webApi.config}
              getAnnotation={() =>
                actionLinksToAnnotation(
                  webApi.actions[annIndex].potentialActionLinks,
                  webApi.actions[annIndex].id,
                  'potential',
                  vocabHandler,
                )
              }
            />
          );
        }
        case 'Preceding Actions': {
          const setActionLink = (actionLinks: IActionLink[]) => {
            const newWebApi = clone(webApi);
            newWebApi.actions[annIndex].precedingActionLinks = actionLinks;
            // newWebApi.actions[annIndex].annotation = actionToAnnotation(
            //   newWebApi.actions[annIndex],
            //   vocabHandler,
            //   webApi.templates,
            // );
            setWebApi(newWebApi);
          };
          return (
            <ActionLinks
              type="Preceding"
              webApi={webApi}
              baseAction={webApi.actions[annIndex]}
              actionRefs={actionRefs}
              actionLinks={webApi.actions[annIndex].precedingActionLinks}
              setActionLinks={setActionLink}
              getActions={getActions}
              config={webApi.config}
              getAnnotation={() =>
                actionLinksToAnnotation(
                  webApi.actions[annIndex].precedingActionLinks,
                  webApi.actions[annIndex].id,
                  'preceeding',
                  vocabHandler,
                )
              }
            />
          );
        }
        case 'Request Mapping': {
          const setRequestMapping = (newReqMapping: any) => {
            const newWebApi = clone(webApi);
            newWebApi.actions[annIndex].requestMapping = newReqMapping;
            setWebApi(newWebApi);
          };
          const setSampleAction = (newSampleAction: any) => {
            const newWebApi = clone(webApi);
            newWebApi.actions[annIndex].sampleAction = newSampleAction;
            setWebApi(newWebApi);
          };
          return (
            <RequestMapping
              goToRespMapping={goToRespMapping}
              goToTestMapping={goToTestMapping}
              requestMapping={webApi.actions[annIndex].requestMapping}
              setRequestMapping={setRequestMapping}
              sampleAction={webApi.actions[annIndex].sampleAction}
              setSampleAction={setSampleAction}
              prefixes={webApi.prefixes}
            />
          );
        }

        case 'Response Mapping': {
          const setRequestMapping = (newReqMapping: any) => {
            const newWebApi = clone(webApi);
            newWebApi.actions[annIndex].responseMapping = newReqMapping;
            setWebApi(newWebApi);
          };
          const setSampleResponse = (newSampleResponse: any) => {
            const newWebApi = clone(webApi);
            newWebApi.actions[annIndex].sampleResponse = newSampleResponse;
            setWebApi(newWebApi);
          };
          return (
            <ResponseMapping
              goToReqMapping={goToReqMapping}
              goToTestMapping={goToTestMapping}
              responseMapping={webApi.actions[annIndex].responseMapping}
              setResponseMapping={setRequestMapping}
              sampleResponse={webApi.actions[annIndex].sampleResponse}
              setSampleResponse={setSampleResponse}
              prefixes={webApi.prefixes}
            />
          );
        }

        case 'Testing': {
          const setSampleAction = (newSampleAction: any) => {
            const newWebApi = clone(webApi);
            newWebApi.actions[annIndex].sampleAction = newSampleAction;
            setWebApi(newWebApi);
          };
          return (
            <TestMapping
              requestMapping={webApi.actions[annIndex].requestMapping}
              responseMapping={webApi.actions[annIndex].responseMapping}
              sampleAction={webApi.actions[annIndex].sampleAction}
              setSampleAction={setSampleAction}
              prefixes={webApi.prefixes}
              goToReqMapping={goToReqMapping}
              goToRespMapping={goToRespMapping}
            />
          );
        }
        default:
          return <h1>Page not found</h1>;
      }
    } else {
      const templateIndex = page.main;
      const setAnnotation = (annotation: TemplateRessourceDesc) => {
        setWebApi((oldWebApi) => {
          const newWebApi = clone(oldWebApi);
          newWebApi.templates[templateIndex].src = annotation;
          return newWebApi;
        });
      };
      const setBaseType = (type?: string) => {
        if (type) {
          setWebApi((oldWebApi) => {
            const newWebApi = clone(oldWebApi);
            newWebApi.templates[templateIndex].baseType = type;
            return newWebApi;
          });
        }
      };
      const template = webApi.templates[templateIndex];

      return (
        <Template
          key={templateIndex}
          template={template}
          setBaseType={setBaseType}
          setAnnotation={setAnnotation}
          vocabHandler={vocabHandler}
          config={webApi.config}
          potTemplates={webApi.templates}
          getAnnotation={() => templateToAnnotation(template, vocabHandler, webApi.templates)}
        />
      );
    }
  };

  const save = async () => {
    console.log(webApi);
    setIsSaving(true);
    // console.log(webApi);
    webApi.name = getNameOfWebApi(webApi);
    webApi.annotation = webApiToAnnotation(webApi, vocabHandler);
    // console.log(webApi.name);
    webApi.actions = webApi.actions.map((action) => ({
      ...action,
      name: getNameOfAction(action),
      annotation: actionToAnnotation(action, vocabHandler, webApi.templates),
    }));

    try {
      const body = {
        ...webApi,
      };
      const resp: any = await ky(`/api/webApi/${id || ''}`, {
        method: id ? 'patch' : 'post',
        json: body,
      }).json();
      // console.log(resp);
      toast.success('Saved WebAPI!');
      if (!id) {
        setId(resp._id);
        window.history.pushState({}, '', `/webApi/${resp._id}/edit`);
      }
    } catch (e) {
      console.log(e);
      toast.error(`Failed saving WebAPI: ${e.toString()}`);
    }

    setIsSaving(false);
  };

  // call here to set title variable
  const detailsPage = getDetailsPage();

  return (
    <WebAPIDetailsPage
      webApi={webApi}
      page={page}
      title={getNameOfWebApi(webApi)}
      setPage={setPage}
      newAction={newAction}
      setActionName={setActionName}
      deleteAction={deleteAction}
      newTemplate={newTemplate}
      setTemplateName={setTemplateName}
      deleteTemplate={deleteTemplate}
      disableSaveBtn={isSaving}
      save={save}
    >
      <div className="mt-3" />
      {isReady ? detailsPage : <Loading />}
    </WebAPIDetailsPage>
  );
};

export default WebApiCreate;
