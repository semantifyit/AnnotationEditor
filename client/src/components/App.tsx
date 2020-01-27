import React from 'react';
import { ToastContainer } from 'react-toastify';

import '../styles/App.css';

import AppRouter from './Router';

const App = () => (
  <>
    <ToastContainer hideProgressBar={true} autoClose={3000} />
    <AppRouter />
  </>
);

export default App;
