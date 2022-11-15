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
			source:source,
			target:target
			//name:'',
			//lables:[
			//{
				//name:'',
				//properties:{
				//name:value
			//}
			//}
			//]
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
			let index = link.index;
			
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
      this.graph.graphData({ nodes, links });
    }
	
	removeLink(node) {
      let { nodes, links } = this.graph.graphData();
      links = links.filter(l => {return l.id!=node.id}); // Remove links attached to node
      //nodes.splice(node.id, 1); // Remove node
	  //nodes = nodes.filter((n)=>{return n.id!=node.id})
      //nodes.forEach((n, idx) => { n.id = idx; }); // Reset node ids to array index
      this.graph.graphData({ nodes, links });
    }
	
	updateGData(gdata){
		this.gdata = gdata
		this.graph.graphData(this.gdata);
	}
}

this.Basic = Basic;

})();