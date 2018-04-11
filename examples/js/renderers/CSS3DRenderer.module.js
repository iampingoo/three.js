import { Object3D, PerspectiveCamera, Scene, REVISION, Matrix4, Vector3  } from '../three.module.js';
class CSS3DObject extends Object3D {
    constructor( element ) {
        super();
        this.element                = element;
        this.element.style.position = 'absolute';

        this.addEventListener( 'removed', () => {
            if ( this.element.parentNode !== null ) {
                this.element.parentNode.removeChild( this.element );
            }
        } );
    }
};

class CSS3DSprite extends CSS3DObject {
    constructor() {
        super();
    }
};

class CSS3DRenderer extends Object {
    constructor() {
        super();

        console.log( 'class CSS3DRenderer', REVISION );

        this.matrix = new Matrix4();

        this.cache = {
            camera: { fov: 0, style: '' },
            objects: {}
        };

        this.domElement = document.createElement( 'div' );
        this.domElement.style.overflow = 'hidden';

        this.cameraElement = document.createElement( 'div' );
        this.cameraElement.style.WebkitTransformStyle    = 'preserve-3d';
        this.cameraElement.style.MozTransformStyle       = 'preserve-3d';
        this.cameraElement.style.transformStyle          = 'preserve-3d';

        this.domElement.appendChild( this.cameraElement );

        this.isIE = /Trident/i.test( navigator.userAgent );

        this.getSize = () => {
            return {
                width: this._width,
                height: this._height
            };
        };

        this.setSize = ( width, height ) => {

            this._width         = width;
            this._height        = height;
            this._widthHalf     = this._width / 2;
            this._heightHalf    = this._height / 2;

            this.domElement.style.width  = width + 'px';
            this.domElement.style.height = height + 'px';

            this.cameraElement.style.width   = width + 'px';
            this.cameraElement.style.height  = height + 'px';
        };

        CSS3DRenderer.prototype.epsilon = function( value ) {
            return Math.abs( value ) < 1e-10 ? 0 : value;
        }

        CSS3DRenderer.prototype.getCameraCSSMatrix = function( matrix ) {
            this.elements = matrix.elements;

            return 'matrix3d(' +
                this.epsilon( this.elements[ 0 ] ) + ',' +
                this.epsilon( - this.elements[ 1 ] ) + ',' +
                this.epsilon( this.elements[ 2 ] ) + ',' +
                this.epsilon( this.elements[ 3 ] ) + ',' +
                this.epsilon( this.elements[ 4 ] ) + ',' +
                this.epsilon( - this.elements[ 5 ] ) + ',' +
                this.epsilon( this.elements[ 6 ] ) + ',' +
                this.epsilon( this.elements[ 7 ] ) + ',' +
                this.epsilon( this.elements[ 8 ] ) + ',' +
                this.epsilon( - this.elements[ 9 ] ) + ',' +
                this.epsilon( this.elements[ 10 ] ) + ',' +
                this.epsilon( this.elements[ 11 ] ) + ',' +
                this.epsilon( this.elements[ 12 ] ) + ',' +
                this.epsilon( - this.elements[ 13 ] ) + ',' +
                this.epsilon( this.elements[ 14 ] ) + ',' +
                this.epsilon( this.elements[ 15 ] ) +
            ')';

        }

        CSS3DRenderer.prototype.getObjectCSSMatrix = function( matrix, cameraCSSMatrix ) {
            this.elements = matrix.elements;
            this.matrix3d = 'matrix3d(' +
                this.epsilon( this.elements[ 0 ] ) + ',' +
                this.epsilon( this.elements[ 1 ] ) + ',' +
                this.epsilon( this.elements[ 2 ] ) + ',' +
                this.epsilon( this.elements[ 3 ] ) + ',' +
                this.epsilon( - this.elements[ 4 ] ) + ',' +
                this.epsilon( - this.elements[ 5 ] ) + ',' +
                this.epsilon( - this.elements[ 6 ] ) + ',' +
                this.epsilon( - this.elements[ 7 ] ) + ',' +
                this.epsilon( this.elements[ 8 ] ) + ',' +
                this.epsilon( this.elements[ 9 ] ) + ',' +
                this.epsilon( this.elements[ 10 ] ) + ',' +
                this.epsilon( this.elements[ 11 ] ) + ',' +
                this.epsilon( this.elements[ 12 ] ) + ',' +
                this.epsilon( this.elements[ 13 ] ) + ',' +
                this.epsilon( this.elements[ 14 ] ) + ',' +
                this.epsilon( this.elements[ 15 ] ) +
            ')';

            if ( this.isIE ) {
                return 'translate(-50%,-50%)' +
                    'translate(' + this._widthHalf + 'px,' + this._heightHalf + 'px)' +
                    cameraCSSMatrix +
                    this.matrix3d;
            }

            return 'translate(-50%,-50%)' + this.matrix3d;
        }

        CSS3DRenderer.prototype.renderObject = function( object, camera, cameraCSSMatrix ) {

            if ( object instanceof CSS3DObject ) {

                let style;

                if ( object instanceof CSS3DSprite ) {

                    // http://swiftcoder.wordpress.com/2008/11/25/constructing-a-billboard-matrix/

                    this.matrix.copy( camera.matrixWorldInverse );
                    this.matrix.transpose();
                    this.matrix.copyPosition( object.matrixWorld );
                    this.matrix.scale( object.scale );

                    this.matrix.elements[ 3 ] = 0;
                    this.matrix.elements[ 7 ] = 0;
                    this.matrix.elements[ 11 ] = 0;
                    this.matrix.elements[ 15 ] = 1;

                    style = this.getObjectCSSMatrix( this.matrix, cameraCSSMatrix );

                } else {

                    style = this.getObjectCSSMatrix( object.matrixWorld, cameraCSSMatrix );

                }

                const element = object.element;
                const cachedStyle = this.cache.objects[ object.id ] && this.cache.objects[ object.id ].style;

                if ( cachedStyle === undefined || cachedStyle !== style ) {

                    element.style.WebkitTransform = style;
                    element.style.MozTransform = style;
                    element.style.transform = style;

                    this.cache.objects[ object.id ] = { style: style };

                    if ( this.isIE ) {
                        this.cache.objects[ object.id ].distanceToCameraSquared = getDistanceToSquared( camera, object );
                    }
                }

                if ( element.parentNode !== this.cameraElement ) {
                    this.cameraElement.appendChild( element );
                }
            }

            for ( var i = 0, l = object.children.length; i < l; i ++ ) {
                this.renderObject( object.children[ i ], camera, cameraCSSMatrix );
            }

        }

        CSS3DRenderer.prototype.getDistanceToSquared = function () {

            const a = new Vector3();
            const b = new Vector3();

            return function ( object1, object2 ) {

                a.setFromMatrixPosition( object1.matrixWorld );
                b.setFromMatrixPosition( object2.matrixWorld );

                return a.distanceToSquared( b );

            };

        }();

        CSS3DRenderer.prototype.zOrder = function ( scene ) {

            const order = Object.keys( this.cache.objects ).sort( ( a, b ) => {

                return this.cache.objects[ a ].distanceToCameraSquared - this.cache.objects[ b ].distanceToCameraSquared;

            } );
            const zMax = order.length;

            scene.traverse( ( object ) => {

                const index = order.indexOf( object.id + '' );

                if ( index !== - 1 ) {
                    object.element.style.zIndex = zMax - index;
                }
            } );
        }

        this.render = ( scene, camera ) => {

            const fov = camera.projectionMatrix.elements[ 5 ] * this._heightHalf;

            if ( this.cache.camera.fov !== fov ) {
                this.domElement.style.WebkitPerspective = fov + 'px';
                this.domElement.style.MozPerspective = fov + 'px';
                this.domElement.style.perspective = fov + 'px';

                this.cache.camera.fov = fov;
            }

            scene.updateMatrixWorld();

            if ( camera.parent === null ) camera.updateMatrixWorld();

            const cameraCSSMatrix = 'translateZ(' + fov + 'px)' +
                this.getCameraCSSMatrix( camera.matrixWorldInverse );

            const style = cameraCSSMatrix +
                'translate(' + this._widthHalf + 'px,' + this._heightHalf + 'px)';

            if ( this.cache.camera.style !== style && ! this.isIE ) {
                this.cameraElement.style.WebkitTransform = style;
                this.cameraElement.style.MozTransform = style;
                this.cameraElement.style.transform = style;

                this.cache.camera.style = style;
            }

            this.renderObject( scene, camera, cameraCSSMatrix );

            if ( this.isIE ) {

                // IE10 and 11 does not support 'preserve-3d'.
                // Thus, z-order in 3D will not work.
                // We have to calc z-order manually and set CSS z-index for IE.
                // FYI: z-index can't handle object intersection
                this.zOrder( scene );

            }

        };

    };
}

export { CSS3DObject, CSS3DSprite, CSS3DRenderer };