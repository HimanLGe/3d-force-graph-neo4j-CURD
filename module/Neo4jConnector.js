const neo4j = require('neo4j-driver');

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

	//TODO add Promise to adapt .then usage
	//one instance run one cypher query at a time
	runCypherTask(cypherString) { 
		return new Promise(async (resolve, reject) => {
			let result = undefined;

		
			this.taskCypherList.push(cypherString);
			while (this.taskCypherList[this.taskCypherList.length-1] != cypherString || this.runningFlag == true) {
				await this.sleep(100);
			
			}
			let taskCypher = this.taskCypherList.pop();
			this.runningFlag = true;
			await this.initSession();
			await this.session.run(taskCypher).then((res) => {
				result = res.records;
			});
			await this.session.close();
			this.runningFlag = false;
			resolve(result);
		});
	}
	
	setDatabase(db){
		this.database = db;
	}
	
	async initSession(){
		this.session = await this.driver.session({database:this.database});
	}
	
	//it return the ids of nodes as a array
	addNodes(nodes){
		
		return new Promise(async (resolve,reject)=>{
				let _this = this;
				let nodeids = [];
				
				for(let i = 0 ; i<nodes.length;i++){
					let cypherString = 'CREATE(';
					let node = nodes[i];
				
					
					cypherString += "n1";
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
					cypherString+="n1";
					cypherString+=") as id";
					await _this.initSession();
					await _this.runCypherTask(cypherString)
					.then((res)=>{
						nodeids.push(res[0].get('id').toNumber());
					});

				}
			await _this.session.close();
			resolve(nodeids);
			
		});
	}
	
	setNode(node){
		if(node.labels.length==0&&Object.keys(node.properties).length==0) return;
		return new Promise((resolve,reject)=>{
			let _this = this;
			(async function(resolve,reject){
				node.name?null:node.name="node";
				let cypherString = 'MATCH(';
				
					
					cypherString += node.name;
					
					cypherString+=") WHERE id("
					cypherString+=node.name;
					cypherString+=")=";
					cypherString+=node.id;
					cypherString+=" SET  ";
					Object.keys(node.properties).forEach((prop,idx)=>{
						cypherString += node.name;
						cypherString += ".";
						cypherString+=prop;
						cypherString+='="';
						cypherString+=node.properties[prop];
						cypherString+='"';
						Object.keys(node.properties).length-1 == idx ? null:cypherString+=','
					});
					
					(Object.keys(node.properties).length!=0 && node.labels.length != 0)  ? cypherString+=',' : null
					
					for(let j = 0 ; j < node.labels.length;j++){
						cypherString += node.name;
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
				node.name?null:node.name="node";
				let cypherString = 'MATCH(n)-[';
				
					
					cypherString += node.name;
					
					cypherString+="]->(m) WHERE id("
					cypherString+=node.name;
					cypherString+=")=";
					cypherString+=node.id;
					cypherString+=" CREATE (n)-[r2:"
					cypherString+=node.type;
					cypherString+="]->(m)";
					cypherString+=" SET r2=";
					cypherString+=node.name;
					
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
					cypherString+=node.name;
					cypherString+=" ,id(r2) as id DELETE ";
					cypherString+=node.name;
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
					
					cypherString += node.name;
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
					cypherString += node.name;
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
	
	
	addRelationship(node1id,relation,node2id){
		
		
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
		cypherString += node1id
		cypherString+=" MATCH(";
		
		cypherString += "node2";
		cypherString+=") ";
		cypherString+="WHERE id(";
		cypherString += "node2";
		cypherString+=") = "
		cypherString += node2id
		
		cypherString+= ' CREATE(';
		
			
			cypherString += "node1";
			cypherString +=")-[";
				cypherString += "rel";
				if(relation.label!=undefined){
					
						
						cypherString += ':';
						cypherString+=relation.label;
						
					
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
		cypherString+="rel";
		cypherString+=") as id,";
		
		cypherString+="id(";
		cypherString+="node2";
		cypherString+=") as node2_id,";
		
		cypherString+="rel";
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
	
	initNode(){
		let node = {
			name:'',
			labels:[
			//"label","label2"
			],
			properties:{}
			
		};
		
		return node;
	}
	
	initRelationship(){
		let relationship = {
			name:'',
			label:"linkto",
			properties:{}
		};
		
		return relationship;
	}

	async excuteCypher(cypherString){
		let result = null;
		await this.initSession();
		await this.runCypherTask(cypherString).then((res)=>{
						result = res;
					});
		await this.session.close();
		return result;
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
		create (n1)-[r${relationship1Label}${JSON.stringify(relationship1.properties == undefined ? {} : relationship1.properties).replace(/"([^"]+)":/g, '$1:')}]->(n2) return id(n2)`;
			let res = await this.excuteCypher(cypherString);
			
		
			return res[0].get("id(n2)").toNumber();
		
		
	}

	async findNearestNodeIdByIdAndProps(node1Id, node2Props) { 
		let keys = Object.keys(node2Props);
		let conditions = "";
		for (let i = 0; i < keys.length; i++) { 
			conditions+=`AND end.${keys[i]} contains "${node2Props[keys[i]]}" ` //similarity
		}
		//unhandle not found situation
		let cypherString = `MATCH (start), (end),\
		p=shortestPath((start)-[*]-(end))\
		WHERE id(start)=${node1Id} ${conditions}
		RETURN p`

		let res = await this.excuteCypher(cypherString);
		if (res.length == 0) { 
			return null;
		}
		return res[0].get("id(n2)").toNumber();

	}

	sleep(time) {
		return new Promise(resolve =>
		  setTimeout(resolve,time)
	 ) }
	
}

module.exports = function(url,name,password){
	return new Neo4jConnector(url,name,password);
}