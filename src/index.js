import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
//import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('root'));
//registerServiceWorker();

const logger = (...args) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args)
}

window.logger = logger
