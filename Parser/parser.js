const fs = require('fs');
const babel = require('@babel/parser');
const types = require('@babel/types');
const { assertDeclareClass } = require('@babel/types');
const generate = require('babel-generator').default;



let nodesLinkParent = [];

let nodesLinkCalee = [];
let nodesLinkParams = [];

let nodesLinkPrev = [];

async function parse(connector, fpath) {
  
  function handelLinkList() { 

    let rel = connector.initRelationship();
  
    nodesLinkPrev.forEach(p => { 
      let prevPath = null;
      if (p.node.type == "BlockStatement") {
        
        prevPath = p.parentPath;
        if (prevPath.nodeid == undefined) {
          if (prevPath.key == -1 && prevPath.parentPath.key == "program") {
            return;
          }
          if (isNaN(prevPath.key)|| prevPath.key == "program") return;
          prevPath = p.parentPath;
          
        }
        if (prevPath.nodeid) { 
          rel.properties.name = "content";
          connector.addRelationship(prevPath.nodeid, rel, p.nodeid);
          return;
        }
      } else if(p.node.type == "IfStatement"){
        let blockStatementPath = p.get("consequent");//获取if下面的block
        prevPath = p.getPrevSibling();
        if (prevPath.nodeid == undefined) { 
          prevPath = p.parentPath;
        }
        if (prevPath.get("consequent").node) prevPath = prevPath.get("consequent");//如果前兄弟是有括号的语句，prevpath接到括号后面
        if (prevPath.nodeid) { 
          rel.properties.name = "next";
          connector.addRelationship(prevPath.nodeid,rel,p.nodeid);
        }
      } 
      else {
        prevPath = p.getPrevSibling();
        if (prevPath.nodeid == undefined) {
          if (prevPath.key == -1 && prevPath.parentPath.key == "program") {
            return;
          }
          if (isNaN(prevPath.key)|| prevPath.key == "program") return;
          prevPath = p.parentPath;//因为此元素没有prev，只有parent,那就不linkprev了,linkparent
          if(prevPath.get("consequent").node) prevPath = prevPath.get("consequent");//如果前兄弟是有括号的语句，prevpath接到括号后面
          rel.properties.name = "content";
          connector.addRelationship(prevPath.nodeid, rel, p.nodeid);
          return;
          
        }
        if (prevPath.get("consequent").node) prevPath = prevPath.get("consequent");//如果前兄弟是有括号的语句，prevpath接到括号后面
        if (prevPath.nodeid) { 
          rel.properties.name = "next";
          connector.addRelationship(prevPath.nodeid,rel,p.nodeid);
        }
      }
      
      
      
    });
  
    nodesLinkParent.forEach(p => { 
      let parentPath = getCallerPath(p);
      if (parentPath && parentPath.nodeid) { 
        rel.properties.name = "back to";
        connector.addRelationship(p.nodeid,rel,parentPath.nodeid);
      }
    });
  
    nodesLinkParams.forEach(p => {
      let paramPaths = getParamsPath(p);
      paramPaths.forEach(p2=>{
        if (p.nodeid) {
          rel.properties.name = "param";
          connector.addRelationship(p2.nodeid, rel, p.nodeid);
        }
      });
    });

    nodesLinkCalee.forEach(p => {
      let callee = getCalleePath(p);
      
        if (callee.nodeid) {
          rel.properties.name = "call";
          connector.addRelationship(p.nodeid, rel, callee.nodeid);
        }
      
    });
  
  
  
    
  }

  async function addNodeWithName(path,name) { 
    let node = connector.initNode();
    node.properties.name = name;
    let nodeids = await connector.addNodes([node]);
    path.nodeid = nodeids[0];
  }


  // 读取文件内容
  let fileContent = fs.readFileSync(fpath, 'utf-8');

  // 使用 Babel 解析文件内容并生成 AST
  const ast = babel.parse(fileContent);

  fileContent = fileContent.replaceAll("\n", " ").replaceAll("\t", "").replaceAll("\r"," ").replaceAll("\"","`");

  


  // 遍历 AST
  const traverse = require('babel-traverse').default;
  traverse(ast, {
  
    FunctionDeclaration:  function (path) {
      let name = fileContent.substring(path.node.start, path.node.id.end+1);;
      addNodeWithName(path,name);
      nodesLinkPrev.push(path);
      if (isLastBlockStatement(path)) { 
        nodesLinkParent.push(path);
      }
    },
    VariableDeclaration:  function (path) {

      
      

      if (isLastBlockStatement(path)) { 
        nodesLinkParent.push(path);
      }
       path.node.declarations.forEach( o => { 
        let name = path.node.kind+" "+o.id.name;
        addNodeWithName(path,name);
        nodesLinkPrev.push(path);
        
      });

      
      
      
    },
    ImportDeclaration: function (path) {
    
    },
    ExportDefaultDeclaration: function (path) {
    
    },
    IfStatement:  function (path) {
      

      let name = fileContent.substring(path.node.start, path.node.test.end+1);
      addNodeWithName(path,name);
      nodesLinkPrev.push(path);
      nodesLinkParams.push(path);
      if (isLastBlockStatement(path)) { 
        nodesLinkParent.push(path);
      }
    },
    ForInStatement: function (path) {
      

      
      let name = path.id.name;//???????
      addNodeWithName(path, name);
      nodesLinkParams.push(path);
      nodesLinkPrev.push(path);
      if (isLastBlockStatement(path)) { 
        nodesLinkParent.push(path);
      }
    },
    SwitchStatement: function (path) {
    
    },
    WhileStatement: function (path) {
    
    },
    ForStatement: function (path) {
      let name = fileContent.substring(path.node.start, path.node.update.end + 1);
      addNodeWithName(path, name);
      nodesLinkParams.push(path);
      nodesLinkPrev.push(path);
      if (isLastBlockStatement(path)) { 
        nodesLinkParent.push(path);
      }
    },
    BreakStatement: function (path) {
      let name = path.id.name;//???????
      addNodeWithName(path,name);
      nodesLinkPrev.push(path);
      
        nodesLinkParent.push(path);
      
    },
    ContinueStatement: function (path) {
      let name = path.id.name;//???????
      addNodeWithName(path,name);
      nodesLinkPrev.push(path);
      
        nodesLinkParent.push(path);
      
    },
    ReturnStatement: function (path) {
      //let name = path.id.name;//???????
      addNodeWithName(path,"return");
      nodesLinkPrev.push(path);
      
        nodesLinkParent.push(path);
      
      
    },
    BlockStatement:  function (path) {
      
      addNodeWithName(path,"block");
      nodesLinkPrev.push(path);
      if (isLastBlockStatement(path)) { 
        nodesLinkParent.push(path);
      }
    },
    ExpressionStatement: function (path) {
      let name = "";
      if (path.node.expression.type == "CallExpression") {
        name = fileContent.substring(path.node.start, path.node.end);;
      }else { 
        name = "Unknown ExpressionStatement";
      }


      addNodeWithName(path,name);
      nodesLinkPrev.push(path);
      nodesLinkCalee.push(path);
      nodesLinkParams.push(path);
      if (isLastBlockStatement(path)) { 
        nodesLinkParent.push(path);
      }

      
      
    },
    Statement: function (path) {
      console.log(path.node);
      console.log(fileContent.substring(path.node.start, path.node.end));
      
      // node.properties.name = fileContent.substring(path.node.start, path.node.end);
      
      
    }.bind(this)
  
  });

  await sleep(2000);
  handelLinkList();

  

  // 输出解析后的 AST
  console.log(ast);

  // 将 AST 重新生成为 JavaScript 代码
  const output = generate(ast);
  console.log(output.code);

}







function isLastBlockStatement(path) { 
  if (path.parentPath.type == "Program") return false;
  if (path.node.body && !Array.isArray(path.node.body)) return false;
  //if (path.type == "BlockStatement") path = path.parentPath;
  let parent;
  
    parent = path.getFunctionParent();
  


  
  let bodyPath = parent.get("body");
  let lastStatementPath = bodyPath.get("body")[bodyPath.get("body").length-1];
  
  if (path.isBlockStatement()) path = path.parentPath;//babel记录的是括号的前面那部分在body数组里
  return path == lastStatementPath;
}

function getLastStatementPath(p) { 
  let lastStatementPath;
  p.traverse({
  Statement(path) {
    lastStatementPath = path;
  }
  });
  return lastStatementPath;
}

function getCallerPath(path) {
  let caller = null;
  let parentPath = null;
  if (path.isBlockStatement()) {
    parentPath = path.parentPath.parentPath;
  }
  else { parentPath = path.parentPath; }

  // while (parentPath && !caller) {
  //   if (types.isCallExpression(parentPath.node)) {
  //     const callee = parentPath.get('callee');
  //     caller = callee.get('object');
  //   } else if (types.isFunctionDeclaration(parentPath.node)) {
  //     caller = parentPath;
  //   } else {
  //     parentPath = parentPath.parentPath;
  //   }
  // }
  // if (caller == null) return null;
  return parentPath;
}

function getCalleePath(path) {
  return path.get("expression").get("callee").resolve();
}

function getParamsPath(path) {
  let paths = [];

  if (path.node.type == "IfStatement") {
    let testPath = path.get("test");

    testPath.traverse({
      Identifier(identifierPath) {
        let variableName = identifierPath.node.name;
        let variableBinding = identifierPath.scope.getBinding(variableName);
        let variableDeclaration = variableBinding.path.parentPath;
        paths.push(variableDeclaration);
      }
    });
  }
  else if (path.node.type == "ForStatement") { 
    let initPath = path.get("init");
    let testPath = path.get("test");
    let updatePath = path.get("update");

    
    initPath.traverse({
      Identifier(identifierPath) {
        let variableName = identifierPath.node.name;
        let variableBinding = identifierPath.scope.getBinding(variableName);
        let variableDeclaration = variableBinding.path.parentPath;
        paths.push(variableDeclaration);
      }
    });

    testPath.traverse({
      Identifier(identifierPath) {
        let variableName = identifierPath.node.name;
        let variableBinding = identifierPath.scope.getBinding(variableName);
        let variableDeclaration = variableBinding.path.parentPath;
        paths.push(variableDeclaration);
      }
    });

    updatePath.traverse({
      Identifier(identifierPath) {
        let variableName = identifierPath.node.name;
        let variableBinding = identifierPath.scope.getBinding(variableName);
        let variableDeclaration = variableBinding.path.parentPath;
        paths.push(variableDeclaration);
      }
    });
  }
  else {
    path.node.expression.arguments.forEach((a) => {
      let binding = path.scope.getBinding(a.node.name);
      if (binding) { paths.push(binding.path); }
    });
  }
  return paths;
}

function sleep(time) {
  return new Promise(resolve =>
    setTimeout(resolve,time)
) }





exports.parse = parse;