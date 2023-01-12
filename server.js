var url = require("url"),
    fs = require("fs"),
    http = require("http"),
    path = require("path");
var express = require('express');
var querystring = require('querystring');
var util = require('util');
var join = require('path').join;
var bodyParser = require('body-parser');


var Neo4jConnector = require("./module/Neo4jConnector");
var connector = Neo4jConnector("neo4j+s://9ab5a65f.databases.neo4j.io","neo4j","jx0AdI1o7vRn1x1T5o5eLJNtmB30rRjA5sZNk4IKI_Y");
var parser = require("./Parser/parser");
//file explorer controller
var controller = require('./file_explorer/node-explorer/controller');
var app = express();
var dir = process.cwd();

app.use(express.static(dir));
app.use(express.static(join(dir,"file_explorer/node-explorer")));
app.use(express.static(__dirname));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

function getJsonFiles(jsonPath){
    let jsonFiles = [];
    function findJsonFile(path){
        let files = fs.readdirSync(path);
        files.forEach(function (item, index) {
            let fPath = join(path,item);
            let stat = fs.statSync(fPath);
            if(stat.isDirectory() === true) {
                findJsonFile(fPath);
            }
            if (stat.isFile() === true) { 
              jsonFiles.push(fPath);
            }
        });
    }
    findJsonFile(jsonPath);
    //console.log(jsonFiles);
	return jsonFiles;
}

var server = http.createServer(app).listen(80);

app.get('/filelist', function(req, res) {
    let list = getJsonFiles("example");
    res.end(JSON.stringify(list));
});
  
app.post('/parsecode', async function (req, res) {
    let params = req.body;
    let path = params.path;
    await parser.parse(connector, path);
    res.end(util.inspect(params));
});
  
//file explorer handler
app.get('/files', function(req, res) {
    controller.getFiles(req, res, dir);
  });
  
app.get('/explorer', function(req, res) {
res.redirect('file_explorer/node-explorer/lib/index.html');
});


console.log("监听80端口");
