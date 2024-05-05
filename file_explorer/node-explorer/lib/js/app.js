function ViewModel() {
  var self = this;
  var rootDir  = null;
  var extensionsMap = {
    ".zip" : "fa-file-archive-o",
    ".gz" : "fa-file-archive-o",
    ".bz2" : "fa-file-archive-o",
    ".xz" : "fa-file-archive-o",
    ".rar" : "fa-file-archive-o",
    ".tar" : "fa-file-archive-o",
    ".tgz" : "fa-file-archive-o",
    ".tbz2" : "fa-file-archive-o",
    ".z" : "fa-file-archive-o",
    ".7z" : "fa-file-archive-o",
    ".mp3" : "fa-file-audio-o",
    ".cs" : "fa-file-code-o",
    ".c++" : "fa-file-code-o",
    ".cpp" : "fa-file-code-o",
    ".js" : "fa-file-code-o",
    ".xls" : "fa-file-excel-o",
    ".xlsx" : "fa-file-excel-o",
    ".png" : "fa-file-image-o",
    ".jpg" : "fa-file-image-o",
    ".jpeg" : "fa-file-image-o",
    ".gif" : "fa-file-image-o",
    ".mpeg" : "fa-file-movie-o",
    ".pdf" : "fa-file-pdf-o",
    ".ppt" : "fa-file-powerpoint-o",
    ".pptx" : "fa-file-powerpoint-o",
    ".txt" : "fa-file-text-o",
    ".log" : "fa-file-text-o",
    ".doc" : "fa-file-word-o",
    ".docx" : "fa-file-word-o",
  };

  this.currentPath = ko.observable();
  this.filter = ko.observable('');
  this.files = ko.observableArray();
  this.mode = 0;//0 tree,1 parser

  this.init = function() {
    this.getFiles('/files');
  };

  this.filteredFiles = ko.computed(function() {
    var search = self.filter().toLowerCase();
    return ko.utils.arrayFilter(self.files(), function(file) {
      return file.name.toLowerCase().indexOf(search) >= 0;
    });
  });

  this.goUp = function() {
    if (rootDir === self.currentPath()) return;

    var idx = self.currentPath().replaceAll("\\","/").lastIndexOf('/');
    var path = self.currentPath().replaceAll("\\","/").substr(0, idx);
    
    this.getFiles('/files?path=' + path + '&up=true');
    self.currentPath(path);
  };

  this.getFiles = function(path, done) {
    $.get(path).then(function(data) {
      var dir = data.pop();
      self.currentPath(dir);

      if (!rootDir) {
        rootDir = dir;
      }

      for (var d in data) {
        data[d].icon  = data[d].isDirectory ? 'fa-folder' : getIcon(data[d].ext);
      }

      self.files(data);
      self.filter('');

      if (done) done();
    });
  };

  this.getDirectoryFiles = function() {
    if (this.isDirectory) {
      self.getFiles('/files?path=' + this.path);
      return false;
    }
    if (this.mode == 0) {
      // $.post("/filetree", { path: this.path }, (res) => { 
      //   window.parent.alert("finish!");
      // },"json");
      return true;
     }
    else {
      $.post("/parsecode", { path: this.path }, (res) => { 
        window.parent.alert("finish!");
      },"json");
      return true;
    }
    
  };

  function getIcon(ext) {
    return (ext && extensionsMap[ext.toLowerCase()]) || 'fa-file-o';
  }
}

var vm = new ViewModel();
vm.init();

ko.applyBindings(vm);

//url传入参数
// 获取URL中的参数
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const variableValue = urlParams.get('mode');

// 在控制台输出参数值
console.log(variableValue);

