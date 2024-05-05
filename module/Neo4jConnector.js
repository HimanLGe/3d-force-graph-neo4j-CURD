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
	runCypherTask(cypherString,param=null) { 

		const strParam = {};
		for (const key in param) {
			if (Object.hasOwnProperty.call(param, key)) {
				if (!(typeof param[key] == "string" || typeof param[key] == "number")) strParam[key] = String(param[key]);
				else strParam[key] = param[key];
			
			}
		}

		return new Promise(async (resolve, reject) => {
			try {
				let result = undefined;

		
				this.taskCypherList.push(cypherString);
				while (this.taskCypherList[this.taskCypherList.length - 1] != cypherString || this.runningFlag == true) {
					await this.sleep(100);
			
				}
				let taskCypher = this.taskCypherList.pop();
				this.runningFlag = true;
				await this.initSession();
				// await this.session.run(taskCypher, param).then((res) => {
				// 	result = res.records;
				// });
				console.log(taskCypher)
				result = (await this.session.writeTransaction(async tx => {
					var res =  await tx.run(taskCypher, strParam
						
					)
					return res
				})).records
				
				await this.session.close();
				this.runningFlag = false;
				resolve(result);
			}
			catch (error) {
				console.error('Error:', error);
			}
		});
	}
	
	setDatabase(db){
		this.database = db;
	}
	
	async initSession(){
		this.session = await this.driver.session({database:this.database});
	}
	
	//it return the ids of nodes as a array
	async addNodes(nodes) {
		return new Promise(async (resolve, reject) => {
			try {
				let nodeIds = [];
				for (let i = 0; i < nodes.length; i++) {
					let node = nodes[i];
					let cypherString = 'CREATE (node';
					
					// 添加节点标签
					if (node.labels.length > 0) {
						cypherString += `:${node.labels.join(':')}`;
					}
					
					cypherString += ' {';
	
					// 添加节点属性
					Object.keys(node.properties).forEach((prop, idx) => {
						cypherString += `${prop}: $${prop}`;
						idx < Object.keys(node.properties).length - 1 ? cypherString += ', ' : null;
					});
	
					cypherString += '}) RETURN id(node) AS id';
					
					// 初始化会话
					await this.initSession();
	
					// 运行Cypher查询
					const result = await this.runCypherTask(cypherString, node.properties);
	
					// 将节点ID添加到数组中
					nodeIds.push(result[0].get('id').toNumber());
				}
	
				// 关闭会话
				await this.session.close();
	
				// 解决Promise并返回节点ID数组
				resolve(nodeIds);
			} catch (error) {
				// 捕获并拒绝任何错误
				reject(error);
			}
		});
	}
	
	setNode(node){
		if (node.labels.length == 0 && Object.keys(node.properties).length == 0) return;
		let nodeId = node.id
		let properties = node.properties
		let labels = node.labels
		return new Promise((resolve,reject)=>{
			let _this = this;
			(async function(resolve,reject){
				
				try {
					// 构建Cypher查询字符串
					let cypherString = `MATCH (node) WHERE id(node) = ${nodeId} SET `;
					
					// 设置节点属性
					Object.keys(properties).forEach((prop, idx) => {
						cypherString += `node.${prop} = $${prop}`;
						idx < Object.keys(properties).length - 1 ? cypherString += ', ' : null;
					});
					
					// 如果有属性，并且有标签，则添加逗号
					if (Object.keys(properties).length !== 0 && labels.length !== 0) {
						cypherString += ', ';
					}
					
					// 设置节点标签
					labels.forEach((label, idx) => {
						cypherString += `node:${label}`;
						idx < labels.length - 1 ? cypherString += ', ' : null;
					});
					
					// 初始化会话
					await _this.initSession();
					
					// 将节点属性和标签合并为一个对象
					const parameters = Object.assign({}, properties, labels);
					
					// 运行Cypher查询
					await _this.runCypherTask(cypherString, parameters);
				} catch (error) {
					console.error('Error:', error);
				} finally {
					// 关闭会话
					await _this.session.close();
				}
				resolve();
			})(resolve,reject);
		});
	}
	
	async setLink(node) {
		return new Promise(async (resolve, reject) => {
			try {
				let newLinkId = -1;
				let setProperties = "";
				let parameters = { relId: Number(node.id) };
	
				// Construct SET clause to set each property of the relationship
				const propertiesKeys = Object.keys(node.properties);
				for (let i = 0; i < propertiesKeys.length; i++) {
					const key = propertiesKeys[i];
					setProperties += `r2.${key} = $value${i}`;
					parameters[`value${i}`] = node.properties[key];
					if (i < propertiesKeys.length - 1) {
						setProperties += ", ";
					}
				}
				
				// Construct Cypher query string with SET clause
				let cypherString = `
					MATCH (n)-[rel]->(m) 
					WHERE id(rel) = $relId
					CREATE (n)-[r2:linkto]->(m)
					SET ${setProperties}
					WITH rel, id(r2) AS id
					DELETE rel
					RETURN id
				`;
	
				// Initialize session
				await this.initSession();
	
				// Run Cypher query
				const result = await this.runCypherTask(cypherString, parameters);
	
				// Get the new link's ID
				newLinkId = result[0].get("id").toNumber();
	
				// Close session
				await this.session.close();
	
				// Resolve the promise and return the new link's ID
				resolve(newLinkId);
			} catch (error) {
				// Catch and reject any errors
				reject(error);
			}
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
	
	
	addRelationships(node1id,relation,node2id){
		
		
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
				cypherString += "r";
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
		cypherString+="r";
		cypherString+=") as id,";
		
		cypherString+="id(";
		cypherString+="node2";
		cypherString+=") as node2_id,";
		
		cypherString+="r";
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
			
			labels:[
			//"label","label2"
			],
			properties:{}
			
		};
		
		return node;
	}
	
	initRelationship(){
		let relationship = {
			
			labels:["linkto"],
			properties: {
				name:"?"
			}
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