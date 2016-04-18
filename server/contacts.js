'use strict';


const Joi = require('joi');
const Boom = require('boom');


const internals = {};


internals.parse = function (doc) {

  doc.id = doc._id.split('/').slice(1).join('/');
  delete doc._id;
  delete doc._deleted_conflicts;
  return doc;
};


internals.getOne = function (req, reply) {

  const db = req.server.app.couch.db('contacts');
  const id = req.params.id;
  const owner = req.auth.credentials.uid;

  db.get(encodeURIComponent('contact/' + owner + '/' + id), (err, data) => {

    if (err) {
      return reply(Boom.wrap(err, err.statusCode || 500, err.message));
    }

    reply(internals.parse(data));
  });
};


internals.getAll = function (req, cb) {

  const db = req.server.app.couch.db('contacts');

  db.get('/_all_docs', {
    startkey: 'contact/',
    endkey: 'contact0',
    include_docs: true
  }, (err, data) => {

    if (err) {
      return cb(err);
    }

    const docs = data.rows.map((row) => {

      return internals.parse(row.doc);
    });

    cb(null, docs);
  });
};


internals.getByOwner = function (req, cb) {

  const db = req.server.app.couch.db('contacts');
  const owner = req.auth.credentials.uid;

  db.query('by_owner', { key: [owner, 'contact'] }, (err, rows) => {

    if (err) {
      return cb(err);
    }

    const docs = rows.map((row) => {

      return internals.parse(row.value);
    });

    cb(null, docs);
  });
};



exports.list = {
  description: 'List user contacts.',
  auth: 'user',
  response: {
    schema: Joi.array().items(Joi.object().keys({
      _rev: Joi.string().required(),
      type: 'contact',
      owner: Joi.string().required(),
      createdAt: Joi.string().required(),
      id: Joi.string().required(),
      givenName: Joi.string().required(),
      familyName: Joi.string().required(),
      org: Joi.string(),
      email: Joi.string().email().required(),
      tel: Joi.string().required(),
      streetAddress: Joi.string().required(),
      locality: Joi.string().required(),
      region: Joi.string().required(),
      postCode: Joi.string().required(),
      country: Joi.string().required()
    }))
  },
  handler: function (req, reply) {

    if (req.auth.credentials.isAdmin) {
      return internals.getAll(req, (err, data) => {

        reply(err || data);
      });
    }

    internals.getByOwner(req, (err, data) => {

      reply(err || data);
    });
  }
};


exports.get = {
  auth: 'user',
  validate: {
    params: {
      id: Joi.string().required(),
    }
  },
  response: {
    schema: Joi.object().keys({
      _rev: Joi.string().required(),
      type: 'contact',
      owner: Joi.string().required(),
      createdAt: Joi.string().required(),
      id: Joi.string().required(),
      givenName: Joi.string().required(),
      familyName: Joi.string().required(),
      org: Joi.string(),
      email: Joi.string().email().required(),
      tel: Joi.string().required(),
      streetAddress: Joi.string().required(),
      locality: Joi.string().required(),
      region: Joi.string().required(),
      postCode: Joi.string().required(),
      country: Joi.string().required()
    })
  },
  pre: [{ method: internals.getOne, assign: 'contact' }],
  handler: function (req, reply) {

    reply(req.pre.contact);
  }
};


exports.put = {
  description: 'Create or update contact.',
  auth: 'user',
  validate: {
    params: {
      id: Joi.string().required(),
    },
    payload: {
      givenName: Joi.string().required(),
      familyName: Joi.string().required(),
      org: Joi.string(),
      email: Joi.string().email().required(),
      tel: Joi.string().required(),
      streetAddress: Joi.string().required(),
      locality: Joi.string().required(),
      region: Joi.string().required(),
      postCode: Joi.string().required(),
      country: Joi.string().required()
    }
  },
  response: {
    schema: Joi.object().keys({
      ok: true,
      id: Joi.string().required(),
      rev: Joi.string().required()
    })
  },
  handler: function (req, reply) {

    const db = req.server.app.couch.db('contacts');
    const id = req.params.id;
    const owner = req.auth.credentials.uid;
    const doc = Object.keys(req.payload).reduce((memo, key) => {

      memo[key] = req.payload[key];
      return memo;
    }, {});
    
    doc._id = 'contact/' + owner + '/' + id;
    doc.type = 'contact';
    doc.owner = owner;
    doc.createdAt = new Date();

    db.put(encodeURIComponent(doc._id), doc, (err, data) => {

      if (err) {
        return reply(Boom.wrap(err, err.statusCode || 500, err.message));
      }

      reply(data);
    });
  }
};


exports.remove = {
  auth: 'user',
  validate: {
    params: {
      id: Joi.string().required(),
    },
    query: {
      rev: Joi.string().required()
    }
  },
  response: {
    schema: Joi.object().keys({
      ok: true,
      id: Joi.string().required(),
      rev: Joi.string().required()
    })
  },
  handler: function (req, reply) {

    const db = req.server.app.couch.db('contacts');
    const id = req.params.id;
    const owner = req.auth.credentials.uid;
    const docId = 'contact/' + owner + '/' + id;

    db.put(encodeURIComponent(docId), {
      _id: docId,
      _rev: req.query.rev,
      _deleted: true
    }, (err, data) => {

      if (err) {
        return reply(Boom.wrap(err, err.statusCode || 500, err.message));
      }

      reply(data);
    });
  }
};

