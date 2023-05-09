import { cc } from "test2.js";

function f0() {
    let a = 0;
    if(a==0){
      f1();
    }
    else if(a==1){
    
    }
    
}

function f1() {

}
    
function f2(){
      f0();
      for(let i = 0 ; i < 5;i++){
          f1();
    }
}

f2();
cc();