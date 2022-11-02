(()=>{


class THREEUtils{
	//将当前屏幕上的坐标转换成3d中的坐标
	//pos 是当前canvas屏幕上的坐标，targetZ 是物体距离原点的距离
	
	constructor(env){
		this.THREE = env.THREE;
		this.scope = env;
	}
	
	get3DPosByCanvasPos (pos, targetZ,camera) {    
		let vec = new this.THREE.Vector3(); // create once and reuse
		let target = new this.THREE.Vector3(); // create once and reuse
		vec.set(
			( pos.x / window.innerWidth ) * 2 - 1,
			- ( pos.y / window.innerHeight ) * 2 + 1,
			0.5 );
		vec.unproject( camera );
		vec.sub( camera.position ).normalize();
		var distance = (targetZ - camera.position.z) / vec.z;
		target.copy( camera.position ).add( vec.multiplyScalar( distance ) );
		return target;
	}
}

this.THREEUtils = THREEUtils;
})();