'use strict';

const express = require('express');
const cors = require('cors');
const Handlebars = require('handlebars');
const path = require('path');
const moment = require('moment');
Handlebars.registerHelper('capitalize', function(string) {
    return `${string}`.toUpperCase()
 });

Handlebars.registerHelper('inc', function(string) {
    return parseInt(string)+1;
 });

Handlebars.registerHelper('formatDateTime', function(date, format) {
    return `${moment.utc(date).format(format)}`.toUpperCase();
});

 Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
  if (arguments.length < 3)
      throw new Error("Handlebars Helper equal needs 2 parameters");
  if( lvalue!=rvalue ) {
      return options.inverse(this);
  } else {
      return options.fn(this);
  }
});
Handlebars.registerHelper("subCom", function(a, b) {
    return a - b;
});

//Load environmental variables
require('dotenv').config();

// Set up the express app
const app = express();

// Allows the cors
app.use(cors());

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize DB Connection
require('./config/mongoose');

//serves files from uploads folder
//app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/uploads', express.static(path.resolve('./uploads')));

// Initialized routes
require('./routes')(app);

module.exports = app;