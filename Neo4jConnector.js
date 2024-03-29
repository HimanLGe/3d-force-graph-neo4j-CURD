
(function (){
	
	
document.write('<script src="https://unpkg.com/neo4j-driver@5.1.0/lib/browser/neo4j-web.js" type="text/javascript" charset="utf-8"></script>');
	class Neo4jConnector{
	
	constructor(url,name,password){
		this.url = url;
		this.name = name;
		this.password = password;
		this.driver = neo4j.driver(url, neo4j.auth.basic(name, password));
		this.eventType = {
			addNodesFinish:"Neo4jConnectoraddNodesFinish"
		};
		this.database = "";
		this.taskCypherList = [];
		this.runningFlag = false;
	}

		connect(url, name, password) { 
			this.url = url;
			this.name = name;
			this.password = password;
			this.driver = neo4j.driver(url, neo4j.auth.basic(name, password));
		}
		
	setDatabase(db){
		this.database = db;
	}
	
	async initSession(){
		this.session = await this.driver.session({database:this.database});
	}
	
	//it return the ids of nodes as a array
	addNodes(nodes){
		
		return new Promise((resolve,reject)=>{
				let _this = this;
				let nodeids = [];
				(async function(resolve,reject){
				for(let i = 0 ; i<nodes.length;i++){
					let cypherString = 'CREATE(';
					let node = nodes[i];
				
					
					cypherString += "node";
					for(let j = 0 ; j < node.labels.length;j++){
						let label = node.labels[j];
						cypherString += ':';
						cypherString+=label;
					}
					cypherString+='{';
					Object.keys(node.properties).forEach((prop,idx)=>{
						cypherString+=prop;
						cypherString+=':"';
						cypherString+=node.properties[prop];
						cypherString+='"';
						Object.keys(node.properties).length-1 == idx ? null:cypherString+=','
					});
					cypherString+='}';
					
					cypherString+=") return id(";
					cypherString+="node";
					cypherString+=") as id";
					await _this.initSession();
					await _this.runCypherTask(cypherString)
					.then((res)=>{
						nodeids.push(res[0].get('id').toNumber());
					});

				}
			await _this.session.close();
			resolve(nodeids);
			})(resolve,reject);
		});
	}
	
	setNode(node){
		if(node.labels.length==0&&Object.keys(node.properties).length==0) return;
		return new Promise((resolve,reject)=>{
			let _this = this;
			(async function(resolve,reject){
				
				let cypherString = 'MATCH(';
				
					
					cypherString += "node";
					
					cypherString+=") WHERE id("
					cypherString+="node";
					cypherString+=")=";
					cypherString+=node.id;
					cypherString+=" SET  ";
					Object.keys(node.properties).forEach((prop,idx)=>{
						cypherString += "node";
						cypherString += ".";
						cypherString+=prop;
						cypherString+='="';
						cypherString+=node.properties[prop];
						cypherString+='"';
						Object.keys(node.properties).length-1 == idx ? null:cypherString+=','
					});
					
					(Object.keys(node.properties).length!=0 && node.labels.length != 0)  ? cypherString+=',' : null
					
					for(let j = 0 ; j < node.labels.length;j++){
						cypherString += "node";
						let label = node.labels[j];
						cypherString += ':';
						cypherString+=label;
						node.labels.length-1 == j ? null:cypherString+=','
					}
					
					await _this.initSession();
					await _this.runCypherTask(cypherString).then(()=>{
						
					});
				
				await _this.session.close();
				resolve();
			})(resolve,reject);
		});
	}
	
	setLink(node){
		
		
		return new Promise((resolve,reject)=>{
			let _this = this;
			(async function(resolve,reject){
				let newLinkId = -1;
				
				let cypherString = 'MATCH(n)-[';
				
					
					cypherString += "node";
					
					cypherString+="]->(m) WHERE id("
					cypherString+="node";
					cypherString+=")=";
					cypherString+=node.id;
					cypherString+=" CREATE (n)-[r2:"
					cypherString+=node.type;
					cypherString+="]->(m)";
					cypherString+=" SET r2=";
					cypherString+="node";
					
					cypherString+=Object.keys(node.properties).length!=0?" ,":"";
					Object.keys(node.properties).forEach((prop,idx)=>{
						cypherString += "r2";
						cypherString += ".";
						cypherString+=prop;
						cypherString+='="';
						cypherString+=node.properties[prop];
						cypherString+='"';
						Object.keys(node.properties).length-1 == idx ? null:cypherString+=','
					});
					
					cypherString+=" WITH ";
					cypherString+="node";
					cypherString+=" ,id(r2) as id DELETE ";
					cypherString+="node";
					cypherString+=" return id ";
					
					
					await _this.initSession();
					await _this.runCypherTask(cypherString).then((res)=>{
						newLinkId = res[0].get("id").toNumber();
					});
				
				await _this.session.close();
				resolve(newLinkId);
			})(resolve,reject);
		});
	}
	
	delNodes(nodes){
		
		return new Promise((resolve,reject)=>{
			let _this = this;
			(async function(resolve,reject){
				let cypherString = 'MATCH(';
				nodes.forEach((node)=>{
					
					cypherString += "node";
					node.labels.forEach((label)=>{
						cypherString += ':';
						cypherString+=label;
					});
					cypherString+='{';
					Object.keys(node.properties).forEach((prop,idx)=>{
						cypherString+=prop;
						cypherString+=':';
						cypherString+=node.properties[prop];
						Object.keys(node.properties).length-1 == idx ? null:cypherString+=','
					});
					cypherString+='}';
					cypherString+=") DETACH DELETE ";
					cypherString += "node";
					});
					await _this.initSession();
					await _this.runCypherTask(cypherString).then(()=>{
						
					});
				
				await _this.session.close();
				resolve();
			})(resolve,reject);
		});
	}
	
	delNode(node){
		
		return new Promise((resolve,reject)=>{
			let _this = this;
			(async function(resolve,reject){
				let cypherString = 'MATCH(';
				
					
					cypherString += "n";
					cypherString+=") ";
					cypherString+="WHERE id(";
					cypherString += "n";
					cypherString += ")=";
					cypherString += node.id;
					
					cypherString+=" DETACH DELETE ";
					cypherString += "(n)";
					await _this.initSession();
					await _this.runCypherTask(cypherString).then(()=>{
						
					});
				
				await _this.session.close();
				resolve();
			})(resolve,reject);
		});
	}
	
	delLink(node){
		
		return new Promise((resolve,reject)=>{
			let _this = this;
			(async function(resolve,reject){
				let cypherString = 'MATCH(';
				
					
					cypherString+=")-[n]-() ";
					cypherString+="WHERE id(";
					cypherString += "n";
					cypherString += ")=";
					cypherString += node.id;
					
					cypherString+=" DELETE ";
					cypherString += "(n)";
					await _this.initSession();
					await _this.runCypherTask(cypherString).then(()=>{
						
					});
				
				await _this.session.close();
				resolve();
			})(resolve,reject);
		});
	}
	
	
	addRelationships(node1,relation,node2){
		
		
		return new Promise((resolve,reject)=>{
		let _this = this;
		let relids = [];
		(async function(resolve,reject){
		
		let cypherString = 'MATCH(';
		
			
		cypherString += "node1";
		cypherString+=")"
		cypherString+="WHERE id(";
		cypherString += "node1";
		cypherString+=") = "
		cypherString += node1.id
		cypherString+=" MATCH(";
		
		cypherString += "node2";
		cypherString+=") ";
		cypherString+="WHERE id(";
		cypherString += "node2";
		cypherString+=") = "
		cypherString += node2.id
		
		cypherString+= ' CREATE(';
		
			
			cypherString += "node1";
			cypherString +=")-[";
				cypherString += relation.name;
				if(relation.labels!=undefined){
					relation.labels.forEach((label)=>{
						
						cypherString += ':';
						cypherString+=label;
						
					});
				}
				if(relation.properties!=undefined){
					cypherString+='{';
					Object.keys(relation.properties).forEach((prop,idx)=>{
						cypherString+=prop;
						cypherString+=':"';
						cypherString+=relation.properties[prop];
						cypherString+='"';
						Object.keys(relation.properties).length-1 == idx ? null:cypherString+=','
					});
					cypherString+='}';
				}
			
		cypherString+="]->(";
		cypherString+="node2";
		cypherString+=")";
			
		cypherString+="return id(";
		cypherString+="node1";
		cypherString+=") as node1_id,";
		
		cypherString+="id(";
		cypherString+=relation.name;
		cypherString+=") as id,";
		
		cypherString+="id(";
		cypherString+="node2";
		cypherString+=") as node2_id,";
		
		cypherString+=relation.name;
		cypherString+=" as link";
		
		
		await _this.initSession();
		await _this.runCypherTask(cypherString).then((res)=>{
						res.forEach((record)=>{
							relids.push({
									source:record.get("node1_id").toNumber(),
									id:record.get('id').toNumber(),
									target:record.get("node2_id").toNumber(),
									...record.get("link")
								});
						});
					});
		await _this.session.close();
		//_this.session.close();
			resolve(relids);
			})(resolve,reject);
		});
		
		}
		
	async concatNode(node1id, node2, relationship1) {
		
			if (relationship1 == null) {
				relationship1 = {};
				relationship1.label = "linkto";
			}
			let relationship1Label = relationship1.label == "" ? "" : ":" + relationship1.label;
			let node2Labels = node2.labels.length == 0 ? "" : ":" + node2.labels.join(":");
			let cypherString = `match (n1) where id(n1) = ${node1id} \
		create (n2${node2Labels}${JSON.stringify(node2.properties == undefined ? {} : node2.properties).replace(/"([^"]+)":/g, '$1:')}) \
		create (n1)-[r${relationship1Label}${JSON.stringify(relationship1.properties == undefined ? {} : relationship1.properties).replace(/"([^"]+)":/g, '$1:')}]->(n2) return id(n2),id(r)`;
			let res = await this.excuteCypher(cypherString);
			
		
		return { node2id: res[0].get("id(n2)").toNumber(), relationshipid: res[0].get("id(r)").toNumber() };
		
		
		}
		
		async shortestPath2Node(node1id,node2id) { 
			let cypherString = `match (n1),(n2) with (n1),(n2)  where id(n1)=${node1id} and id(n2)=${node2id} match p=shortestPath((n1)-[*]-(n2)) \
			RETURN [x in nodes(p) | id(x)] as nodeids ,[y in relationships(p)|id(y)] as relids`
			let res = await this.excuteCypher(cypherString);
			return { nodeids: res[0].get("nodeids"),  relids: res[0].get("relids") };
		}

	//TODO add Promise to adapt .then usage
	//one instance run one cypher query at a time
	runCypherTask(cypherString,param=null) { 
		return new Promise(async (resolve, reject) => {
			let result = undefined;

		
			this.taskCypherList.push(cypherString);
			while (this.taskCypherList[this.taskCypherList.length-1] != cypherString || this.runningFlag == true) {
				await this.sleep(100);
			
			}
			let taskCypher = this.taskCypherList.pop();
			this.runningFlag = true;
			await this.initSession();
			await this.session.run(taskCypher,param).then((res) => {
				result = res.records;
			});
			await this.session.close();
			this.runningFlag = false;
			resolve(result);
		});
	}

	async excuteCypher(cypherString,param=null){
		let result = null;
		await this.initSession();
		await this.runCypherTask(cypherString,param).then((res)=>{
						result = res;
					});
		await this.session.close();
		return result;
	}
	
	initNode(){
		let node = {
			
			labels:[
			//"label","label2"
			],
			properties:{}
			
		};
		
		return node;
	}
	
	initRelationship(){
		let relationship = {
			
			label:"linkto",
			properties: {
				name:"?"
			}
		};
		
		return relationship;
	}
		
	sleep(time) {
		return new Promise(resolve =>
			setTimeout(resolve,time)
		) }
	
}

this.Connector = Neo4jConnector;
})();
