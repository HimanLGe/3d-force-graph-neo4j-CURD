#!/usr/bin/env node

var http = require('http');
var express = require('express');
var program = require('commander');
var colors = require('colors');

program
.option('-p, --port <port>', 'Port number, default value is 8080')
.parse(process.argv);

var app = express();
var dir = process.cwd();
var controller = require('./controller');

app.use(express.static(dir));
app.use(express.static(__dirname));

var server = http.createServer(app);

app.get('/files', function(req, res) {
  controller.getFiles(req, res, dir);
});

app.get('/', function(req, res) {
 res.redirect('lib/index.html');
});

program.port = program.port || 8088;
server.listen(program.port);

console.log('Hi! node-explorer is running on http://localhost:'.magenta + program.port);