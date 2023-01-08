(()=>{
	class EventManager{
		
		constructor(DomElem,Graph3d,guiController,neo4jWith3DGraph,basic,threeUtils,THREE){
			this.DomElem = DomElem;
			this.Graph3d = Graph3d;
			this.guiController = guiController;
			this.NWG = neo4jWith3DGraph;
			this.basic = basic;
			this.threeUtils = threeUtils;
			this.THREE = THREE;
			this.clickCount = 0;
			this.currentNode = null;
			this.selectedNodes = new Set();
			//background click->true;interval times up -> false
			this.inDoubuleClickIntervalFlag = false;
			
			
			this.initEventEnvironmentVaribles();
			
			this.registerEvent();
			
			//event list
			this.eventList = [
				"BackgroundDoubleClick",
				"AltKeyUpAndTwoNodesClicked",
				"HighLightNode",
				"HighLightLink",
				"Hover",//Node or Link
				"ClickNode",
				"DelKeyUp",
				"TabKeyUp"
			]
			
			this.events = {};
			// auto register onEvent and dispatchEvent
			this.eventList.forEach((eventName)=>{
				let event = {
					todo:[]//
				};
				this.events[eventName] = event;
				
				this["dispatch"+eventName] = (e1,e2)=>{
					this.events[eventName].todo.forEach((customFunc)=>{
						customFunc(e1,e2);
					});
				}
				
				this["on"+eventName] = (customFunc)=>{
					this.events[eventName].todo.push(customFunc);
				}
			});
			//register event handler
			this.registerHandeler();
			
		}
		
		initEventEnvironmentVaribles(){
			
			// highLight event //
				// cross-link node objects
				let gData = this.Graph3d.graphData();
				gData.links.forEach(link => {
				  const a = gData.nodes.filter(node => {return node.id == link.source;})[0];
				  const b = gData.nodes.filter(node => {return node.id == link.target;})[0];
				  !a["neighbors"] && (a["neighbors"] = []);
				  !b["neighbors"] && (b["neighbors"] = []);
				  a.neighbors.push(b);
				  b.neighbors.push(a);

				  !a.links && (a.links = []);
				  !b.links && (b.links = []);
				  a.links.push(link);
				  b.links.push(link);
				});
				this.highlightNodes = new Set();
				this.highlightLinks = new Set();
				this.hoverNode = null;
				
				this.Graph3d
					.nodeColor(node => this.highlightNodes.has(node) ? node === hoverNode ? 'rgb(255,0,0,1)' : 'rgba(255,160,0,0.8)' : 'rgba(0,255,255,0.6)')
					.linkWidth(link => this.highlightLinks.has(link) ? 4 : 1)
					.linkDirectionalParticles(link => this.highlightLinks.has(link) ? 2 : 0)
					.linkDirectionalParticleWidth(1);
				
				this.updateHighlight = function () {
				  // trigger update of highlighted objects in scene
				  this.Graph3d
					.nodeColor(this.Graph3d.nodeColor())
					.linkWidth(this.Graph3d.linkWidth())
					.linkDirectionalParticles(this.Graph3d.linkDirectionalParticles());
				}
			//-----------------//
			
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
				this.dispatchClickNode(node,event);
			})
			.nodeColor(node => this.selectedNodes.has(node) ? 'yellow' : 'grey');
			

			
			this.Graph3d.onNodeHover((node)=>{
				this.dispatchHighLightNode(node);
				this.dispatchHover(node);
			});
			
			this.Graph3d.onLinkClick((link,event)=>{
				this.guiController.editLinkPanel(link);
				this.dispatchClickNode(link,event);
			});
			
			this.Graph3d.onLinkHover((link)=>{
				this.dispatchHighLightLink(link);
				this.dispatchHover();
				
			});
			
			document.onkeyup = (e)=>{
				console.log(e);
				if(e.key =="Delete") this.dispatchDelKeyUp(this.currentNode,e);
				
				if(e.key =="Tab") {
					
					this.dispatchTabKeyUp(this.currentNode,e);
					}
			}
			
		}
		
		registerHandeler(){
			this.backgroundDoubleClickHandeler();
			this.highLightHandler();
			this.hoverHandler();
			this.clickNodeHandler();
			this.delKeyUpHandler();
			this.tabKeyUpHandler();
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
					//val.apply();
					nodes.push(val);
				});
				this.NWG.addRelationships(nodes[0],{name:"rel",labels:["linkto"],properties:{name:"undefined"}},nodes[1]);//no properties.name will cause bug
				this.selectedNodes.clear();
			}
			
		}
		
		backgroundDoubleClickHandeler(){
			// handle backgrounddoubleclick //
			
				// add cube //
			var geometry = new this.THREE.BoxBufferGeometry(2, 2, 2);//创建一个立方体
			var material = new this.THREE.MeshBasicMaterial({color: 0xff0000});//填充的材质
			this.cube = new this.THREE.Mesh(geometry, material);//网格绘制
			this.Graph3d.scene().add(this.cube);
				//----------//
			this.onBackgroundDoubleClick((e)=>{
				console.log("background double clicked");
				console.log(e);
				let pos = {x:e.clientX,y:e.clientY};
				let target = this.threeUtils.get3DPosByCanvasPos(pos,0.5,this.Graph3d.camera());
				['x','y','z'].forEach((axis)=>{
					this.cube.position[axis] = target[axis];
				});
				//cube.position = target;
				console.log(target);
				let node = this.basic.initNode();
				node.name = "new"; //this will let 3dgraph make a tooltip text a
				node.properties.name = "undefined";
				['x','y','z'].forEach((axis)=>{
					node[axis] = target[axis];
				});
				let nodes = [];
				this.NWG.addNodes([node]);
				console.log(nodes);
				//Do double click stuff
			});
			//------------------------------//
		}
		
		highLightHandler(){
			let _this = this;
			this.onHighLightNode((node=>{
				
				if ((!node && !_this.highlightNodes.size) || (node && _this.hoverNode === node)) return;

				_this.highlightNodes.clear();
				_this.highlightLinks.clear();
				if (node) {
				_this.highlightNodes.add(node);
				node.neighbors && node.neighbors.forEach(neighbor => _this.highlightNodes.add(neighbor));
				node.neighbors && node.links.forEach(link => _this.highlightLinks.add(link));
				}

				_this.hoverNode = node || null;

				_this.updateHighlight();
			}));
			
			_this.onHighLightLink((link=>{
				_this.highlightNodes.clear();
				_this.highlightLinks.clear();
				
				if (link) {
				_this.highlightLinks.add(link);
				_this.highlightNodes.add(link.source);
				_this.highlightNodes.add(link.target);
				}

				_this.updateHighlight();
			}));
		}
		
		hoverHandler(){
			let _this = this;
			this.onHover(()=>{
				_this.Graph3d.nodeThreeObject(node=>{
					if(_this.highlightNodes.has(node)){
						
						let sprite = new _this.THREE.SpriteText(node.properties.name?node.properties.name:node.id);
						sprite.material.depthWrite = false; // make sprite background transparent
						sprite.color = node === _this.hoverNode ? 'orange' : 'green';
						sprite.textHeight = 5;
						return sprite;
					}else{
						return false;
					}
				})
				.linkThreeObject(link => {
					if(_this.highlightLinks.has(link)){
				  // extend link with text sprite
				  const sprite = new _this.THREE.SpriteText(`${link.properties.name}`);
				  sprite.color = 'lightgrey';
				  sprite.textHeight = 4;
				  return sprite;
					}else{
						return false;
					}
				})
				.linkPositionUpdate((sprite, { start, end }) => {
				  const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
					[c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
				  })));

				  // Position sprite
				  Object.assign(sprite.position, middlePos);
				});
			});
			
			
		}
		
		clickNodeHandler(){
			let _this = this;
			this.onClickNode((node,event)=>{
					_this.currentNode = node;
				// Aim at node from outside it //
				/* if(!node.source){//judge is node or link
						if(!event.altKey){
						let distance = 150;
						let distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

						let newPos = node.x || node.y || node.z
						? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
						: { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

						_this.Graph3d.cameraPosition(
						newPos, // new position
						node, // lookAt ({ x, y, z })
						800  // ms transition duration
						);
					}
				} */
				//------------------------------//
			});
		}
		
		delKeyUpHandler(){
			let _this = this;
			this.onDelKeyUp((node,event)=>{
				node.hasOwnProperty("source")?_this.NWG.delLink(node):_this.NWG.delNode(node);
				console.log("delete");
			});
		}
		
		tabKeyUpHandler(){
			let _this = this;
			this.onTabKeyUp(async (n2,event)=>{
				let pos = {x:n2.x,y:n2.y,z:n2.z};	
				let node = this.basic.initNode();
				node.name = "new"; //this will let 3dgraph make a tooltip text a
				node.properties.name = "undefined";
				['x','y','z'].forEach((axis)=>{
					node[axis] = pos[axis];
				});
				
				await this.NWG.addNodes([node]);
				await this.NWG.addRelationships(node,{name:"rel",labels:["linkto"],properties:{name:"undefined"}},n2);
				this.currentNode = node;
				this.guiController.editLinkPanel(node);
			});
		}
	
		
		
		
	}
	
	this.EventManager = EventManager;
})();