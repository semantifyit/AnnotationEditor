import requestHeaders from './requestHeaders';
import responseHeaders from './responceHeaders';
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

const makeCompleter = (values: string[]): ICompleter => ({
  getCompletions: (editor, session, pos, prefix, callback) => {
    callback(
      null,
      values.map((word) => ({
        caption: word,
        value: word,
        meta: 'header',
      })),
    );
  },
});

export const requestHeaderCompleter: ICompleter = makeCompleter(requestHeaders);
export const responseHeaderCompleter: ICompleter = makeCompleter(
  responseHeaders,
);

export const getAnnotationCompleter = (
  ann: any,
  inputOutput: string,
): ICompleter => {
  const flattenedAnn = flattenObject(
    ann,
    '$',
    undefined,
    'PropertyValueSpecification',
  );
  return {
    getCompletions: (editor, session, pos, prefix, callback) => {
      callback(
        null,
        Object.keys(flattenedAnn)
          .filter((k) => k.endsWith(inputOutput))
          .map((k) => k.replace(inputOutput, ''))
          .map((word) => ({
            caption: word,
            value: word,
            meta: 'header',
          })),
      );
    },
  };
};
