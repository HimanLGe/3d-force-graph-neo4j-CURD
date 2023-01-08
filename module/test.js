const con = require('./Neo4jConnector');
a = con('neo4j+s://9ab5a65f.databases.neo4j.io','neo4j','jx0AdI1o7vRn1x1T5o5eLJNtmB30rRjA5sZNk4IKI_Y');
node2 = a.initNode();
node2.properties = {name:"node2"}
r = a.initRelationship();
a.concatNode(1,node2,r)