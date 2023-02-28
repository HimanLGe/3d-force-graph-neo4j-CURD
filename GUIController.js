(()=>{
	class GUIController{
		constructor(GUI,neo4jWithGraph,$,env){
			this.gui = GUI;
			this.env = env;
			this.neo4jWithGraph = neo4jWithGraph;
			this.autoFocusName = true;
			this.initCommandLine();
		}
		
		initCommandLine(){
			this.cmdHeight = "1.2rem";
			this.cmdFocusFlag = false;
			this.cmdAltKeyFlag = false;
			$(".cmd").css("width","30rem");
			$(".cmd").css("min-height","1.0rem");
			$(".cmd").css("height","1.2rem");
			$(".cmd").css("background-color","rgba(255,255,255,0.1)");
			$(".cmd").css("border","2px solid rgba(255,255,255,0.1)");
			$(".cmd").css("border-radius","10px");
			$(".cmd").css("position","absolute");
			$(".cmd").css("top","90%");
			$(".cmd").css("left","50%");
			$(".cmd").css("transform","translate(-50%,-100%)");
			$(".cmd").css("padding","0");
			$(".cmd").css("padding-left","5px");
			$(".cmd").css("transition","all 0.2s linear");
			$(".cmd").css("overflow","hidden");
			$(".cmd").css("caret-color","red");
			$(".cmd").css("color","orange");

			$(".cmd").hover((a)=>{
				$(".cmd").css("height",this.cmdHeight);
				$(".cmd").css("background-color","rgba(255,255,255,0.5)");
				$(".cmd").css("border","2px solid rgba(255,255,255,1)");
			},
			()=>{
				if(!this.cmdFocusFlag){
					$(".cmd").css("background-color","rgba(255,255,255,0.1)");
					$(".cmd").css("border","2px solid rgba(255,255,255,0.1)");
					this.cmdHeight = $(".cmd").prop('scrollHeight');
					$(".cmd").css("height","1.2rem");
				}
			});
			
			$(".cmd").on("keydown", function(e) {
				
			  if(e.keyCode === 13 && !e.altKey){
				  e.cancelBubble=true;
				  e.preventDefault();
				  e.stopPropagation();
			  }
			  
			  if(e.keyCode === 13 && e.altKey){
				  this.value=this.value+"\n";
				  e.target.focus();
			  }
			});

			$(".cmd").on("keyup", function(e) {
				 if (e.keyCode === 8) {
				this.style.height = "inherit";
				this.style.height = `${this.scrollHeight}px`;
			  } else {
				this.style.height = `${this.scrollHeight}px`;
			  }
			  
			  
			  
			});
			
			$(".cmd").on("focus",()=>{
				this.cmdFocusFlag = true;
				$(".cmd").css("background-color","rgba(255,255,255,0.5)");
				$(".cmd").css("border","2px solid rgba(255,255,255,1)");
			});
			
			$(".cmd").on("blur",()=>{
				this.cmdFocusFlag = false;
				$(".cmd").css("background-color","rgba(255,255,255,0.1)");
				$(".cmd").css("border","2px solid rgba(255,255,255,0.1)");
			});
		}
		
		
		editNodePanel(settings) {
			let _this = this;
			settings["apply"] = ()=>{
				let labelsadd =  settings.labels["add"];
				let propertiesadd =  settings.properties["add"];
				let apply =  settings["apply"];
				let del =  settings["delete"];

				delete settings.labels["add"];
				delete settings.properties["add"];
				delete settings["apply"];
				delete settings["delete"];
				this.neo4jWithGraph.setNode(settings);
				
				settings.labels["add"] = labelsadd;
				settings.properties["add"] = propertiesadd;
				settings["apply"] = apply;
				settings["delete"] = del;
				console.log("apply");
				};
			settings["delete"] = ()=>{
				this.neo4jWithGraph.delNode(settings);
				console.log("delete");
				};
			settings.labels["add"] = ()=>{
				var theResponse = window.prompt("label name");
				settings.labels.push(theResponse);
				settings = this.gui.applySettings(settings);
				};
			settings.properties["add"] = ()=>{
				var theResponse = window.prompt("prop name");
				settings.properties[theResponse] = "?";
				settings = this.gui.applySettings(settings);
			};
			settings.onfixedChange = (e) => {
				//console.log(e);
				if (settings.properties.fixed == "true") {
					settings.properties.fx = window.GraphApp.basic.getNodeObjectById(settings.id).x;
					settings.properties.fy = window.GraphApp.basic.getNodeObjectById(settings.id).y;
					settings.properties.fz = window.GraphApp.basic.getNodeObjectById(settings.id).z;
					settings["apply"]();
				} else { 
					settings.properties.fx = null;
					settings.properties.fy = null;
					settings.properties.fz = null;
					settings["apply"]();
				}
			};
			settings = this.gui.applySettings(settings);
			settings.onxChange = (e) => { console.log(e); };
			if (this.autoFocusName) {
				if ($(".property-name:contains('name')").next("div").children().val() == "undefined") {
					$(".property-name:contains('name')").next("div").children().val("").focus();
				} else {
					$(".dg.main").on("keyup", (e) => { console.log(e) });
					$(".property-name:contains('name')").next("div").children().focus();
				}
			}
			$(".property-name:contains('name')").next("div").keydown(event => { 
				if (event.keyCode === 13) {
					// 这里是回车键被按下后要执行的操作
					console.log('Enter key pressed');
					let eventManager = window.GraphApp.eventManager;
					let basic = window.GraphApp.basic;
					let childLink = basic.getLinkBySourceId(eventManager.currentNode.id);
					if (childLink) {
						eventManager.selectedNodes.clear();
						eventManager.currentNode = childLink;
						
						this.editLinkPanel(eventManager.currentNode);
						window.GraphApp.Graph.nodeColor(window.GraphApp.Graph.nodeColor());
					}
				  }
			});
			
		}
		
		editLinkPanel(settings) {
			let _this = this;
			settings["apply"] = ()=>{
				let propertiesadd =  settings.properties["add"];
				let apply =  settings["apply"];
				let del =  settings["delete"];

				delete settings.properties["add"];
				delete settings["apply"];
				delete settings["delete"];
				this.neo4jWithGraph.setLink(settings);
				
				settings.properties["add"] = propertiesadd;
				settings["apply"] = apply;
				settings["delete"] = del;
				console.log("apply");
				};
			settings["delete"] = ()=>{
				this.neo4jWithGraph.delLink(settings);
				console.log("delete");
				};
			
			settings.properties["add"] = ()=>{
				var theResponse = window.prompt("prop name");
				settings.properties[theResponse] = "?";
				settings = this.gui.applySettings(settings);
				};
			settings = this.gui.applySettings(settings);
			settings.onxChange = (e)=>{console.log(e);};
			
			if (this.autoFocusName) {
				if ($(".property-name:contains('name')").next("div").children().val() == "undefined") {
					$(".property-name:contains('name')").next("div").children().val("").focus();
				} else {
					$(".dg.main").on("keyup", (e) => { console.log(e) });
					$(".property-name:contains('name')").next("div").children().focus();
				}
			}
			$(".property-name:contains('name')").next("div").keydown(event => { 
				if (event.keyCode === 13) {
					// 这里是回车键被按下后要执行的操作
					console.log('Enter key pressed');
					let eventManager = window.GraphApp.eventManager;
					let basic = window.GraphApp.basic;
					eventManager.selectedNodes.clear();
					
					eventManager.currentNode = basic.getNodeById(basic.getLinkById(eventManager.currentNode.id).target.id);
					eventManager.selectedNodes.add(eventManager.currentNode);
					
					window.GraphApp.Graph.nodeColor(window.GraphApp.Graph.nodeColor());
					_this.editNodePanel(eventManager.currentNode);
				  }
			});
		}
		
		changeDatabasePanel(settings){
			
			
			
			settings["add"] = ()=>{
				var theResponse = window.prompt("database name");
				settings[theResponse] = "";
				settings = this.gui.applySettings(settings);
				};
			settings = this.gui.applySettings(settings);
			settings.onxChange = (e)=>{console.log(e);};
			if($(".property-name:contains('name')").next("div").children().val()=="undefined"){
				$(".property-name:contains('name')").next("div").children().val("").focus();
			}
			$(".dg.main").on("keyup",(e)=>{console.log(e)});
		}
	}
	
	this.GUIController = GUIController;
})();