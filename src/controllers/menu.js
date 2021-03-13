const express = require('express');
var exports = module.exports;

exports.get = function (req, res) {
  var fullUrl = req.protocol + '://' + req.get('host') + '/room/'
  res.render('index', { 
    sessionId: req.session.id,
    joinUrl: fullUrl
   });
}