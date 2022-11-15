(()=>{
	class GUIController{
		constructor(GUI,neo4jWithGraph,$,env){
			this.gui = GUI;
			this.env = env;
			this.neo4jWithGraph = neo4jWithGraph;
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
		
		
		editNodePanel(settings){
			settings["apply"] = ()=>{
				delete settings.labels["add"];
				delete settings.properties["add"];
				delete settings["apply"];
				delete settings["delete"];
				this.neo4jWithGraph.setNode(settings);
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
				settings.properties[theResponse] = "";
				settings = this.gui.applySettings(settings);
				};
			settings = this.gui.applySettings(settings);
			settings.onxChange = (e)=>{console.log(e);};
			
		}
		
		editLinkPanel(settings){
			settings["apply"] = ()=>{
				
				delete settings.properties["add"];
				delete settings["apply"];
				delete settings["delete"];
				this.neo4jWithGraph.setLink(settings);
				console.log("apply");
				};
			settings["delete"] = ()=>{
				this.neo4jWithGraph.delLink(settings);
				console.log("delete");
				};
			
			settings.properties["add"] = ()=>{
				var theResponse = window.prompt("prop name");
				settings.properties[theResponse] = "";
				settings = this.gui.applySettings(settings);
				};
			settings = this.gui.applySettings(settings);
			settings.onxChange = (e)=>{console.log(e);};
			
		}
	}
	
	this.GUIController = GUIController;
})();