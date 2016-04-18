'use strict';

const Contacts = require('./contacts');


module.exports = [
  { path: '/_contacts', method: 'GET', config: Contacts.list },
  { path: '/_contacts/{id}', method: 'GET', config: Contacts.get },
  { path: '/_contacts/{id}', method: 'PUT', config: Contacts.put },
  { path: '/_contacts/{id}', method: 'DELETE', config: Contacts.remove }
];

