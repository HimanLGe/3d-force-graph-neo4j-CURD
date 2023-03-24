var url = require("url"),
    fs = require("fs"),
    http = require("http"),
    path = require("path");
var express = require('express');
const axios = require('axios');
const { exec,spawn } = require('child_process');
var querystring = require('querystring');
var util = require('util');
var join = require('path').join;
var bodyParser = require('body-parser');


var Neo4jConnector = require("./module/Neo4jConnector");
var connector = Neo4jConnector("neo4j://localhost:7687","neo4j","AGCF3xJumbfJD-b");
var parser = require("./Parser/parser");
//file explorer controller
var controller = require('./file_explorer/node-explorer/controller');
var app = express();
var dir = process.cwd();
const KEYWORD = "";

app.use(express.static(dir));
app.use(express.static(join(dir,"file_explorer/node-explorer")));
app.use(express.static(__dirname));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Content-Type', 'application/json;charset=utf-8');
    next();
  });

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

app.post('/search', async function (req, res) { 
    let params = req.body;
    let name = params.name;
    let page = params.page;
    let perPage = 10;
  try {
    let response;
      
        response = await axios.get(`https://api.npms.io/v2/search?q=${name}${KEYWORD}&from=${(page - 1) * perPage}&size=${perPage}`);
      
        const searchResults = response.data.results;
        const packageNames = searchResults.map(result => result.package.name);
        console.log(packageNames);
        res.json(packageNames);
      } catch (error) {
        console.error(error);
    }
});

app.post('/installPlugin', async function (req, res) { 
    let params = req.body;
    let name = params.name;
    
    exec(`npm install ${name} --prefix ./plugins`, (error, stdout, stderr) => {
        if (error) {
            console.error(`执行命令出错：${error}`);
            res.json({result:"error"});
          return;
        }
        console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      
      let content = fs.readFileSync('plugins.txt', 'utf-8');
      content = content+`${name}\n`
      fs.writeFileSync('plugins.txt', content, 'utf-8');

        res.json({status:"success"});
      });
});

app.post('/uninstallPlugin', async function (req, res) { 
  let params = req.body;
  let name = params.name;
  
  exec(`npm uninstall ${name}`, (error, stdout, stderr) => {
      if (error) {
          console.error(`执行命令出错：${error}`);
          res.json({result:"error"});
        return;
      }
      console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    
    let content = fs.readFileSync('plugins.txt', 'utf-8');
    content = content.split('\n').filter(line => !line.includes(name)).join('\n');
    fs.writeFileSync('plugins.txt', content, 'utf-8');

      res.json({status:"success"});
    });
});

app.get('/listPlugins', function (req, res) {
    const array = [];

    // 使用fs模块中的readFileSync方法同步读取文件内容
    const content = fs.readFileSync('plugins.txt', 'utf-8');
    
    // 将文件内容按行分割成数组
    const lines = content.split('\n');
    
    // 循环遍历每一行，并将其作为数组元素存储
    lines.forEach((line) => {
      if (line != '') {
        array.push(line.trim());
      }
    });
    
  console.log(array); 
  res.json(array);
});


console.log("监听80端口");

const appurl = 'http://localhost/testWith3dGraph.html';

spawn('cmd', ['/c', 'start', appurl], {stdio: 'ignore'});
