import * as React from 'react';

import Vocab from './Vocab';

// tslint:disable-next-line
export const VocabContext = React.createContext({
  vocab: new Vocab(),
});

export interface IContext {
  vocab: Vocab;
}
