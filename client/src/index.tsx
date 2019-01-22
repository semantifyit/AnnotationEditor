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
  faSave,
  faInfoCircle,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';

import App from './components/App';
// import registerServiceWorker from './registerServiceWorker';

// for light theme
(window as any).theme = 'light';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/bootstrap-override.css';

// for dark theme
// (window as any).theme = 'dark';
// import './styles/bootstrap-darkly.min.css';

import './styles/index.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-datetime/css/react-datetime.css';

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
  faSave,
  faInfoCircle,
  faDownload,
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

import axios from 'axios';
import { downloadContent } from './helpers/html';

const foo = async () => {
  const response = await axios({
    url: '/annotation/api/downloadWebAPIProjectZip',
    method: 'POST',
    responseType: 'blob',
  });
  console.log(response);
  downloadContent(response.data, 'action-server-nodejs.zip');
};
// foo();
