var colors = require('colors');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

function getFiles(req, res, dir) {
  var currentDir =  dir;
  var query = req.query.path || '';
  var up = req.query.up;

  if (query) {
    currentDir = query;
  }

  if (up) {
    currentDir = query;
  }

  if (query == '') { 
    currentDir = dir;
  }

  console.log('Browsing: '.green, currentDir.cyan);
  
  fs.readdir(currentDir, function (err, files) {
    if (err) {
      throw err;
    }

    var data = [];

    files.filter(function (file) {
      return true;
    })
    .forEach(function (file) {
      try {
        data.push({ 
          name: file,
          isDirectory: fs.statSync(path.join(currentDir, file)).isDirectory(), 
          path: path.join(query, file),
          ext: path.extname(file)
        });
      }
      catch(e) {
        console.log('Error: ' + e);
      }

    });
    data = _.sortBy(data, function(f) { return f.Name; });
    data.push(currentDir);
    res.json(data);
  });
}

module.exports.getFiles = getFiles;