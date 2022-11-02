(()=>{
	class EventManager{
		
		constructor(DomElem,Graph3d,guiController,neo4jWith3DGraph){
			this.DomElem = DomElem;
			this.Graph3d = Graph3d;
			this.guiController = guiController;
			this.NWG = neo4jWith3DGraph;
			this.clickCount = 0;
			this.selectedNodes = new Set();
			//background click->true;interval times up -> false
			this.inDoubuleClickIntervalFlag = false;
			
			
			this.registerEvent();
			
			//event list
			this.eventList = [
				"BackgroundDoubleClick",
				"AltKeyUpAndTwoNodesClicked"
			]
			
			this.events = {};
			// auto register onEvent and dispatchEvent
			this.eventList.forEach((eventName)=>{
				let event = {
					todo:[]//
				};
				this.events[eventName] = event;
				
				this["dispatch"+eventName] = (e)=>{
					this.events[eventName].todo.forEach((customFunc)=>{
						customFunc(e);
					});
				}
				
				this["on"+eventName] = (customFunc)=>{
					this.events[eventName].todo.push(customFunc);
				}
			});
			
			
		}
		
		registerEvent(){
			
			//register BackgroundDoubleClick
			this.Graph3d.onBackgroundClick((e)=>{
				this.judgeBackgroundDoubleClick(e);
			});
			
			//register AltKeyUpAndTwoNodesClicked
			this.Graph3d.onNodeClick((node,event)=>{
				this.guiController.editNodePanel(node);
				this.judgeAltKeyUpAndTwoNodesClicked(node,event);
			})
			.nodeColor(node => this.selectedNodes.has(node) ? 'yellow' : 'grey');
		}
		
		judgeBackgroundDoubleClick(e){
			this.clickCount+=1;
			if(this.inDoubuleClickIntervalFlag == false){
				this.inDoubuleClickIntervalFlag =true;
				setTimeout(()=>{
					if(this.clickCount > 1){
						this.dispatchBackgroundDoubleClick(e);
					}
					this.clickCount = 0;
					this.inDoubuleClickIntervalFlag = false;
				},150);
			}
			
		}
		
		judgeAltKeyUpAndTwoNodesClicked(node,e){
			
			if(!e.altKey){
				this.selectedNodes.clear();
				this.selectedNodes.add(node);
				this.Graph3d.nodeColor(Graph.nodeColor());
				return;
			}else{
				this.selectedNodes.has(node) ? this.selectedNodes.delete(node) : this.selectedNodes.add(node);

			}
			this.Graph3d.nodeColor(Graph.nodeColor());
			
			if(this.selectedNodes.size==2){
				let nodes = [];
				this.selectedNodes.forEach((val)=>{
					val.apply();
					nodes.push(val);
				});
				this.NWG.addRelationships(nodes[0],{name:"rel",labels:["linkto"]},nodes[1]);
				this.selectedNodes.clear();
			}
			
		}
	}
	
	this.EventManager = EventManager;
})();