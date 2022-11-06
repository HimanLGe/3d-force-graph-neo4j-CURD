# 3d-Force-Graph-Neo4j-CURD

![preview](https://github.com/HimanLGe/3d-force-graph-neo4j-CURD/blob/master/img/preview.jpg?raw=true)

## Brief

​	3d view of neo4j data,using based on 3d-force-graph & neo4j ,I want to build a Scalability system that is easy to extend any features,so it might be a little complicated

## Usage

1. install node.js,double click open.bat to open local http server

2. edit testWith3dGraph.html,modify your database like

```html
// initialize Neo4jConnector //
a = new Connector("bolt://localhost:7687","neo4j","123456")
a.setDatabase("neo4j")
```

3. visit localhost/testWith3dGraph.html on your browser
4. Enjoy my friend~

## File Description

1. testWith3dGraph.html

> ​	Integrate other files

2. basic.js

> ​	Manage 3d-force-graph preference

3. Neo4jConnector.js

> ​	Provide basic neo4j cypher command

4. eventManager.js

> ​	Manage event, including  3d-force-graph event

5. GUI.js

> Current gui plugin is dat.gui

6. GUIController.js

> Abstract layer,isolate my project & other gui plugin

7.neo4jWith3DGraph.js

> Integrate Neo4jConnector & basic.js





## Notes

This is a project in start-up phase



If you also interest in neo4j ,Data science, Welcome to discuss at:

> Telegram https://t.me/+IyqE6UoFisM5ZTg1
>
> QQ:762039266

I'm lonely. Who will chat with me.😥
