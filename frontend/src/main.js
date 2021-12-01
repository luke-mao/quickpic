import API from './api.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

import initPage from './init.js'


// This url may need to change depending on what port your backend is running
// on.
export const api = new API('http://localhost:5000');

// Example usage of makeAPIRequest method.
// api.makeAPIRequest('dummy/user')
//     .then(r => console.log(r));



initPage();

