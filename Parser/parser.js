const fs = require('fs');
const babel = require('@babel/parser');
const generate = require('babel-generator').default;

async function parse(connector,fpath) {
  // 读取文件内容
  let fileContent = fs.readFileSync(fpath, 'utf-8');

  // 使用 Babel 解析文件内容并生成 AST
  const ast = babel.parse(fileContent);

  fileContent = fileContent.replaceAll("\n", " ").replaceAll("\t", "").replaceAll("\r"," ").replaceAll("\"","`");

  

  var nodeStack = [];

  var _this = this;

  // 遍历 AST
  const traverse = require('babel-traverse').default;
  traverse(ast, {
  
    FunctionDeclaration: function (path) {
      
    },
    VariableDeclaration: function (path) {
    
    },
    ImportDeclaration: function (path) {
    
    },
    ExportDefaultDeclaration: function (path) {
    
    },
    IfStatement: function (path) {
    
    },
    ForInStatement: function (path) {
    
    },
    SwitchStatement: function (path) {
    
    },
    WhileStatement: function (path) {
    
    },
    ForStatement: function (path) {
    
    },
    BreakStatement: function (path) {
    
    },
    ContinueStatement: function (path) {
    
    },
    ReturnStatement: function (path) {
    
    },
    BlockStatement: function (path) {
    
    },
    ExpressionStatement: function (path) {
      //if is a function call , get its paramters , search them in neo4j ,connect the params and this function call
      let params = [];
      let node = connector.initNode();
      if (path.node.expression.type == "CallExpression") {
        node.properties.name = path.node.expression.callee.name;
        params = path.node.expression.arguments
      }
      
      else { 
        node.properties.name = "Unknown ExpressionStatement";
      }
      connector.addNodes([node]).then(async res => {
        let fNodeId = res[0];
        
        let rel = connector.initRelationship();
        rel.label = "param";
        for (let i = 0; i < params.length; i++) { 
          if (params[i].type == "Identifier") {
            let paramNodeId = await connector.findNearestNodeIdByIdAndProps(fNodeId, { name: params[i].name });
            if (paramNodeId == null) { }
            else {
              await connector.addRelationship(fNodeId, rel, paramNodeId);
            }
          }
        }
      });
      
    },
    Statement: function (path) {
      console.log(path.node);
      console.log(fileContent.substring(path.node.start, path.node.end));
      let node = connector.initNode();
      node.properties.name = fileContent.substring(path.node.start, path.node.end);
      nodeStack.push(node);
      
    }.bind(this)
  
  });

  await connector.addNodes([nodeStack[0]]).then(async res => { 
    var pNodeId = res[0];
    for (let i = 1; i < nodeStack.length; i++){
      let node = nodeStack[i];
     
        pNodeId = await connector.concatNode(pNodeId, node, null);
      
    }

  });

  

  // 输出解析后的 AST
  console.log(ast);

  // 将 AST 重新生成为 JavaScript 代码
  const output = generate(ast);
  console.log(output.code);

}

exports.parse = parse;