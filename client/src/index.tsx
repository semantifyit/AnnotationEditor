import 'bootstrap/dist/css/bootstrap.min.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faAngleDown,
  faAngleRight,
  faAngleLeft,
  faAngleUp,
  faCopy,
  faCog,
  faPlus,
  faSyncAlt,
  faHome,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

import App from './components/App';
// import registerServiceWorker from './registerServiceWorker';
import './styles/index.css';

library.add(
  faAngleDown,
  faAngleRight,
  faAngleUp,
  faAngleLeft,
  faCopy,
  faCog,
  faPlus,
  faSyncAlt,
  faHome,
  faTimes,
);

ReactDOM.render(<App />, document.getElementById('root') as HTMLElement);
// registerServiceWorker();

function registerHMR() {
  type ModuleHMR = typeof module & {
    hot?: {
      accept(
        dependencies: string | string[],
        callback: (updatedDependencies: any[]) => void,
      ): void;
    };
  };
  if ((module as ModuleHMR).hot) {
    (module as ModuleHMR).hot!.accept('./components/App', () => {
      ReactDOM.render(<App />, document.getElementById('root') as HTMLElement);
    });
  }
}

registerHMR();
