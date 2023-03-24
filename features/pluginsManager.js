export default class pluginsManager { 
    constructor() { 
        this.page = 1;
    }

    getInstalled() { 
        window.ajax(
            {
                url:"http://localhost/listPlugins",
                type:'get',
                dataType:'json',
                timeout:10000,
                success:function(data){
                    let plist = document.getElementsByClassName('pluginslist')[0];
                    plist.innerHTML = "";
                    let resultList = JSON.parse(data);
                    if (resultList.length == 0) { 
                        let li = document.createElement("li");
                        li.textContent = "empty";
                        plist.appendChild(li);
                    }
                    for (let i in resultList) {
                        let li = document.createElement("li");
                        let b = document.createElement("button");
                        b.textContent = "Uninstall";
                        b.onclick = () => { 
                            window.GraphApp.features.pluginsManager.uninstallPlugin(resultList[i]);
                        };
                        
                        li.textContent = resultList[i];
                        li.appendChild(b);
                        plist.appendChild(li);
                    }
                    
                },
                //异常处理
                error:function(e){
                    console.log(e);
                }
            }
        );
    }

    listPlugins() { 
        window.ajax(
            {
                url:"http://localhost/listPlugins",
                type:'get',
                dataType:'json',
                timeout:10000,
                success:function(data){
                    let plist = document.getElementsByClassName('pluginslist')[0];
                    plist.innerHTML = "";
                    let resultList = JSON.parse(data);
                    return resultList;
                    
                },
                //异常处理
                error:function(e){
                    console.log(e);
                }
            }
        );
    }

    getAllPlugins() { }

    installPlugin(name) {
        window.ajax(
            {
                url:"http://localhost/installPlugin",
                type:'post',
                data:{
                    name: name,
                    
                },
                dataType:'json',
                timeout:10000,
                contentType:"application/json",
                success:function(data){
                    //window.alert("success");
                    console.log(data);
                    let res = JSON.parse(data);
                    if (res.status == "success") {
                        window.alert("success");
                    } else { 
                        window.alert("fail");
                    }
                    
                },
                //异常处理
                error:function(e){
                    console.log(e);
                }
            }
        );
    }

    uninstallPlugin(name) {
        window.ajax(
            {
                url:"http://localhost/uninstallPlugin",
                type:'post',
                data:{
                    name: name,
                    
                },
                dataType:'json',
                timeout:10000,
                contentType:"application/json",
                success:function(data){
                    //window.alert("success");
                    console.log(data);
                    let res = JSON.parse(data);
                    if (res.status == "success") {
                        window.alert("success");
                    } else { 
                        window.alert("fail");
                    }
                    
                },
                //异常处理
                error:function(e){
                    console.log(e);
                }
            }
        );
     }

    searchPlugins() { 
        let name = document.getElementsByClassName('packagename')[0].value;
        window.ajax(
            {
                url:"http://localhost/search",
                type:'post',
                data:{
                    name: name,
                    page: this.page
                },
                dataType:'json',
                timeout:10000,
                contentType:"application/json",
                success:function(data){
                    //window.alert("success");
                    let plist = document.getElementsByClassName('pluginslist')[0];
                    plist.innerHTML = "";
                    let resultList = JSON.parse(data);
                    if (resultList.length == 0) { 
                        let li = document.createElement("li");
                        li.textContent = "empty";
                        plist.appendChild(li);
                    }
                    for (let i in resultList) {
                        let li = document.createElement("li");
                        let b = document.createElement("button");
                        b.textContent = "Install";
                        b.onclick = () => { 
                            window.GraphApp.features.pluginsManager.installPlugin(resultList[i]);
                        };
                        li.textContent = resultList[i];
                        li.appendChild(b);
                        plist.appendChild(li);
                    }
                    
                },
                //异常处理
                error:function(e){
                    console.log(e);
                }
            }
        );
    }

    openWindow() { 
        this.getInstalled();
        document.getElementsByClassName('plugins')[0].style.display = 'block';
        
    }
    
}