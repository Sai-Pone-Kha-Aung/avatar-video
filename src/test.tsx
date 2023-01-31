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

type IProps  = {
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

class Avatar extends React.Component<IProps, IState> {
    private camera?: THREE.PerspectiveCamera;
    private scene?: THREE.Scene;
    private renderer?: THREE.WebGLRenderer;
    private controls?: any;
    private model?: any;
    private width?: number;
    private height?: number;
    private oldAzimuth?: any;
    private clock?: any;
    private mixer?: any;
    private animator?: any;
    private video?: any;
    private videoTexture?: any;
    private movieScreen?: any;
    private object?: any;

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

    async componentDidMount() {
        this.oldAzimuth = 0;
        this.clock = new THREE.Clock();

        const container = this.myref.current;
        const rect = container?.getBoundingClientRect();

        if (
            rect === undefined ||
            rect.width === undefined ||
            rect.height === undefined
        ) {
            return;
        }

        this.width = rect?.width;
        this.height = rect?.height;
        this.camera = new THREE.PerspectiveCamera(
            25,
            this.width / this.height,
            1,
            2000
        );
        this.camera.position.set(0, 150, 600);
        this.scene = new THREE.Scene();
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

        if (this.props.motionType === 'fbx') {
            this.loadFBX();
        } else if (this.props.motionType === 'glb') {
            this.loadGLB();
        } else if (this.props.motionType === ' bvh') {
            this.loadBVH();
        }

    }
    async loadGLB() {
        const loader = new GLTFLoader();
        loader.load(this.props.motionURL, async (object: any) => {
            if (
                this.scene === undefined ||
                this.camera === undefined ||
                this.width === undefined ||
                this.height === undefined
            ) {
                return;
            }

            if (this.model) {
                this.scene?.remove(this.model);
            }
            if (settings.scale) {
                object.scene.scale.set(settings.scale, settings.scale, settings.scale);
            }

            for (let i in object.scnen.children) {
                if (
                    object.scene.children[i].material &&
                    object.scene.children[i].material.metalness
                ) {
                    object.scene.children[i].material.metalness = 0;
                }
            }

            this.model = object;
            this.object = object
            this.scene.add(object.scnen);

            const mixer = new THREE.AnimationMixer(object.scnen);
            const action = mixer.clipAction(object.animation[0]);
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            this.mixer = mixer;

            this.resetState();
            this.loadVideo();
        });
    }

    async loadFBX() {
        const loader = new FBXLoader();

        loader.load(this.props.motionURL, async (object: any) => {
            if (
                this.scene === undefined ||
                this.camera === undefined ||
                this.width === undefined ||
                this.height === undefined
            ) {
                return;
            }

            if (this.model) {
                this.scene?.remove(this.model);
            }
            this.model = object;
            this.mixer = new THREE.AnimationMixer(object);

            this.animator = this.mixer.clipAction(object.animations[0]);
            this.animator.setLoop(THREE.LoopOnce);
            this.animator.clampWhenFinished = true;

            if (settings.scale) {
                object.scale.set(settings.scale, settings.scale, settings.scale);
            }

            object.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.scene?.add(object);

            this.animator.paused = true;
            this.animator.stop();

            this.resetState();
            this.loadVideo();
        })
    }

    async loadBVH() {
        const loader = new BVHLoader();

        loader.load(this.props.motionURL, async (object: any) => {

            if (
                this.scene === undefined ||
                this.camera === undefined ||
                this.width === undefined ||
                this.height === undefined
            ) {
                return;
            }

            if (this.model) {
                this.scene?.remove(this.model);
            }

            let skeletonHelper: any = new THREE.SkeletonHelper(
                object.skeleton.bones[0]
            );

            skeletonHelper.skeleton = object.skeleton;

            const boneContainer = new THREE.Group();
            boneContainer.add(object.skeleton.bones[0]);

            this.scene.add(skeletonHelper);
            this.scene.add(boneContainer);

            this.resetState();
            this.loadVideo();

        });
    }

    async loadVideo() {
        if (
            this.scene === undefined ||
            this.camera === undefined ||
            this.width === undefined ||
            this.height === undefined
        )
            return;
        this.video = document.createElement('video');
        this.video.crossOrigin = 'anonymous';
        this.video.setAttribute('playsinline', '');
        this.video.muted = 'true';
        this.video.type = 'video/mp4';
        this.video.onplay = () => {
            if (this.state.isEnd) {
                this.mixer.setTime(0);
                this.setState({ isEnd: false });
            }
            if (this.props.motionType === 'fbx') {
                this.animator.play();
                this.animator.paused = false;
            } else if (this.props.motionType === 'glb') {
                this.mixer
                    .clipAction(this.object.animations[0])
                    .setEffectiveWeight(1.0)
                    .play();
                this.mixer.clipAction(this.object.animations[0]).paused = false;
                this.mixer.clipAction(this.object.animations[0]).play();
            } else {
                this.mixer
                    .clipAction(this.object.clip)
                    .setEffectiveWeight(1.0)
                    .play();
                this.mixer.clipAction(this.object.clip).paused = false;
            }
        };

        this.video.onpause = () => {
            if (this.props.motionType === 'fbx') {
                this.animator.pause = true;
            } else if (this.props.motionType === 'glb') {
                this.mixer.clipAction(this.object.animation[0]).paused = true;
            } else {
                this.mixer.clipAction(this.object.clip).paused = true;
            }
        };

        this.video.onloadmetadata = async () => {
            this.videoTexture = new THREE.VideoTexture(this.video);
            this.videoTexture.minFiler = THREE.LinearFilter;
            this.videoTexture.magFiler = THREE.LinearFilter;

            let videoSize = settings.movieScreenSize;
            if (this.video !== undefined) {
                videoSize.w = (this.video.videoWidth * videoSize.h) / this.video.videoHeight;
            }

            if (!this.props.showVideo) {
                videoSize.w = 0;
                videoSize.h = 0;
            }

            if (
                this.scene === undefined ||
                this.camera === undefined ||
                this.width === undefined ||
                this.height === undefined
            ) {
                return;
            }
            let movieMaterial = new THREE.MeshBasicMaterial({
                map: this.videoTexture,
                side: THREE.DoubleSide
            });
            let movieGeometry = new THREE.PlaneGeometry(videoSize.w, videoSize.h);
            this.movieScreen = new THREE.Mesh(movieGeometry, movieMaterial);
            this.movieScreen.position.set(
                0,
                videoSize.h / 2,
                -settings.distanceToMovieScreen
            );
            this.scene.add(this.movieScreen);

            this.resetState();

            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(this.width, this.height);
            this.renderer.shadowMap.enabled = true;

            this.myref.current?.appendChild(this.renderer.domElement);

            this.renderer.render(this.scene, this.camera);

            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.target.set(0, 100, 0);
            this.controls.update();

            this.setState({
                loading: false,
                videoDuration: Math.floor(this.video.duration)
            });

            window.addEventListener('resize', this.onWindowResize);
            this.animate();


        };
        this.video.ontimeUpdate = (e: any) => {
            this.setState({
                currentDuration: Math.floor(this.video.currentTime),
                progress: Math.round(
                    (Math.floor(this.video.currentTime) / this.state.videoDuration) * 100
                )
            });
        };

        this.video.onended = () => {
            this.setState({
                playing: false,
                isEnd: true
            });
        }
        const redirect = await fetch(this.props.videoURL, { method: 'HEAD' });
        this.video.src = redirect.url;
        this.video.load();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onWindowResize);
    }

    componentDidUpader() {
        this.onWindowResize();
    }

    onWindowResize = () => {
        if (this.camera !== undefined && this.renderer !== undefined) {
            const container = this.myref.current;

            this.width = container?.clientWidth;
            this.height = container?.clientHeight;
            this.camera.aspect = parseFloat(`${this.width}`) / parseFloat(`${this.height}`);
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(
                parseFloat(`${this.width}`),
                parseFloat(`${this.height}`)
            );
        }
    };

    animate = () => {
        if (this.scene === undefined || this.camera === undefined) {
            return;
        }
        requestAnimationFrame(this.animate);

        if (this.clock !== undefined) {
            const delta = this.clock.getDelta();
            if (this.mixer) this.mixer.update(delta);
            this.renderer?.render(this.scene, this.camera);
        };

    }

    alignMovieScreen = () => {
        if (this.camera !== undefined) {
            const origin_point = this.camera.position.clone();
            origin_point.y = 0;
            const newpos = new THREE.Vector3();
            const angle = Math.atan2(origin_point.z, origin_point.x);
            newpos.x = settings.distanceToMovieScreen * Math.cos(angle);
            newpos.z = settings.distanceToMovieScreen * Math.sin(angle);
            newpos.y = this.movieScreen.position.y;
            this.movieScreen.position.copy(newpos);
            const a_delta = this.controls.getAzimuthalAngel();
            this.movieScreen.rotateY(a_delta);
        }
    }

    resetState = () => {
        if (this.props.motionType === 'fbx') {
            if (this.animator) {
                this.animator.paused = true;
                this.animator.stop();
            }
        } else if (this.props.motionType === 'glb') {
            this.mixer.clipAction(this.object.animation[0].paused = true)
        } else {
            this.mixer.clipAction(this.object.clip).paused = true;
            this.mixer.clipAction(this.object.clip).stop();
        }
        if (this.video) {
            this.video.pause();
            this.video.currentTime = 0;
        }
        this.setState({
            currentDuration: 0
        });
    };

    playAnimation = () => {
        this.video.muted = true;
        this.video.play();
        this.setState({
            playing: true
        });
    }

    stopAnimation = () => {
        this.video.pause();
        this.setState({
            playing: false
        })
    }

    zoomOut = () => {
        if (this.camera) {
            if (this.camera.zoom > 1) {
                this.camera.zoom--;
                this.camera.updateProjectionMatrix();
            }
        }
    };

    zoomIn = () => {
        if (this.camera) {
            this.camera.zoom++;
            this.camera.updateProjectionMatrix();
        }
    };

    skipTo = (e: any) => {
        this.stopAnimation();
        const { name, value }: { name: string; value: string } = e.currentTarget;
        this.setState({ [name]: value } as Pick<any, any>);
        let seekTo = Math.round((this.state.videoDuration / 100) * parseInt(value));
        this.mixer.setTime(seekTo);
        this.video.currentTime = seekTo;
        this.playAnimation();
    }

    render() {
        return (
            <>
              <div className="three3dViewer" ref={this.myref}>
                {!this.state.loading && (
                  <div className="mediaControlRoot">
                    <button
                      className="mediaControl"
                      onClick={
                        this.state.playing ? this.stopAnimation : this.playAnimation
                      }
                    >
                      {/* {this.state.playing ? (
                        <Icon name="pause" />
                      ) : (
                        <Icon name="play" />
                      )} */}
                    </button>
                    <div className="progressControl">
                      <div className="duration">
                        {(
                          '0' + Math.floor(this.state.currentDuration / 60).toString()
                        ).slice(-2)}
                        :
                        {(
                          '0' + Math.floor(this.state.currentDuration % 60).toString()
                        ).slice(-2)}
                        /
                        {(
                          '0' + Math.floor(this.state.videoDuration / 60).toString()
                        ).slice(-2)}
                        :
                        {(
                          '0' + Math.floor(this.state.videoDuration % 60).toString()
                        ).slice(-2)}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={this.state.progress}
                        name="progress"
                        onChange={this.skipTo}
                      />
                    </div>
                    <div className="zoomControl">
                      {/* <button className="zoomAction" onClick={this.zoomOut}>
                        <Icon name="minus" />
                      </button>
                      <button className="zoomAction" onClick={this.zoomIn}>
                        <Icon name="plus" />
                      </button> */}
                    </div>
                  </div>
                )}
                {this.state.loading && (
                  <div className="viewerLoading">Loading ...</div>
                )}
              </div>
            </>
          );
        }
    }


export default Avatar

