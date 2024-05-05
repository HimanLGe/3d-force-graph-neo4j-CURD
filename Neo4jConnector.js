
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
				let cypherString = 'MATCH ()-[r]->() ';
				
					
					
					cypherString+="WHERE id(";
					cypherString += "r";
					cypherString += ")=";
					cypherString += node.id;
					
					cypherString+=" DELETE ";
					cypherString += "r";
					await _this.initSession();
					await _this.runCypherTask(cypherString).then((res)=>{
						console.log(res);
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
			
			labels:["linkto"],
			properties: {
				name:"?"
			}
		};
		
		return relationship;
	}
		
	sleep(time) {
		return new Promise(resolve =>
			setTimeout(resolve,time)
			)
		}
		
		test() {
			

			(async () => {
			
			let driver, session
			driver = this.driver
			let employeeThreshold = 10

			

			session = driver.session({ database: this.database })
			for(let i=0; i<100; i++) {
				const name = `Neo-${i.toString()}`
				const orgId = await session.executeWrite(async tx => {
				let result, orgInfo

				// Create new Person node with given name, if not already existing
				await tx.run(`
					MERGE (p:Person {name: $name})
					RETURN p.name AS name
					`, { name: name }
				)

				// Obtain most recent organization ID and number of people linked to it
				result = await tx.run(`
					MATCH (o:Organization)
					RETURN o.id AS id, COUNT{(p:Person)-[r:WORKS_FOR]->(o)} AS employeesN
					ORDER BY o.createdDate DESC
					LIMIT 1
				`)
				if(result.records.length > 0) {
					orgInfo = result.records[0]
				}

				if(orgInfo != undefined && orgInfo['employeesN'] == 0) {
					throw new Error('Most recent organization is empty.')
					// Transaction will roll back -> not even Person is created!
				}

				// If org does not have too many employees, add this Person to that
				if(orgInfo != undefined && orgInfo['employeesN'] < employeeThreshold) {
					result = await tx.run(`
					MATCH (o:Organization {id: $orgId})
					MATCH (p:Person {name: $name})
					MERGE (p)-[r:WORKS_FOR]->(o)
					RETURN $orgId AS id
					`, { orgId: orgInfo['id'], name: name }
					)

				// Otherwise, create a new Organization and link Person to it
				} else {
					result = await tx.run(`
					MATCH (p:Person {name: $name})
					CREATE (o:Organization {id: randomuuid(), createdDate: datetime()})
					MERGE (p)-[r:WORKS_FOR]->(o)
					RETURN o.id AS id
					`, { name: name }
					)
				}

				// Return the Organization ID to which the new Person ends up in
				return result.records[0].get('id')
				})
				console.log(`User ${name} added to organization ${orgId}`)
			}
			await session.close()
			await driver.close()
			})()
		}
	
}

this.Connector = Neo4jConnector;
})();
