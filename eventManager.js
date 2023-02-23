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
			this.currentNode = null;//also link click
			this.selectedNodes = new Set();
			this.selectedLinks = new Set();
			//background click->true;interval times up -> false
			this.inDoubuleClickIntervalFlag = false;
			this.keyListener = {};//if KeyA press, keyListener.keyA = true
			this.focusMode = true;

			this.selectionBox = new THREE.SelectionBox( this.Graph3d.camera(), this.Graph3d.scene() );
			this.helper = new THREE.SelectionHelper(this.Graph3d.renderer(), 'selectBox');
			//this.helper.dispose();

			this.nodeColorRule = [];
			this.linkColorRule = [];
			
			this.Graph3d.nodeColor(this.executeNodeColorRules);
			this.Graph3d.linkColor(this.executeLinkColorRules);
			

			//when graph event dispatched,run following Slot
			this.BackgroundClickdispatchSlot = [];
			this.nodeClickdispatchSlot = [];
			this.nodeDragdispatchSlot = [];
			this.nodeDragEnddispatchSlot = [];
			this.nodeHoverdispatchSlot = [];
			this.linkHoverdispatchSlot = [];
			this.linkClickdispatchSlot = [];
			
			
			this.initEventEnvironmentVaribles();
			
			this.registerEvents();
			
			//event list
			this.eventList = [
				"BackgroundDoubleClick",
				"AltKeyUpAndTwoNodesClicked",
				"HighLightNode",
				"HighLightLink",
				"Hover",//Node or Link
				"ClickNode",
				"DelKeyUp",
				"TabKeyUp",
				"AltKeyUpAndDoubleClicked",
				"KeyXPress",
				"MouseDrag"
			];

			
			
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
			this.registerHandlers();

			
			
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
					.linkWidth(link => this.highlightLinks.has(link)||_this.selectedLinks.has(link) ? 3 : 2)
					.linkDirectionalParticles(link => this.highlightLinks.has(link)||_this.selectedLinks.has(link) ? 2 : 0)
				.linkDirectionalParticleWidth(1);
			
			this.addNodeColorRule(node => this.highlightNodes.has(node) ? node === hoverNode ? 'rgb(255,0,0,1)' : 'rgba(255,160,0,0.8)' : 'default');
				
				this.updateHighlight = function () {
				  // trigger update of highlighted objects in scene
				  this.Graph3d
					  .nodeColor(this.Graph3d.nodeColor())
					  .nodeRelSize(5)
					.linkWidth(this.Graph3d.linkWidth())
					.linkDirectionalParticles(this.Graph3d.linkDirectionalParticles());
				}
			//-----------------//

			//key listener
			let _this = this;
			document.addEventListener("keydown", function (event) {
				_this.keyListener[event.code] = true;
				
				//key press event
				if (event.code == "ControlLeft") { 
					_this.Graph3d.controls().enabled = false;//disable orbit control
					_this.helper.enablehelper();
				}
				
			});
			document.addEventListener("keyup", function (event) {
				_this.keyListener[event.code] = false;
				
				//key press event
				if (event.code == "ControlLeft") { 
					_this.Graph3d.controls().enabled = true;
					_this.helper.disable();
				}
			});

			//multiply select
			document.addEventListener('pointerdown', function (event) {

				if (!_this.keyListener.ControlLeft) return;//ctrl toggle multiply select

				_this.selectedNodes.clear();
				
				for (const item of _this.selectionBox.collection) {
					if (item.material.type == "MeshLambertMaterial") {
						item.material.emissive.set(0x000000);
					}
				}
				_this.Graph3d.nodeColor(_this.Graph3d.nodeColor());
				_this.selectionBox.startPoint.set(
						( event.clientX / window.innerWidth ) * 2 - 1,
						- ( event.clientY / window.innerHeight ) * 2 + 1,
						0.5 );
			} );

			document.addEventListener('pointermove', function (event) {
				
				if (!_this.keyListener.ControlLeft) return;//ctrl toggle multiply select

				if ( _this.helper.isDown ) {
					for (let i = 0; i < _this.selectionBox.collection.length; i++) {
							if (_this.selectionBox.collection[i].material.type == "MeshLambertMaterial") {
								_this.selectionBox.collection[i].material.emissive.set(0x000000); 
							}
					}
					_this.Graph3d.nodeColor(_this.Graph3d.nodeColor());
		
						_this.selectionBox.endPoint.set(
								( event.clientX / window.innerWidth ) * 2 - 1,
								- ( event.clientY / window.innerHeight ) * 2 + 1,
								0.5 );
		
						const allSelected = _this.selectionBox.select();
					for (let i = 0; i < allSelected.length; i++) {
							console.log(allSelected[i]);
							console.log(allSelected[i].material);
							if (allSelected[i].material.type == "MeshLambertMaterial") {
								allSelected[i].material = allSelected[i].material.clone();
								allSelected[i].material.emissive.set(0xffffff);
								_this.selectedNodes.add(allSelected[i].__data);
							}
					}
					_this.Graph3d.nodeColor(_this.Graph3d.nodeColor());//refresh color
				}
		
			} );
		
			document.addEventListener('pointerup', function (event) {
				
				if (!_this.keyListener.ControlLeft) return;//ctrl toggle multiply select

				_this.selectionBox.endPoint.set(
						( event.clientX / window.innerWidth ) * 2 - 1,
						- ( event.clientY / window.innerHeight ) * 2 + 1,
						0.5 );
				const allSelected = _this.selectionBox.select();
				for (let i = 0; i < allSelected.length; i++) {
					if (allSelected[i].material.type == "MeshLambertMaterial") {
						allSelected[i].material.emissive.set(0xffffff);
						_this.selectedNodes.add(allSelected[i].__data);
					}
				}
				_this.Graph3d.nodeColor(_this.Graph3d.nodeColor());//refresh color
			});
			
			
	
	
		
		
			
		}

		registerEvent(evtname,customFunc) { 
			this.eventList.push(evtname);
			let event = {
				todo:[]//
			};
			this.events[evtname] = event;
			this["dispatch"+evtname] = (e1,e2)=>{
				this.events[evtname].todo.forEach((f)=>{
					f(e1,e2);
				});
			}
			
			
			this.events[evtname].todo.push(customFunc);
			
		}
		
		registerEvents(){
			let _this = this;
			//register BackgroundDoubleClick
			this.Graph3d.onBackgroundClick((e)=>{
				this.judgeBackgroundDoubleClick(e);
			});
			
			//register AltKeyUpAndTwoNodesClicked
			this.Graph3d.onNodeClick((node, event) => {
				for (let handler of this.nodeClickdispatchSlot) {
					handler(node,event);
				}
				
			});
			this.nodeClickdispatchSlot.push((node,event) => {
				this.guiController.editNodePanel(node);
				this.judgeAltKeyUpAndTwoNodesClicked(node, event);
				this.dispatchClickNode(node, event);
			});

			this.addNodeColorRule(node =>
				_this.selectedNodes.has(node) ? 'yellow' : 'default'
			);

			this.addLinkColorRule(link => {
				if (!_this.currentNode) return 'default';
				return _this.currentNode.id == link.id && _this.currentNode.source ? 'yellow' : 'default';
			}
			);
			

			
			this.Graph3d.onNodeHover((node) => {
				for (let handler of this.nodeHoverdispatchSlot) {
					handler(node);
				}
				
			});
			this.nodeHoverdispatchSlot.push((node) => { 
				this.dispatchHighLightNode(node);
				this.dispatchHover(node);
			});
			
			this.Graph3d.onLinkClick((link, event) => {
				for (let handler of this.linkClickdispatchSlot) {
					handler(link,event);
				}
				
			});
			this.linkClickdispatchSlot.push((link, event) => { 
				this.guiController.editLinkPanel(link);
				this.dispatchClickNode(link,event);
			});
			
			this.Graph3d.onLinkHover((link) => {
				for (let handler of this.linkHoverdispatchSlot) {
					handler(link);
				}
				
				
			});
			this.linkHoverdispatchSlot.push((link) => { 
				this.dispatchHighLightLink(link);
				this.dispatchHover();
			});

			//drag selected node together
			this.Graph3d.onNodeDrag((n, t) => {
				for (let handler of this.nodeDragdispatchSlot) {
					handler(n,t);
				}
			}).onNodeDragEnd(node => {
				for (let handler of this.nodeDragEnddispatchSlot) {
					handler(node);
				}
			});

			this.nodeDragdispatchSlot.push((n, t) => { 
				this.Graph3d.controls().enabled = false;//disable orbit control
				this.selectedNodes.forEach((node) => { 
					if (node == n) return;
					node.x += t.x;
					node.y += t.y;
					node.z += t.z;
				})
			});

			this.nodeDragEnddispatchSlot.push((n) => {
				this.Graph3d.controls().enabled = true;//disable orbit control
			});
			
			document.onkeyup = (e)=>{
				console.log(e);
				if(e.key =="Delete") this.dispatchDelKeyUp(this.currentNode,e);
				
				if(e.key =="Tab") {
					
					this.dispatchTabKeyUp(this.currentNode,e);
					}
			}
			
		}

		registerEventHandler(evtname,fun) { 
			this[`on${evtname}`](fun);
		}
		
		registerHandlers(){//system preset event
			this.backgroundDoubleClickHandeler();
			this.highLightHandler();
			this.hoverHandler();
			this.clickNodeHandler();
			this.delKeyUpHandler();
			this.tabKeyUpHandler();
			this.altKeyUpAndDoubleClickedHandler();
			this.highLightPathHandler();
			this.mouseDragHandler();
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
				this.Graph3d.nodeColor(this.Graph3d.nodeColor());
				return;
			}else{
				this.selectedNodes.has(node) ? this.selectedNodes.delete(node) : this.selectedNodes.add(node);

			}
			this.Graph3d.nodeColor(this.Graph3d.nodeColor());
			
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
			this.onBackgroundDoubleClick((e) => {
				//judge alt clicked
				if (e.altKey == true) {
					this.dispatchAltKeyUpAndDoubleClicked(this.currentNode, e);
				}
				else {
					console.log("background double clicked");
					console.log(e);
					let pos = { x: e.clientX, y: e.clientY };
					let target = this.threeUtils.get3DPosByCanvasPos(pos, 0.5, this.Graph3d.camera());
					['x', 'y', 'z'].forEach((axis) => {
						this.cube.position[axis] = target[axis];
					});
					//cube.position = target;
					console.log(target);
					let node = this.basic.initNode();
					node.name = "new"; //this will let 3dgraph make a tooltip text a
					node.properties.name = "undefined";
					['x', 'y', 'z'].forEach((axis) => {
						node[axis] = target[axis];
					});
					let nodes = [];
					this.NWG.addNodes([node]);
					console.log(nodes);
					//Do double click stuff
				}
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
			this.onHover(async (n)=>{
				_this.Graph3d.nodeThreeObject(node => {
					if (_this.highlightNodes.has(node)) {
						
						let sprite = new _this.THREE.SpriteText(node.properties.name ? node.properties.name : node.id);
						sprite.material.depthWrite = false; // make sprite background transparent
						sprite.color = node === _this.hoverNode ? 'orange' : 'green';
						sprite.textHeight = 10;
						return sprite;
					} else {
						return false;
					}
				})
				.linkThreeObject(link => {
					if (_this.highlightLinks.has(link) || _this.selectedLinks.has(link)) {
						// extend link with text sprite
						const sprite = new _this.THREE.SpriteText(`${link.properties.name}`);
						sprite.color = 'lightgrey';
						sprite.textHeight = 8;
						return sprite;
					} else {
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
				_this.Graph3d.d3Force("link").distance(link => { 
						return _this.highlightLinks.has(link) ? 80 : 50;
				});
				
				let highLightLinksChanged = false;
				if (!_this.preHighLightLinks ||  _this.preHighLightLinks.length != _this.highlightLinks.size) { highLightLinksChanged = true; }
				else { 
					_this.preHighLightLinks.forEach(p => { 
						let hasSameLinkFlag = false;
						_this.highlightLinks.forEach(l => { 
							if (p == l) { 
								hasSameLinkFlag = true;
							}
						});
						if (!hasSameLinkFlag) highLightLinksChanged = true;
					});
				}
				
				if (highLightLinksChanged) {
					if (n) {
						n.fx = n.x;
						n.fy = n.y;
						n.fz = n.z;
						setTimeout(() => {
							n.fx = null;
							n.fy = null;
							n.fz = null;
						},1000)
					}
					
					_this.Graph3d.numDimensions(3);
					_this.preHighLightLinks = [];
					_this.highlightLinks.forEach((l) => { 
						_this.preHighLightLinks.push(l);
					});
					
				}
				
			});
			
			
		}
		
		clickNodeHandler(){
			let _this = this;
			this.onClickNode((node, event) => {
				if (!this.focusMode) return;
				if (_this.keyListener.KeyX == true) { 
					_this.dispatchKeyXPress(node, event);
					return;
				}
					_this.selectedNodes.clear();
					if (!node.source) _this.selectedNodes.add(node);
					_this.currentNode = node;
				// Aim at node from outside it //
				if(!node.source){//judge is node or link
						if(!event.altKey){
						let distance = 150;
							let campos = _this.Graph3d.cameraPosition();
							let distRatio = 0;
							if (campos.x * node.x > 0 && campos.y * node.y > 0 && campos.z * node.z > 0) {
								distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
							}
							else { 
								distRatio = 1 - distance / Math.hypot(node.x, node.y, node.z);
							}

						let newPos = node.x || node.y || node.z
						? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
						: { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

						_this.Graph3d.cameraPosition(
						newPos, // new position
						node, // lookAt ({ x, y, z })
						800  // ms transition duration
						);
					}
				}
				//------------------------------//
			});
		}
		
		delKeyUpHandler(){
			let _this = this;
			this.onDelKeyUp((node, event) => {
				_this.selectedNodes.forEach(async snode => { 
					 snode.hasOwnProperty("source")?await _this.NWG.delLink(snode):await _this.NWG.delNode(snode);
					console.log("delete");
				});
				
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
				let links = await this.NWG.addRelationships(n2, { name: "rel", labels: ["linkto"], properties: { name: "undefined" } }, node);
				let link = _this.basic.getLinkById(links[0].id);
				this.currentNode = link;
				this.selectedNodes.clear();
				this.selectedNodes.add(link);
				this.guiController.editLinkPanel(link);
			});
		}

		altKeyUpAndDoubleClickedHandler() { 
			this.onAltKeyUpAndDoubleClicked((node, e) => { 
				console.log(node);
				console.log(e);
				let pos = { x: e.clientX, y: e.clientY };
				let target = this.threeUtils.get3DPosByCanvasPos(pos, 0.5, this.Graph3d.camera());
				['x', 'y', 'z'].forEach((axis) => {
					this.cube.position[axis] = target[axis];
				});
				//cube.position = target;
				console.log(target);
				let node2 = this.basic.initNode();
				let rel = this.NWG.Connector.initRelationship();
				node2.name = "new"; //this will let 3dgraph make a tooltip text a
				node2.properties.name = "undefined";
				['x', 'y', 'z'].forEach((axis) => {
					node2[axis] = target[axis];
				});
				this.NWG.concatNode(node.id,node2,rel);
			});
		}

		highLightPathHandler() { 
			this.onKeyXPress(async (node,event) => { 
					let r = await this.NWG.Connector.shortestPath2Node(this.currentNode.id,node.id);
					let nodeids = r.nodeids;
					let linkids = r.relids;
					nodeids.forEach((o) => {
						let node = this.basic.getNodeById(o);
						if (node != undefined) { 
							this.selectedNodes.add(node);
						}
					});

					linkids.forEach((o) => {
						let link = this.basic.getLinkById(o);
						if (link != undefined) { 
							this.highlightLinks.add(link);
							this.selectedLinks.add(link);
						}
					});
				
				
			});
			
		}

		mouseDragHandler() { 
			this.onMouseDrag(() => { 
				//get nodes,links in select box

			});
		}

		addNodeColorRule(fun) { 
			this.nodeColorRule.push(fun);
		}

		addLinkColorRule(fun) { 
			this.linkColorRule.push(fun);
		}

		executeNodeColorRules = (node) => { 
			let finalColor = "gray";
			let ruleColor = null;
			let _this = this;
			for (let r of _this.nodeColorRule) {
				ruleColor = r(node);
				if (!ruleColor || ruleColor != "default") {
					finalColor = ruleColor;
				 }
			}
			return finalColor;
		}

		executeLinkColorRules = (link) => { 
			let finalColor = "gray";
			let ruleColor = null;
			let _this = this;
			for (let r of _this.linkColorRule) {
				ruleColor = r(link);
				if (!ruleColor || ruleColor != "default") {
					finalColor = ruleColor;
				}
			}
			return finalColor;
		}

		sleep(time) {
			return new Promise(resolve =>
				setTimeout(resolve,time)
		) }
		
	
		
		
		
	}
	
	this.EventManager = EventManager;
})();