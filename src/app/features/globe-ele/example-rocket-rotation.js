// Reference: https://codepen.io/alok/pen/GPoGod

//Boring Stuff
var scene,
	camera,
	controls,
	shadowLight,
	backLight,
	light,
	renderer,
	frequency = 5,
	freqCount = 0,
	container,
	smokeRecycle = [],
	pt,
	radians,
	axis,
	rocket1,
	tangent,
	HEIGHT,
	WIDTH,
	windowHalfX,
	windowHalfY,
	up = new THREE.Vector3( 0, 1, 0),
	axis = new THREE.Vector3(),
	worldCoords,
	t = 0;


//  Rocket Stuff Here

//We create a low poly rocket with basic Three.js geometry :)
//Largely insipred by Karim Maaloul's Amazing work
// https://codepen.io/Yakudoo/

Rocket = function(){

	this.rocket = new THREE.Object3D();
	this.rocketTween = TweenMax.set(this.rocket.position, {x:0});

	this.bodyMat = new THREE.MeshLambertMaterial ({
		color: 0x1d836a,
		wireframe: false,
		shading:THREE.FlatShading
	});
	this.ringMat = new THREE.MeshLambertMaterial ({
		color: 0x3a1b19,
		wireframe: false,
		shading:THREE.FlatShading
	});
	this.metalMat = new THREE.MeshLambertMaterial ({
		color: 0x81878d,
		wireframe: false,
		shading:THREE.FlatShading
	});
	var footGeom = new THREE.BoxGeometry(30, 10, 30);

	this.top = new THREE.Object3D();
	this.mid = new THREE.Object3D();
	this.bot = new THREE.Object3D();
	this.engine = new THREE.Object3D();
	this.legs = new THREE.Object3D();

	this.bodyTopRing = makeCylinder(35, 35, 10, 10, 1, this.ringMat);
	this.bodyTopRing.position.y = 0;


	this.bodyTopBase = makeCylinder(25, 30, 10, 10, 1, this.bodyMat);
	this.bodyTopBase.position.y = 10;

	this.bodyTop = makeCylinder(5, 25, 30, 10, 1, this.bodyMat);
	this.bodyTop.position.y = 30;

	this.bodyTopNippleBase = makeCylinder(5, 5, 5, 10, 1, this.ringMat);
	this.bodyTopNippleBase.position.y = 47;

	this.bodyTopNipple = makeCylinder(2, 5, 5, 10, 1, this.ringMat);
	this.bodyTopNipple.position.y = 52;

	this.bodyTopAntenna = makeCylinder(1, 1, 25, 5, 1, this.ringMat);
	this.bodyTopAntenna.position.y = 63;

	this.bodyTopAntennaBall = new THREE.Mesh(new THREE.SphereGeometry( 2, 20, 10 ), this.ringMat);
	this.bodyTopAntennaBall.position.y = 76;

	this.top.add(this.bodyTopRing);
	this.top.add(this.bodyTopBase);
	this.top.add(this.bodyTop);
	this.top.add(this.bodyTopNippleBase);
	this.top.add(this.bodyTopNipple);
	this.top.add(this.bodyTopAntenna);
	this.top.add(this.bodyTopAntennaBall);

	this.bodyMidRing = makeCylinder(87, 87, 12, 12, 1, this.ringMat);
	this.bodyMidRing.position.y = 0;
	this.bodyMidBase = makeCylinder(60, 80, 50, 12, 1, this.bodyMat);
	this.bodyMidBase.position.y = 31;

	this.bodyMid = makeCylinder(30, 60, 120, 12, 1, this.bodyMat);
	this.bodyMid.position.y = 116;

	this.mid.add(this.bodyMid);
	this.mid.add(this.bodyMidBase);
	this.mid.add(this.bodyMidRing);
	this.bodyBotRing = makeCylinder(45, 45, 5, 12, 1, this.ringMat);
	this.bodyBotRing.position.y = 0;
	this.bodyBot = makeCylinder(80, 45, 25, 12, 1, this.bodyMat);
	this.bodyBot.position.y = 15;
	this.bot.add(this.bodyBotRing);
	this.bot.add(this.bodyBot);

	this.bodyEngineTop = makeCylinder(45, 50, 5, 12, 1, this.bodyMat);
	this.bodyEngineTop.position.y = 0;
	this.bodyEngineRingTop =  makeCylinder(55, 50, 10, 12, 1, this.ringMat);
	this.bodyEngineRingTop.position.y = -8;
	this.bodyEngineMid = makeCylinder(45, 45, 10, 8, 1, this.bodyMat);
	this.bodyEngineMid.position.y = -18;
	this.bodyEngineRingBot =  makeCylinder(50, 40, 10, 12, 1, this.ringMat);
	this.bodyEngineRingBot.position.y = -28;
	this.bodyEngineNozzle =  makeCylinder(45, 55, 25, 12, 1, this.metalMat);
	this.bodyEngineNozzle.position.y = -44;
	this.bodyEngineNozzleEnd =  makeCylinder(60, 60, 5, 12, 1, this.metalMat);
	this.bodyEngineNozzleEnd.position.y = -59;

	this.engine.add(this.bodyEngineTop);
	this.engine.add(this.bodyEngineRingTop);
	this.engine.add(this.bodyEngineMid);
	this.engine.add(this.bodyEngineRingBot);
	this.engine.add(this.bodyEngineNozzle);
	this.engine.add(this.bodyEngineNozzleEnd);

	this.legA =  makeCylinder(5, 5, 170, 6, 1, this.ringMat);
	this.legA.position.set(0,0,-75);
	this.legA.rotation.x = 20 * Math.PI / 180;
	this.legB =  makeCylinder(5, 5, 170, 6, 1, this.ringMat);
	this.legB.position.set(75,0,0);
	this.legB.rotation.z = 20 * Math.PI / 180;
	this.legY =  makeCylinder(5, 5, 170, 6, 1, this.ringMat);
	this.legY.position.set(0,0,75);
	this.legY.rotation.x = -20 * Math.PI / 180;
	this.legZ =  makeCylinder(5, 5, 170, 6, 1, this.ringMat);
	this.legZ.position.set(-75,0,0);
	this.legZ.rotation.z = -20 * Math.PI / 180;

	this.legs.add(this.legA);
	this.legs.add(this.legB);
	this.legs.add(this.legZ);
	this.legs.add(this.legY);

	this.legASock =  makeCylinder(6, 6, 50, 6, 1, this.metalMat);
	this.legASock.position.set(0,-37,-89);
	this.legASock.rotation.x = 20 * Math.PI / 180;

	this.legBSock =  makeCylinder(6, 6, 50, 6, 1, this.metalMat);
	this.legBSock.position.set(89,-37,0);
	this.legBSock.rotation.z = 20 * Math.PI / 180;

	this.legYSock =  makeCylinder(6, 6, 50, 6, 1, this.metalMat);
	this.legYSock.position.set(0,-37,89);
	this.legYSock.rotation.x = -20 * Math.PI / 180;

	this.legZSock =  makeCylinder(6, 6, 50, 6, 1, this.metalMat);
	this.legZSock.position.set(-89,-37,0);
	this.legZSock.rotation.z = -20 * Math.PI / 180;

	this.legs.add(this.legASock);
	this.legs.add(this.legBSock);
	this.legs.add(this.legYSock);
	this.legs.add(this.legZSock);

	this.legAFoot = new THREE.Mesh(footGeom, this.metalMat);
	this.legAFoot.position.set(0,-45,0);
	this.legAFoot.rotation.x = -20 * Math.PI / 180;

	this.legBFoot = new THREE.Mesh(footGeom, this.metalMat);
	this.legBFoot.position.set(0,-45,0);
	this.legBFoot.rotation.z = -20 * Math.PI / 180;

	this.legYFoot = new THREE.Mesh(footGeom, this.metalMat);
	this.legYFoot.position.set(0,-45,0);
	this.legYFoot.rotation.x = 20 * Math.PI / 180;

	this.legZFoot = new THREE.Mesh(footGeom, this.metalMat);
	this.legZFoot.position.set(0,-45,0);
	this.legZFoot.rotation.z = 20 * Math.PI / 180;

	this.legASock.add(this.legAFoot);
	this.legBSock.add(this.legBFoot);
	this.legYSock.add(this.legYFoot);
	this.legZSock.add(this.legZFoot);

	this.windowXTop = makeCylinder(14, 14, 2, 10, 1, this.ringMat);
	this.windowXTop.position.set(0,-45,57);
	this.windowXTop.rotation.x = 75 * Math.PI / 180;

	this.windowXInnerTop = makeCylinder(9, 9, 2, 10, 1, this.metalMat);
	this.windowXInnerTop.position.set(0,2,0);

	this.windowXBot = makeCylinder(12, 12, 2, 10, 1, this.ringMat);
	this.windowXBot.position.set(0,0,46);
	this.windowXBot.rotation.x = 75 * Math.PI / 180;

	this.windowXInnerBot = makeCylinder(7, 7, 2, 10, 1, this.metalMat);
	this.windowXInnerBot.position.set(0,2,0);

	this.windowXTop.add(this.windowXInnerTop);
	this.windowXBot.add(this.windowXInnerBot);
	this.bodyMid.add(this.windowXTop);
	this.bodyMid.add(this.windowXBot);

	this.top.position.y = 170   ;
	this.mid.position.y = 0;
	this.bot.position.y = -33   ;
	this.engine.position.y = -38   ;
	this.legs.position.y = -40   ;

	this.rocket.add(this.top);
	this.rocket.add(this.mid);
	this.rocket.add(this.bot);
	this.rocket.add(this.engine);
	this.rocket.add(this.legs);

}
Rocket.prototype.flyPath = function(){
	pt = spline.getPoint( t );
	tangent = spline.getTangent( t ).normalize();
	axis.crossVectors( up, tangent ).normalize();
	radians = Math.acos( up.dot( tangent ) );
	var quaterions = this.rocket.quaternion.setFromAxisAngle( axis, radians );

	this.rocketTween.kill();
	this.tweenPosition = TweenMax.to(rocket1.rocket.position, 0.1, {x:pt.x, y: pt.y, z: pt.z});
	this.tweenQuaternion = TweenMax.to(this.rocket.quaternion, 0.1,
		{
			x: quaterions._x,
			y: quaterions._y,
			z: quaterions._z});

		t = (t >= 1) ? 0 : t += 0.0009;
}

//Smoke Stuff here

// We create and recycle smoke objects here
//Largely insipred by Karim Maaloul's Amazing work here https://codepen.io/Yakudoo/pen/eNmjEv
// https://codepen.io/Yakudoo/

function setSmokeCoords(){
	rocket1.bodyMid.geometry.computeBoundingBox();
	var boundingBox = rocket1.bodyMid.geometry.boundingBox;
	worldCoords = new THREE.Vector3();
	worldCoords.subVectors( boundingBox.max, boundingBox.min );
	worldCoords.multiplyScalar( 0.5 );
	worldCoords.add( boundingBox.min );
	worldCoords.applyMatrix4( rocket1.bodyMid.matrixWorld );
}
function dropSmoke(s) {

	s.mesh.material.opacity = 1;
	s.mesh.position.x = worldCoords.x;
	s.mesh.position.y = worldCoords.y;
	s.mesh.position.z = worldCoords.z;
	s.mesh.scale.set(0.1, 0.1, 0.1);

	var smokeTl = new TimelineMax();

	var tweenSmokeEnter = TweenMax.to(s.mesh.scale, Math.random() * 1 + 0.3, {
		x: Math.random() * 1 + 0.7,
		y: Math.random() * 1 + 0.7,
		z: Math.random() * 1 + 0.7,
		delay: 0.1,
		ease: Strong.easeOut
	});
	var tweenSmokeLeave = TweenMax.to(s.mesh.scale, 0.5, {
		x: 0.1,
		y: 0.1,
		z: 0.1,
		ease: Strong.easeIn,
		onComplete: resetSmoke,
		onCompleteParams:[s]
	});
	smokeTl.add(tweenSmokeEnter).add(tweenSmokeLeave, 0.6).play();
}
function createDroppingWaste(){
	var s = getSmokeParticle();
	dropSmoke(s);
}
function getSmokeParticle(){
	if (smokeRecycle.length){
		return smokeRecycle.pop();
	}else{
		return new SmokeParticle();
	}
}
function resetSmoke(s){
	s.mesh.position.x = 0;
	s.mesh.position.y = 0;
	s.mesh.position.z = 0;
	s.mesh.rotation.x = Math.random()*Math.PI*2;
	s.mesh.rotation.y = Math.random()*Math.PI*2;
	s.mesh.rotation.z = Math.random()*Math.PI*2;
	s.mesh.scale.set(.1,.1,.1);
	s.mesh.material.opacity = 0;
	s.material.needUpdate = true;
	scene.add(s.mesh);
	smokeRecycle.push(s);
}
function SmokeParticle() {
	this.geometry = new THREE.IcosahedronGeometry( 75, 1 );
	this.material = new THREE.MeshLambertMaterial({
		color: 'white', shading: THREE.FlatShading, transparent: true
	});
	this.mesh = new THREE.Mesh(this.geometry, this.material);
	resetSmoke(this);
}
function updateSmokeArr(){
	if (freqCount % frequency == 0){
		createDroppingWaste();
	}
	freqCount++;
}


//Create Stuff
function createRocket(){
	rocket1 = new Rocket();
	scene.add(rocket1.rocket);
}
function createPath(){
	spline =  new THREE.Curves.CinquefoilKnot(700);

	var material = new THREE.LineBasicMaterial({color : 0x2c2c2c});
	var geometryt = new THREE.Geometry();
	for(var i = 0; i < spline.getPoints(100).length; i++){
		geometryt.vertices.push(spline.getPoints(100)[i]);
	}

	line = new THREE.Line(geometryt, material);
	scene.add(line);
}
function createPlanet(){
	moonMat =  new THREE.MeshLambertMaterial ({
		color: 0x4c00b4,
		wireframe: false,
		shading:THREE.FlatShading
	});

	var moonGeometry = new THREE.IcosahedronGeometry(530, 1 );
	moon = new THREE.Mesh(moonGeometry, moonMat);

	scene.add( moon );
}


function createLights() {
	light = new THREE.HemisphereLight(0xffffff, 0xffffff, .5)

	shadowLight = new THREE.DirectionalLight(0xffffff, .8);
	shadowLight.position.set(200, 200, 200);
	shadowLight.castShadow = true;
	shadowLight.shadowDarkness = .2;

	backLight = new THREE.DirectionalLight(0xffffff, .4);
	backLight.position.set(-100, 200, 50);
	backLight.shadowDarkness = .1;
	backLight.castShadow = true;

	scene.add(backLight);
	scene.add(light);
	scene.add(shadowLight);
}
function makeCylinder(radiusTop, radiusBottom, height, radiusSegments, heightSegments, mat) {
	var geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments);
	var mesh = new THREE.Mesh(geom, mat);
	return mesh;
}
function onWindowResize() {
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	windowHalfX = WIDTH / 2;
	windowHalfY = HEIGHT / 2;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
}



function render(){
	renderer.render(scene, camera);
}
function animate(){
	requestAnimationFrame(animate);
	render();
	setSmokeCoords();
	rocket1.flyPath();
	updateSmokeArr();
	var currentSeconds = Date.now();

	moon.rotation.y = currentSeconds * -0.0004;
	moon.rotation.z = currentSeconds * -0.0002;
	controls.update();
}

function init(){
	scene = new THREE.Scene();
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	camera = new THREE.PerspectiveCamera( 60, WIDTH / HEIGHT, 1, 20000);

	camera.position.z = 2500;
	camera.position.y = 1100;
	camera.position.x = 1300;
	renderer = new THREE.WebGLRenderer({alpha: true, antialias: true });
	renderer.setSize(WIDTH, HEIGHT);

	container = document.getElementById('galaxy');
	container.appendChild(renderer.domElement);

	windowHalfX = WIDTH / 2;
	windowHalfY = HEIGHT / 2;

	window.addEventListener('resize', onWindowResize, false);
	controls = new THREE.OrbitControls( camera, renderer.domElement);
}



THREE.Curves = {};
THREE.Curves.CinquefoilKnot = THREE.Curve.create(

	function(s) {

		this.scale = (s === undefined) ? 10 : s;

	},

	function(t) {

		var p = 2,
			q = 5;
		t *= Math.PI * 2;
		var tx = (2 + Math.cos(q * t)) * Math.cos(p * t),
			ty = (2 + Math.cos(q * t)) * Math.sin(p * t),
			tz = Math.sin(q * t);

		return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale);

	}

);

init();
createLights();
createRocket();
createPath();
createPlanet();
animate();
