'use strict';


const Async = require('async');
const Routes = require('./routes');
const Pkg = require('../package.json');


const internals = {};


internals.validateDocUpdate = function (newDoc, oldDoc, userCtx, secObj) {

  if (newDoc._deleted) {
    return;
  }

  if (typeof newDoc.type !== 'string') {
    throw ({ forbidden: 'doc.type must be a string' });
  }

  log(newDoc);
  log(oldDoc);
  log(userCtx);
  log(secObj);
};


exports.register = function (server, options, done) {

  const db = server.app.couch.db('contacts');

  Async.series([
    db.createIfNotExists,
    Async.apply(db.addSecurity, {
      admins: { roles: ['_admin'] },
      members: { roles: ['_admin'] }
    }),
    Async.apply(db.setValidationFunction, internals.validateDocUpdate),
    Async.apply(db.addIndex, 'by_owner', {
      map: function (doc) {

        emit([doc.owner, doc.type], doc);
      }
    })
  ], (err) => {

    if (err) {
      return done(err);
    }

    server.route(Routes);

    done();
  });
};


exports.register.attributes = {
  name: Pkg.name,
  version: Pkg.version
};

