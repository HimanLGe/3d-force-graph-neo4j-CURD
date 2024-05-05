

function setUrl() {
    let url = document.getElementsByClassName("url")[0].value;
    let username = document.getElementsByClassName("username")[0].value;
    let pwd = document.getElementsByClassName("pwd")[0].value;
    localStorage.dbpwd = pwd;
    localStorage.dbname = username;
    localStorage.dburl = url;
    window.neo4jConector.connect(url, username, pwd);
    document.getElementsByClassName("editDatabase")[0].style.display = "none";
    window.NWG.getAll();

}

function createDatabase() {
    let name = window.prompt("database name");
    window.neo4jConector.excuteCypher("CREATE DATABASE "+name);
    window.NWG.getAll();
    
}

function clearDatabase() {
    
    //window.neo4jConector.excuteCypher("match (n) detach delete (n)");
    window.NWG.getAll();
    
}

function setDatabase() {
    localStorage.dbname = document.getElementById("listDatabase").value;
    window.ajax(
        {
            url:"http://localhost/setdatabase",
            type:'post',
            data:{
                name:document.getElementById("listDatabase").value
            },
            dataType:'json',
            timeout:10000,
            contentType:"application/json",
            success:function(data){
                window.alert("success");
                window.GraphApp.neo4jConnector.setDatabase(document.getElementById("listDatabase").value);
                window.NWG.getAll();
                document.getElementsByClassName("switchDatabase")[0].style.display = "none";
            },
            //异常处理
            error:function(e){
                console.log(e);
            }
        }
    );

    //window.neo4jConector.setDatabase(document.getElementById("listDatabase").value);
    
}

function editUrl(){
    document.getElementsByClassName("editDatabase")[0].style.display = "block";
    document.getElementsByClassName("pwd")[0].value = localStorage.dbpwd?localStorage.dbpwd:"";
    document.getElementsByClassName("username")[0].value = localStorage.dbname?localStorage.dbname:"";
    document.getElementsByClassName("url")[0].value = localStorage.dburl?localStorage.dburl:"";
}

function selectFile() {
    document.getElementsByClassName("fileManager")[0].querySelector("iframe").src = "explorer?mode=1";
    document.getElementsByClassName("fileManager")[0].style.display = "block";
}

function folderTree() {
    document.getElementsByClassName("fileManager")[0].querySelector("iframe").src = "explorer?mode=0";
    document.getElementsByClassName("fileManager")[0].style.display = "block";
}

function fileManagerConfirm() {
    const fp = document.getElementsByClassName("fileManager")[0].querySelector("iframe").contentWindow.vm.currentPath();
    console.log(fp)
    window.ajax(
        {
            url:"http://localhost/filetree",
            type:'post',
            data:{
                path:fp
            },
            dataType:'json',
            timeout:10000,
            contentType:"application/json",
            success:function(data){
                window.alert("success");
            },
            //异常处理
            error:function(e){
                console.log(e);
            }
        }
    );
}

async function switchDatabase(){
    // 获取 select 元素
    var select = document.getElementById("listDatabase");

   

    var records = await window.neo4jConector.excuteCypher("SHOW DATABASES");

    records.forEach(element => {

        if (element.get("name") != "system") {
            
            // 创建新的选项
            var option = document.createElement("option");
            // 设置选项的值
            option.value = element.get("name");

            // 设置选项的文本
            option.text = element.get("name");

            // 添加选项到 select
            select.add(option);
        }
    });

    
    
   

    document.getElementsByClassName("switchDatabase")[0].style.display = "block";
}

function parsefile() {
    

    
        
        window.ajax(
            {
                url:"http://localhost/parsecode",
                type:'post',
                data:{
                    
                },
                dataType:'json',
                timeout:10000,
                contentType:"application/json",
                success:function(data){
                    window.alert("success");
                },
                //异常处理
                error:function(e){
                    console.log(e);
                }
            }
        );
    

    
    

    
}

function trackball(){
    localStorage.controlType = "trackball";
    location.reload();
}

function fly() {
    localStorage.controlType = "fly";
    location.reload();
}