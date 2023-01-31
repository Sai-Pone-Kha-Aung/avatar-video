import React from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { BVHLoader } from "three/examples/jsm/loaders/BVHLoader";

let defaultSettings = {
    distanceToMovieScreen: 130,
    isFullScreen: true,
    movieScreenSize: { w: 400, h: 240 }
},
    settings: any = defaultSettings;

interface IProps {
    motionURL: string;
    motionType: string;
    videoURL: string;
    showVideo: boolean;
}

interface IState {
    loading: boolean;
    playing: boolean;
    stopped: boolean;
    progress: number;
    videoDuration: number;
    isEnd: boolean;
    currentDuration: number;
}

class View extends React.Component {
    private scene?: THREE.Scene;
    private myref: React.RefObject<HTMLDivElement>;
    constructor(props: IProps) {
        super(props);
        this.myref = React.createRef();
        this.state = {
            loading: true,
            playing: false,
            stopped: true,
            progress: 0,
            isEnd: false,
            videoDuration: 0,
            currentDuration: 0,

        };
    }
    componentDidMount() {
        
        
        this.scene = new THREE.Scene();
        const renderer = new THREE.WebGL1Renderer();
        const container = this.myref.current;
        const rect = container?.getBoundingClientRect();

        if (
            rect === undefined ||
            rect.width === undefined ||
            rect.height === undefined
        ) {
            return;
        }

        const width = rect?.width;
        const height = rect?.height;
        const camera = new THREE.PerspectiveCamera(
            25,
            width / height,
            1,
            2000
        );

        camera.position.set(0, 150, 600);

        this.scene.background = new THREE.Color(0x0);
        this.scene.fog = new THREE.Fog(0x0, 800, 1500);

        const hemilight = new THREE.HemisphereLight(0xffffff, 0x444444);
        hemilight.position.set(0, 300, 0);
        this.scene.add(hemilight);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(2000, 2000),
            new THREE.MeshPhongMaterial({ color: 0x262424, depthWrite: false })
        );

        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const grid: any = new THREE.GridHelper(2000, 20, 0xffffff, 0xffffff);
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add(grid);

        renderer.render(this.scene, camera);

    

    }
    render() {
        return (
            <div />
        )
    }
}
export default View

export { }