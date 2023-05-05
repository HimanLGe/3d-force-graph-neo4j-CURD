(()=>{
	class neo4jWith3DGraph{
		//the graphManager AND neo4jConnector must be initialized first
		constructor(graphManager,neo4jConnector){
			this.graphManager = graphManager;
			this.Connector = neo4jConnector;
		}
		
		async getAll(){
			const start = new Date();
			await this.Connector.initSession();
			let _this = this;
			await this.Connector.session
		  .run('match (n)-[rel]->(m) match (node) return (node),rel as link,id(n) as source,id(m) as target , id(rel) as linkid')
		  .then(async function (result) {
			let linkIdSet = new Set();
			let nodeIdSet = new Set();
			const links = result.records.map(r => { 
			if(!linkIdSet.has(r.get('link').identity.toNumber())){
				linkIdSet.add(r.get('link').identity.toNumber());
				let link = {...{source:r.get('source').toNumber(), target:r.get('target').toNumber(),id:r.get('link').identity.toNumber()},...r.get('link')};
				link.properties.name?null:link.properties.name = 'undefined';
				return link;
			}
			}).filter((i)=>{return i!=undefined});        
			const nodes = result.records.map(r => { 
			if(!nodeIdSet.has(r.get('node').identity.toNumber())){
				nodeIdSet.add(r.get('node').identity.toNumber());
				return {id:r.get('node').identity.toNumber(), labels:r.get('node').labels,properties:r.get('node').properties}
			}
			}).filter((i)=>{return i!=undefined});        
			_this.Connector.session.close();
			console.log(links.length+' links loaded in '+(new Date()-start)+' ms.')
			//const ids = new Set()
			//links.forEach(l => {ids.add(l.source);ids.add(l.target);});
			nodes.forEach(n => {
				let o = _this.graphManager.getNodeObjectById(n.id);
				if (n.properties.x && n.properties.y && n.properties.z) {
					n.x = n.properties.x;
					n.y = n.properties.y;
					n.z = n.properties.z;
				}
				if (n.properties.fx&&n.properties.fy&&n.properties.fz) {
					n.fx = n.properties.fx;
					n.fy = n.properties.fy;
					n.fz = n.properties.fz;
				}
				
			});
			let gData = { nodes: nodes, links: links}
			  _this.graphManager.updateGData(gData);
			  await _this.sleep(100);
			  window.GraphApp.Graph.numDimensions(3);
			
			
		});
		}
		
		async addNodes(nodes) {
			let nodeids = [];
			await this.Connector.addNodes(nodes).then((ids) => {
				nodeids = ids;
				nodes = nodes.map((node,idx)=>{
					node.id = ids[idx];
					return node;
				});
				this.graphManager.addNodes(nodes);
				
			});
			return nodeids;
			
		}
		
		async addRelationships(node1,relationships,node2){
			let ls = await this.Connector.addRelationships(node1,relationships,node2).then((links)=>{
				this.graphManager.addLinks(links);
				return links;
			});
			return ls;
		}
		
		async setNode(node){
			await this.Connector.setNode(node);
		}
		
		async setLink(link){
			let id = await this.Connector.setLink(link);
			link.id = id;
		}
		
		async delNode(node){
			await this.Connector.delNode(node);
			this.graphManager.removeNode(node);
		}
		
		async delLink(node){// param is link actually , but they have same strucure so ...
			await this.Connector.delLink(node);
			this.graphManager.removeLink(node);
		}

		async concatNode(node1id, node2, rel) { 
			let r = await this.Connector.concatNode(node1id, node2, rel);
			node2.id = r.node2id;
			rel.id = r.relationshipid;
			this.graphManager.concatNode(node1id, node2, rel);
			return rel.id;
		}

		sleep(time) {
			return new Promise(resolve =>
				setTimeout(resolve,time)
		) }
	}
	
	this.neo4jWith3DGraph = neo4jWith3DGraph;
})();