(()=>{
	class neo4jWith3DGraph{
		//the graphManager AND neo4jConnector must be initialized first
		constructor(graphManager,neo4jConnector){
			this.graphManager = graphManager;
			this.Connector = neo4jConnector;
		}
		
		addNodes(nodes){
			this.Connector.addNodes(nodes).then((ids)=>{
				nodes = nodes.map((node,idx)=>{
					node.id = ids[idx];
					return node;
				});
				this.graphManager.addNodes(nodes);
				
			});
			
		}
		
		addRelationships(node1,relationships,node2){
			this.Connector.addRelationships(node1,relationships,node2).then((links)=>{
				this.graphManager.addLinks(links);
			});
		}
		
		setNode(node){
			this.Connector.setNode(node);
		}
		
		delNode(node){
			this.Connector.delNode(node);
			this.graphManager.removeNode(node);
		}
	}
	
	this.neo4jWith3DGraph = neo4jWith3DGraph;
})();