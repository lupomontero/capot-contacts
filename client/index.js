'use strict';


module.exports = function (app) {

  var contacts = {};

  contacts.findAll = function () {

    return app.request('GET', '/_contacts');
  };

  contacts.find = function () {};

  return contacts;
};

