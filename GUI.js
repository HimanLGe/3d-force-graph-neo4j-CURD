(()=>{
	class GUI{
		constructor(datGUI){
			this.gui = datGUI;
			
			
			this.settings = {
				
			};
			
			this.controllers = [];
			this.folders = [];
			this.inputMode = false;//true while inputing
			document.addEventListener("keydown", () => { 
				let focusedElement = document.activeElement;
				let ui = document.getElementsByClassName("dg main")[0];
				if (ui.contains(focusedElement)) {
					this.inputMode = true;
				} else { 
					this.inputMode = false;
				}
			});
		}
		
		applySettings(settings){
			this.clear();
			let option = null;
			let folder = null;
			let folderStack = [this.gui];
			let optionStack = [settings];
			option = optionStack.pop();
			folder = folderStack.pop();
			
				
				
				
				
			while(option != undefined){
				for(let i = 0 ; i < Object.keys(option).length;i++){
					let key = Object.keys(option)[i];
					if (key.includes("on") || key.includes("__") || key.includes("neighbors") || key.includes("source") ||
						key.includes("target") || key=="x" || key=="y" || key=="z" || key=="fx"
						|| key == "fy" || key == "fz" || key.includes("x_") || key.includes("y_") || key.includes("z_")
						|| key == "links" || key == "vx" || key == "vy" || key == "vz" || key == "index" || key == "elementId"
						|| key == "startNodeElementId" || key == "endNodeElementId" || key == "identity" || key == "start" || key == "end") continue;
					if(typeof(option[key])=='object'){
						if(option[key].guioption){
							let options = option[key].options;
							//settings["on"+key+"Change"] = ()=>{};
							let controller = folder.add(option[key], option[key].guioption, options);
							let opt = option;
							controller.onChange((val) => {
							if (settings["on" + opt[key].guioption + "Change"]) {
								settings["on" + opt[key].guioption + "Change"](val);
							}
							settings["apply"]();
						});
						}
						else if (option[key].colorKey) {
							let controller = folder.addColor(option[key], option[key].colorKey);
							this.controllers.push(controller);
							let opt = option;
							controller.onChange((val) => {
								if (settings["on" + opt[key].colorKey + "Change"]) {
									settings["on" + opt[key].colorKey + "Change"](val);
								}
								settings["apply"]();
							});
						}
						else{
							optionStack.push(option[key]);
							let addedFolder = folder.addFolder(key);
							if(key=="properties"||key=="labels"||key=="props") addedFolder.open();
							folderStack.push(addedFolder);
							this.folders.push(addedFolder);
						}
					}else{
						//settings["on"+key+"Change"] = ()=>{};
						if (!option[key]) continue;
						let controller = folder.add(option, key);
						controller.onChange((val)=>{
						if (settings["on" + key + "Change"]) {
							settings["on" + key + "Change"](val);
						}
							settings["apply"]();//default upload to neo4j
						});
						this.controllers.push(controller);
					}
				}
				option = optionStack.pop();
				folder = folderStack.pop();
			}
			return settings;
		}
		
		clear(){
			for(let i = this.folders.length-1 ; i >= 0;i--){
				let folder = this.folders[i-1];
				let f = this.folders[i];
				try{
					f.parent.removeFolder(f);
				}catch{
					this.gui.removeFolder(f);
				}
			}

			this.folders = [];
			this.controllers.forEach((c)=>{
				try{
					this.gui.remove(c);
				}catch{}
			});
			this.controllers = [];
			
		}
	}
	
	this.GUI = GUI;
})();