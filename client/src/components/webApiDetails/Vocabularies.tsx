import React, { useState, useRef, useEffect } from 'react';
import { FaPlus, FaPencilAlt, FaTrashAlt, FaSave, FaTimes } from 'react-icons/fa';

import { VocabLeanDoc as Vocab } from '../../../../server/src/models/Vocab';
import { cutString } from '../../util/utils';
import VocabHandler from '../../util/VocabHandler';
import CheckBox from '../Checkbox';
import ModalBtn from '../ModalBtn';
import AddVocab from './AddVocab';

type Context = Record<string, string>;

interface Props {
  availableVocabs: Vocab[];
  selectedVocabs: string[];
  setSelectedVocabs: (args: string[]) => void;
  context: Context;
  setContext: (arg: Context) => void;
  addVocab: (vocab: Vocab) => void;
}

const Vocabularies = ({
  availableVocabs,
  selectedVocabs,
  setSelectedVocabs,
  context,
  setContext,
  addVocab,
}: Props) => {
  const [editPrefix, setEditPrefix] = useState('');
  const [editUri, setEditUri] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  const [isEditNew, setIsEditNew] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // TODO update eslint bug https://github.com/typescript-eslint/typescript-eslint/issues/1138
    // eslint-disable-next-line no-unused-expressions
    inputRef?.current?.focus();
  }, [editIndex]);

  const vocabProcs = availableVocabs
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((vocab) => new VocabHandler(vocab.vocab, context));

  const deletePrefixClick = (prefix: string) => {
    const { [prefix]: old, ...rest } = context;
    setContext(rest);
  };

  const editPrefixClick = (prefix: string, index: number) => {
    setEditPrefix(prefix);
    setEditUri(context[prefix]);
    setEditIndex(index);
  };

  const saveEdit = () => {
    if (isEditNew) {
      setContext({
        ...context,
        [editPrefix]: editUri,
      });
    } else {
      const { [Object.keys(context)[editIndex]]: old, ...rest } = context;
      setContext({
        ...rest,
        [editPrefix]: editUri,
      });
    }
    setEditIndex(-1);
    setIsEditNew(false);
  };

  const cancelEdit = () => {
    setEditIndex(-1);
    setIsEditNew(false);
  };

  const newPrefixClick = () => {
    setEditPrefix('');
    setEditUri('');
    setEditIndex(0);
    setIsEditNew(true);
  };

  const prefixLine = (prefix: string, uri: string, index: number, isNew = false) => {
    const isBeingEdited = isEditNew ? isNew : editIndex === index;
    return (
      <tr key={prefix}>
        <td>
          {isBeingEdited ? (
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              value={editPrefix}
              onChange={(e) => setEditPrefix(e.target.value)}
            />
          ) : (
            prefix
          )}
        </td>
        <td>
          {isBeingEdited ? (
            <div className="d-flex">
              <input
                type="text"
                className="form-control"
                value={editUri}
                onChange={(e) => setEditUri(e.target.value)}
              />
              <button type="button" className="btn btn-primary ml-2" title="Save" onClick={saveEdit}>
                <FaSave />
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary ml-2"
                title="Cancel"
                onClick={cancelEdit}
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            uri
          )}
        </td>
        <td>
          <FaPencilAlt
            className="pointer text-primary"
            title="Edit"
            onClick={() => editPrefixClick(prefix, index)}
          />
          <FaTrashAlt className="pointer ml-3" title="Delete" onClick={() => deletePrefixClick(prefix)} />
        </td>
      </tr>
    );
  };

  return (
    <>
      <h4 className="pt-4">
        <span>Available Vocabularies</span>
        <ModalBtn
          modalTitle="Add new Vocabulary"
          btnClassName="btn-outline-primary float-right mb-1"
          btnContent={() => (
            <>
              <FaPlus /> Add Vocabulary
            </>
          )}
        >
          <AddVocab addVocab={addVocab} />
        </ModalBtn>
      </h4>
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Description</th>
            <th scope="col">Classes</th>
            <th scope="col">Properties</th>
            <th scope="col">Is used</th>
          </tr>
        </thead>
        <tbody>
          {availableVocabs
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((vocab, i) => (
              <tr key={vocab._id}>
                <td>{vocab.name}</td>
                <td title={vocab.description}>
                  {vocab.description ? cutString(vocab.description, 50) : <i>No description available</i>}
                </td>
                <td>{vocabProcs[i].getClasses().length}</td>
                <td>{vocabProcs[i].getProperties().length}</td>
                <td>
                  <CheckBox
                    checked={selectedVocabs.includes(vocab._id)}
                    setChecked={() =>
                      setSelectedVocabs(
                        selectedVocabs.includes(vocab._id)
                          ? selectedVocabs.filter((id) => id !== vocab._id)
                          : selectedVocabs.concat(vocab._id),
                      )
                    }
                  />
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <h4 className="pt-5">
        <span>Namespaces/Prefixes</span>
        <button type="button" className="btn btn-outline-primary float-right mb-1" onClick={newPrefixClick}>
          <FaPlus /> Add Prefix
        </button>
      </h4>
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th scope="col">Prefix</th>
            <th scope="col">URI</th>
            <th scope="col" style={{ width: '5rem' }}></th>
          </tr>
        </thead>
        <tbody>
          {isEditNew && prefixLine('', '', 0, true)}
          {Object.entries(context)
            .sort(([k], [k2]) => k.localeCompare(k2))
            .map(([prefix, uri], i) => prefixLine(prefix, uri, i))}
        </tbody>
      </table>
    </>
  );
};

export default Vocabularies;
