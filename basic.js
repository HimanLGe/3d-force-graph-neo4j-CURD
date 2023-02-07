(function (){

//a class operate the graph
class Basic{
	constructor(graph){
		this.graph = graph;
		
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
	
	initLink(sourceid,targetid){
		let link = {
			source:sourceid,
			target:targetid
			
		};
		
		return link;
	}
	
	//In 3d-force-graph,node must contain attr id
	addNodes(nodes){
		let nodesAdded = [];
		for(let i = 0 ; i < nodes.length;i++){
			let node = nodes[i];
			let name = node.name;
			let id = node.id;
			nodesAdded.push(node);
		}
		let gdata = {
			nodes:[...this.gdata.nodes,...nodesAdded],
			links:[...this.gdata.links]
		};
		this.updateGData(gdata);
	}
	
	addLinks(links){
		let linksAdded = [];
		for(let i = 0 ; i < links.length;i++){
			let link = links[i];
			let source = link.source;
			let target = link.target;
			let id = link.id;
			
			linksAdded.push({...link});
		}
		let gdata = {
			nodes:[...this.gdata.nodes],
			links:[...this.gdata.links,...linksAdded]
		};
		this.updateGData(gdata);
	}
	
	 removeNode(node) {
      let { nodes, links } = this.graph.graphData();
      links = links.filter(l => l.source.id != node.id && l.target.id != node.id); // Remove links attached to node
      //nodes.splice(node.id, 1); // Remove node
	  nodes = nodes.filter((n)=>{return n.id!=node.id})
      //nodes.forEach((n, idx) => { n.id = idx; }); // Reset node ids to array index
      this.updateGData({ nodes, links });
    }
	
	removeLink(node) {
      let { nodes, links } = this.graph.graphData();
      links = links.filter(l => {return l.id!=node.id}); // Remove links attached to node
      //nodes.splice(node.id, 1); // Remove node
	  //nodes = nodes.filter((n)=>{return n.id!=node.id})
      //nodes.forEach((n, idx) => { n.id = idx; }); // Reset node ids to array index
      this.updateGData({ nodes, links });
	}
	
	concatNode(node1id,node2,rel){
		let nodesAdded = [];
		
		nodesAdded.push(node2);

		let linksAdded = [];
		let link = this.initLink(node1id, node2.id);
		link = { ...link, ...rel };
			
		linksAdded.push({...link});
		
		
		
		let gdata = {
			nodes:[...this.gdata.nodes,...nodesAdded],
			links:[...this.gdata.links,...linksAdded]
		};
		this.updateGData(gdata);
	}

	getNodeById(id) { 
		
		let nodes = this.gdata.nodes.filter((o) => {
			if (o.id == id) return true;

		});
		if (nodes.length == 0) {
			return undefined;
		}
		else { 
			return nodes[0];
		}
	}

	getLinkById(id) { 
		
		let links = this.gdata.links.filter((o) => {
			if (o.id == id) return true;

		});
		if (links.length == 0) {
			return undefined;
		}
		else { 
			return links[0];
		}
	}
	
	
	//don't call this.graph.graphData for setting data directly , it cause bug! i promise!
	updateGData(gdata){
		this.gdata = gdata;
		this.graph.linkCurvature('curvature').linkCurveRotation('rotation').graphData(this.gdata);
	}
	
	curveDuplicateLinks(links){
		
	}
}

this.Basic = Basic;

})();