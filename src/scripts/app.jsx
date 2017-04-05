/* global document */

import React from 'react';
import { render } from 'react-dom';

require('../styles/main.scss');

const Header = require('./components/Header.jsx');
const Dropstrip = require('./components/dropstrip/Dropstrip.jsx');
const Explorer = require('./components/Explorer.jsx');

render(<Header />, document.getElementById('header'));
render(<Dropstrip />, document.getElementById('dropzone'));
render(<Explorer />, document.getElementById('explorer'));