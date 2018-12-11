import requestHeaders from './requestHeaders';
import { flattenObject } from '../../helpers/util';

interface ICompleter {
  getCompletions(
    editor: any,
    session: any,
    pos: { row: number; column: number },
    prefix: string,
    callback: (
      idk: null,
      values: { caption: string; value: string; meta: string }[],
    ) => void,
  ): void;
}

export const requestHeaderCompleter: ICompleter = {
  getCompletions: (editor, session, pos, prefix, callback) => {
    // console.log(editor);
    // console.log(session);
    console.log(pos);
    console.log(prefix);
    console.log(editor.getValue());
    callback(
      null,
      requestHeaders.map((word) => ({
        caption: word,
        value: word,
        meta: 'header',
      })),
    );
  },
};

export const getAnnotationCompleter = (
  ann: any,
  inputOutput: string,
): ICompleter => {
  const flattenedAnn = flattenObject(ann, '$');
  return {
    getCompletions: (editor, session, pos, prefix, callback) => {
      callback(
        null,
        Object.keys(flattenedAnn)
          .filter((k) => k.endsWith(inputOutput))
          .map((word) => ({
            caption: word,
            value: word,
            meta: 'header',
          })),
      );
    },
  };
};
