import React from "react";
import * as THREE from "three";
import { DoubleSide } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

class TestOne extends React.Component {
    componentDidMount() {
        const scene = new THREE.Scene()

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        camera.position.z = 5

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(window.innerWidth, window.innerHeight)
        document.body.appendChild(renderer.domElement)
        var light = new THREE.AmbientLight(0xffffff);
        light.intensity = 1;
        scene.add(light)

        var SLight = new THREE.SpotLight(0xffffff)
        SLight.intensity = 2;
        SLight.position.set(5, 5, 5)
        scene.add(SLight)

        const video = document.createElement("video")
        video.src = "./video/Azul.mp4"
        video.muted = true;
        video.loop = false;
        video.play();

        var vidTex = new THREE.VideoTexture(video);
        const vidGeo = new THREE.PlaneGeometry(10, 5, 10);
        const vidMat = new THREE.MeshBasicMaterial({
            map: vidTex,
            side: DoubleSide
        })
        const vidCube = new THREE.Mesh(vidGeo, vidMat);
        vidCube.position.set(0, 2.5, -3)
        scene.add(vidCube)

        const geometry = new THREE.PlaneGeometry(100, 100, 100);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2
        scene.add(plane);

        let mixer: THREE.AnimationMixer
      
        const loader = new GLTFLoader()
        loader.load(
            './model/Azul_10s.glb',
            function (gltf) {
                mixer = new THREE.AnimationMixer(gltf.scene)
                const clips = gltf.animations;
                const clip = THREE.AnimationClip.findByName(clips, 'Take 001.001 Retarget');
                const action = mixer.clipAction(clip)
                action.clampWhenFinished = true;
                action.setLoop(THREE.LoopOnce, 1)
                action.play();

                gltf.scene.traverse(function (child) {
                    // if ((child as THREE.Mesh).isMesh) {
                    //     const m = child as THREE.Mesh
                    //     m.receiveShadow = true
                    //     m.castShadow = true
                    // }
                    // if ((child as THREE.Light).isLight) {
                    //     const l = child as THREE.Light
                    //     l.castShadow = true
                    //     l.shadow.bias = 0
                    //     l.shadow.mapSize.width = 0
                    //     l.shadow.mapSize.height = 0
                    // }
                })
                gltf.scene.scale.set(1, 1, 1)
                scene.add(gltf.scene)
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )





        const controls = new OrbitControls(camera, renderer.domElement)
        controls.addEventListener('change', render)

        // const geometry = new THREE.BoxGeometry()
        // const material = new THREE.MeshBasicMaterial({
        //     color: 0x00ff00,
        //     wireframe: true,
        // })

        // const cube = new THREE.Mesh(geometry, material)
        // scene.add(cube)

        // window.addEventListener('resize', onWindowResize, false)
        // function onWindowResize() {
        //     camera.aspect = window.innerWidth / window.innerHeight
        //     camera.updateProjectionMatrix()
        //     renderer.setSize(window.innerWidth, window.innerHeight)
        //     render()
        // }
        const clock = new THREE.Clock()

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;

				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

				render()
        }
        function animate() {

            requestAnimationFrame(animate)
            if (mixer)

                mixer.update(clock.getDelta())


            // cube.rotation.x += 0.01
            // cube.rotation.y += 0.01

            render()
        }

        function render() {
            renderer.render(scene, camera)

        }

        animate()
        // render()

    }
    render() {
        return <div />;
    }
}
export default TestOne;
