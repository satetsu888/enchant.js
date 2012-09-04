/**
 * enchant.js v0.5.0
 *
 * Copyright (c) Ubiquitous Entertainment Inc.
 * Dual licensed under the MIT or GPL Version 3 licenses
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

if (typeof Object.defineProperty != 'function') {
    Object.defineProperty = function(obj, prop, desc) {
        if ('value' in desc) obj[prop] =  desc.value;
        if ('get' in desc) obj.__defineGetter__(prop, desc.get);
        if ('set' in desc) obj.__defineSetter__(prop, desc.set);
        return obj;
    };
}
if (typeof Object.defineProperties != 'function') {
    Object.defineProperties = function(obj, descs) {
        for (var prop in descs) if (descs.hasOwnProperty(prop))  {
            Object.defineProperty(obj, prop, descs[prop]);
        }
        return obj;
    };
}
if (typeof Object.create != 'function') {
    Object.create = function(prototype, descs) {
        function F() {};
        F.prototype = prototype;
        var obj = new F();
        if (descs != null) Object.defineProperties(obj, descs);
        return obj;
    };
}
if (typeof Object.getPrototypeOf != 'function') {
    Object.getPrototypeOf = function(obj) {
        return obj.__proto__;
    };
}

/**
 * Export library classes globally.
 *
 * When no arguments are delivered, all classes defined in enchant.js as well as all classes defined in  * plugins will be exported. When more than one argument is delivered, by default only classes defined  * in enchant.js will be exported. When you wish to export plugin classes you must explicitly deliver  *  * plugin identifiers as arguments.
 *
 * @example
 *   enchant();     // All classes will be exported.
 *   enchant('');   // Only classes in enchant.js will be exported.
 *   enchant('ui'); // enchant.js classes and ui.enchant.js classes will be exported.
 *
 * @param {...String} [modules] Export module. Multiple designations possible.
 */
var enchant = function(modules) {
    if (modules != null) {
        if (!(modules instanceof Array)) {
            modules = Array.prototype.slice.call(arguments);
        }
        modules = modules.filter(function(module) {
            return [module].join();
        });
    }

    (function include(module, prefix) {
        var submodules = [];
        for (var prop in module) if (module.hasOwnProperty(prop)) {
            if (typeof module[prop] == 'function') {
                window[prop] = module[prop];
            } else if (Object.getPrototypeOf(module[prop]) == Object.prototype) {
                if (modules == null) {
                    submodules.push(prop);
                } else {
                    i = modules.indexOf(prefix + prop);
                    if (i != -1) {
                        submodules.push(prop);
                        modules.splice(i, 1);
                    }
                }
            }
        }
        for (var i = 0, len = submodules.length; i < len; i++) {
            include(module[submodules[i]], prefix + submodules[i] + '.');
        }
    })(enchant, '');

    if (modules != null && modules.length) {
        throw new Error('Cannot load module: ' + modules.join(', '));
    }
};

(function() {

"use strict";

var VENDER_PREFIX = (function() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Opera') != -1) {
        return 'O';
    } else if (ua.indexOf('MSIE') != -1) {
        return 'ms';
    } else if (ua.indexOf('WebKit') != -1) {
        return 'webkit';
    } else if (navigator.product == 'Gecko') {
        return 'Moz';
    } else {
        return '';
    }
})();
var TOUCH_ENABLED = (function() {
    var div = document.createElement('div');
    div.setAttribute('ontouchstart', 'return');
    return typeof div.ontouchstart == 'function';
})();
var RETINA_DISPLAY = (function() {
    if (navigator.userAgent.indexOf('iPhone') != -1 && window.devicePixelRatio == 2) {
        var viewport = document.querySelector('meta[name="viewport"]');
        if (viewport == null) {
            viewport = document.createElement('meta');
            document.head.appendChild(viewport);
        }
        viewport.setAttribute('content', 'width=640px');
        return true;
    } else {
        return false;
    }
})();

// the running instance
var game;

/**
 * Class Classes
 *
 * @param {Function} [superclass] Successor class.
 * @param {*} definition Class definition.
 * @constructor
 */
enchant.Class = function(superclass, definition) {
    return enchant.Class.create(superclass, definition);
};

/**
 * Create class.
 *
 * When making classes that succeed other classes, the previous class is used as a base with
 * constructor as default. In order to override the constructor, it is necessary to explicitly
 * call up the previous constructor to use it. 
 *
 * @example
 *   var Ball = Class.create({ // Creates independent class.
 *       initialize: function(radius) { ... }, // Method definition.
 *       fall: function() { ... }
 *   });
 *
 *   var Ball = Class.create(Sprite);  // Creates a class succeeding "Sprite"
 *   var Ball = Class.create(Sprite, { // Creates a class succeeding "Sprite"
 *       initialize: function(radius) { // Overwrites constructor
 *          Sprite.call(this, radius*2, radius*2); // Applies previous constructor.
 *          this.image = game.assets['ball.gif'];
 *       }
 *   });
 *
 * @param {Function} [superclass] Preceding class.
 * @param {*} [definition] Class definition.
 * @static
 */
enchant.Class.create = function(superclass, definition) {
    if (arguments.length == 0) {
        return enchant.Class.create(Object, definition);
    } else if (arguments.length == 1 && typeof arguments[0] != 'function') {
        return enchant.Class.create(Object, arguments[0]);
    }

    for (var prop in definition) if (definition.hasOwnProperty(prop)) {
        if (Object.getPrototypeOf(definition[prop]) == Object.prototype) {
            if (!('enumerable' in definition[prop])) definition[prop].enumerable = true;
        } else {
            definition[prop] = { value: definition[prop], enumerable: true, writable: true };
        }
    }
    var constructor = function() {
        if (this instanceof constructor) {
            constructor.prototype.initialize.apply(this, arguments);
        } else {
            return new constructor();
        }
    };
    constructor.prototype = Object.create(superclass.prototype, definition);
    constructor.prototype.constructor = constructor;
    if (constructor.prototype.initialize == null) {
        constructor.prototype.initialize = function() {
            superclass.apply(this, arguments);
        };
    }

    return constructor;
};

/**
 * @scope enchant.Event.prototype
 */
enchant.Event = enchant.Class.create({
    /**
     * A class for independent event implementation like DOM Events.
     * However, does not include phase concept.
     * @param {String} type Event type.
     * @constructs
     */
    initialize: function(type) {
        /**
         * Event type.
         * @type {String}
         */
        this.type = type;
        /**
         * Event target.
         * @type {*}
         */
        this.target = null;
        /**
         * Event occurrence's x coordinates.
         * @type {Number}
         */
        this.x = 0;
        /**
         * Event occurrence's y coordinates.
         * @type {Number}
         */
        this.y = 0;
        /**
         * X coordinates for event occurrence standard event-issuing object.
         * @type {Number}
         */
        this.localX = 0;
        /**
         * Y coordinates for event occurrence standard event-issuing object.
         * @type {Number}
         */
        this.localY = 0;
    },
    _initPosition: function(pageX, pageY) {
        this.x = this.localX = (pageX - game._pageX) / game.scale;
        this.y = this.localY = (pageY - game._pageY) / game.scale;
    }
});

/**
 * Event activated upon completion of game loading.
 *
 * It is necessary to wait for loading to finish and to do initial processing when preloading images.
 * Issued object: enchant.Game
 *
 * @example
 *   var game = new Game(320, 320);
 *   game.preload('player.gif');
 *   game.onload = function() {
 *      ... // Describes initial game processing
 *   };
 *   game.start();
 *
 * @type {String}
 */
enchant.Event.LOAD = 'load';

/**
 * Events occurring during game loading.
 * Activated each time a preloaded image is loaded. Issued object: enchant.Game
 * @type {String}
 */
enchant.Event.PROGRESS = 'progress';

/**
 * Events occurring during frame start.
 * Issued object: enchant.Game, enchant.Node
 * @type {String}
 */
enchant.Event.ENTER_FRAME = 'enterframe';

/**
 * Events occurring during frame end.
 * Issued object: enchant.Game
 * @type {String}
 */
enchant.Event.EXIT_FRAME = 'exitframe';

/**
 * Events occurring during Scene beginning.
 * Issued object: enchant.Scene
 * @type {String}
 */
enchant.Event.ENTER = 'enter';

/**
 * Events occurring during Scene end.
 * Issued object: enchant.Scene
 * @type {String}
 */
enchant.Event.EXIT = 'exit';

/**
 * Event occurring when Node is added to Group.
 * Issued object: enchant.Node
 * @type {String}
 */
enchant.Event.ADDED = 'added';

/**
 * Event occurring when Node is added to Scene.
 * Issued object: enchant.Node
 * @type {String}
 */
enchant.Event.ADDED_TO_SCENE = 'addedtoscene';

/**
 * Event occurring when Node is deleted from Group.
 * Issued object: enchant.Node
 * @type {String}
 */
enchant.Event.REMOVED = 'removed';

/**
 * Event occurring when Node is deleted from Scene.
 * Issued object: enchant.Node
 * @type {String}
 */
enchant.Event.REMOVED_FROM_SCENE = 'removedfromscene';

/**
 * Event occurring when touch corresponding to Node has begun.
 * Click is also treated as touch. Issued object: enchant.Node
 * @type {String}
 */
enchant.Event.TOUCH_START = 'touchstart';

/**
 * Event occurring when touch corresponding to Node has been moved.
 * Click is also treated as touch. Issued object: enchant.Node
 * @type {String}
 */
enchant.Event.TOUCH_MOVE = 'touchmove';

/**
 * Event occurring when touch corresponding to touch has ended.
 * Click is also treated as touch. Issued object: enchant.Node
 * @type {String}
 */
enchant.Event.TOUCH_END = 'touchend';

/**
 * Event occurring when Entity is rendered.
 * Issued object: enchant.Entity
 * @type {String}
 */
enchant.Event.RENDER = 'render';

/**
 * Event occurring when button is pushed.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.INPUT_START = 'inputstart';

/**
 * Event occurring when button input changes.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.INPUT_CHANGE = 'inputchange';

/**
 * Event occurring when button input ends.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.INPUT_END = 'inputend';

/**
 * Event occurring when left button is pushed.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.LEFT_BUTTON_DOWN = 'leftbuttondown';

/**
 * Event occurring when left button is released.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.LEFT_BUTTON_UP = 'leftbuttonup';

/**
 * Event occurring when right button is pushed.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.RIGHT_BUTTON_DOWN = 'rightbuttondown';

/**
 * Event occurring when right button is released.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.RIGHT_BUTTON_UP = 'rightbuttonup';

/**
 * Even occurring when up button is pushed.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.UP_BUTTON_DOWN = 'upbuttondown';

/**
 * Event occurring when up button is released.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.UP_BUTTON_UP = 'upbuttonup';

/**
 * Event occurring when down button is pushed.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.DOWN_BUTTON_DOWN = 'downbuttondown';

/**
 * Event occurring when down button is released.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.DOWN_BUTTON_UP = 'downbuttonup';

/**
 * Event occurring when a button is pushed.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.A_BUTTON_DOWN = 'abuttondown';

/**
 * Event occurring when a button is released.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.A_BUTTON_UP = 'abuttonup';

/**
 * Event occurring when b button is pushed.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.B_BUTTON_DOWN = 'bbuttondown';

/**
 * Event occurring when b button is released.
 * Issued object: enchant.Game, enchant.Scene
 * @type {String}
 */
enchant.Event.B_BUTTON_UP = 'bbuttonup';


/**
 * @scope enchant.EventTarget.prototype
 */
enchant.EventTarget = enchant.Class.create({
    /**
     * A class for independent event implementation like DOM Events.
     * However, does not include phase concept.
     * @constructs
     */
    initialize: function() {
        this._listeners = {};
    },
    /**
     * Add EventListener.
     * @param {String} type Event type.
     * @param {function(e:enchant.Event)} listener EventListener added.
     */
    addEventListener: function(type, listener) {
        var listeners = this._listeners[type];
        if (listeners == null) {
            this._listeners[type] = [listener];
        } else if (listeners.indexOf(listener) == -1) {
            listeners.unshift(listener);
            
        }
    },
    /**
     * Delete EventListener.
     * @param {String} type Event type.
     * @param {function(e:enchant.Event)} listener EventListener deleted.
     */
    removeEventListener: function(type, listener) {
        var listeners = this._listeners[type];
        if (listeners != null) {
            var i = listeners.indexOf(listener);
            if (i != -1) {
                listeners.splice(i, 1);
            }
        }
    },
    /**
     * Clear EventListener.
     * @param {String} type Event type.
     */
    clearEventListener: function(type) {
        if(type != null){
            delete this._listeners[type];
        }else{
            this._listeners = {};
        }
    },
    /**
     * Issue event.
     * @param {enchant.Event} e Event issued.
     */
    dispatchEvent: function(e) {
        e.target = this;
        e.localX = e.x - this._offsetX;
        e.localY = e.y - this._offsetY;
        if (this['on' + e.type] != null) this['on' + e.type]();
        var listeners = this._listeners[e.type];
        if (listeners != null) {
            listeners = listeners.slice();
            for (var i = 0, len = listeners.length; i < len; i++) {
                listeners[i].call(this, e);
            }
        }
    }
});

/**
 * @scope enchant.Game.prototype
 */
enchant.Game = enchant.Class.create(enchant.EventTarget, {
    /**
     * Class controlling game main loop, scene.
     *
     * There can be only one instance, and when the constructor is executed
     * with an instance present, the existing item will be overwritten. The existing instance
     * can be accessed from enchant.Game.instance.
     *
     * @param {Number} width Game screen width.
     * @param {Number} height Game screen height.
     * @constructs
     * @extends enchant.EventTarget
     */
    initialize: function(width, height) {
        enchant.EventTarget.call(this);

        var initial = true;
        if (game) {
            initial = false;
            game.stop();
        }
        game = enchant.Game.instance = this;

        /**
         * Game screen width.
         * @type {Number}
         */
        this.width = width || 320;
        /**
         * Game screen height.
         * @type {Number}
         */
        this.height = height || 320;
        /**
         * Game display scaling.
         * @type {Number}
         */
        this.scale = 1;

        var stage = document.getElementById('enchant-stage');
        if (!stage) {
            stage = document.createElement('div');
            stage.id = 'enchant-stage';
            stage.style.width = window.innerWidth + 'px';
            stage.style.height = window.innerHeight + 'px';
            stage.style.position = 'absolute';
            if (document.body.firstChild) {
                document.body.insertBefore(stage, document.body.firstChild);
            } else {
                document.body.appendChild(stage);
            }
            this.scale = Math.min(
               window.innerWidth / this.width,
               window.innerHeight / this.height
            );
            this._pageX = 0;
            this._pageY = 0;
        } else {
            var style = window.getComputedStyle(stage);
            width = parseInt(style.width);
            height = parseInt(style.height);
            if (width && height) {
                this.scale = Math.min(
                   width / this.width,
                   height / this.height
                );
            } else {
                stage.style.width = this.width + 'px';
                stage.style.height = this.height + 'px';
            }
            while (stage.firstChild) {
                stage.removeChild(stage.firstChild);
            }
            stage.style.position = 'relative';
            var bounding = stage.getBoundingClientRect();
            this._pageX = Math.round(window.scrollX + bounding.left);
            this._pageY = Math.round(window.scrollY + bounding.top);
        }
        if (!this.scale) this.scale = 1;
        stage.style.fontSize = '12px';
        stage.style.webkitTextSizeAdjust = 'none';
        this._element = stage;

        /**
         * Game frame rate.
         * @type {Number}
         */
        this.fps = 30;
        /**
         * Number of frames from game start.
         * @type {Number}
         */
        this.frame = 0;
        /**
         * Game executability (valid or not). 
         * @type {Boolean}
         */
        this.ready = null;
        /**
         * Game execution state (valid or not).
         * @type {Boolean}
         */
        this.running = false;
        /**
         * Object saved as loaded image path key.
         * @type {Object.<String, Surface>}
         */
        this.assets = {};
        var assets = this._assets = [];
        (function detectAssets(module) {
            if (module.assets instanceof Array) {
                [].push.apply(assets, module.assets);
            }
            for (var prop in module) if (module.hasOwnProperty(prop)) {
                if (Object.getPrototypeOf(module[prop]) == Object.prototype) {
                    detectAssets(module[prop]);
                }
            }
        })(enchant);

        this._scenes = [];
        /**
         * Current Scene. Scene at top of Scene stack.
         * @type {enchant.Scene}
         */
        this.currentScene = null;
        /**
         * Route Scene. Scene at bottom of Scene stack.
         * @type {enchant.Scene}
         */
        this.rootScene = new enchant.Scene();
        this.pushScene(this.rootScene);
        /**
         * Scene displayed during loading.
         * @type {enchant.Scene}
         */
        this.loadingScene = new enchant.Scene();
        this.loadingScene.backgroundColor = '#000';
        var barWidth = this.width * 0.9 | 0;
        var barHeight = this.width * 0.3 | 0;
        var border = barWidth * 0.05 | 0;
        var bar = new enchant.Sprite(barWidth, barHeight);
        bar.x = (this.width - barWidth) / 2;
        bar.y = (this.height - barHeight) / 2;
        var image = new enchant.Surface(barWidth, barHeight);
        image.context.fillStyle = '#fff';
        image.context.fillRect(0, 0, barWidth, barHeight);
        image.context.fillStyle = '#000';
        image.context.fillRect(border, border, barWidth - border*2, barHeight - border*2);
        bar.image = image;
        var progress = 0, _progress = 0;
        this.addEventListener('progress', function(e) {
            progress = e.loaded / e.total;
        });
        bar.addEventListener('enterframe', function() {
            _progress *= 0.9;
            _progress += progress * 0.1;
            image.context.fillStyle = '#fff';
            image.context.fillRect(border, 0, (barWidth - border*2) * _progress, barHeight);
        });
        this.loadingScene.addChild(bar);

        this._mousedownID = 0;
        this._surfaceID = 0;
        this._soundID = 0;
        this._intervalID = null;

        /**
         * Object that saves input conditions for game.
         * @type {Object.<String, Boolean>}
         */
        this.input = {};
        this._keybind = {};
        this.keybind(37, 'left');  // Left Arrow
        this.keybind(38, 'up');    // Up Arrow
        this.keybind(39, 'right'); // Right Arrow
        this.keybind(40, 'down');  // Down Arrow

        var c = 0;
        ['left', 'right', 'up', 'down', 'a', 'b'].forEach(function(type) {
            this.addEventListener(type + 'buttondown', function(e) {
                if (!this.input[type]) {
                    this.input[type] = true;
                    this.dispatchEvent(new enchant.Event((c++) ? 'inputchange' : 'inputstart'));
                }
                this.currentScene.dispatchEvent(e);
            });
            this.addEventListener(type + 'buttonup', function(e) {
                if (this.input[type]) {
                    this.input[type] = false;
                    this.dispatchEvent(new enchant.Event((--c) ? 'inputchange' : 'inputend'));
                }
                this.currentScene.dispatchEvent(e);
            });
        }, this);

        if (initial) {
            document.addEventListener('keydown', function(e) {
                game.dispatchEvent(new enchant.Event('keydown'));
                if ((37 <= e.keyCode && e.keyCode <= 40) || e.keyCode == 32) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                if (!game.running) return;
                var button = game._keybind[e.keyCode];
                if (button) {
                    var e = new enchant.Event(button + 'buttondown');
                    game.dispatchEvent(e);
                }
            }, true);
            document.addEventListener('keyup', function(e) {
                if (!game.running) return;
                var button = game._keybind[e.keyCode];
                if (button) {
                    var e = new enchant.Event(button + 'buttonup');
                    game.dispatchEvent(e);
                }
            }, true);
            if (TOUCH_ENABLED) {
                document.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                }, true);
                document.addEventListener('touchmove', function(e) {
                    e.preventDefault();
                    if (!game.running) e.stopPropagation();
                }, true);
                document.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    if (!game.running) e.stopPropagation();
                }, true);
            } else {
                document.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    game._mousedownID++;
                    if (!game.running) e.stopPropagation();
                }, true);
                document.addEventListener('mousemove', function(e) {
                    e.preventDefault();
                    if (!game.running) e.stopPropagation();
                }, true);
                document.addEventListener('mouseup', function(e) {
                    e.preventDefault();
                    if (!game.running) e.stopPropagation();
                }, true);
            }
        }
    },
    /**
     * Performs file preload.
     *
     * enchant is a file set to execute preload. It is loaded when
     * Game#start is activated. When all files are loaded, load events are activated
     * from Game objects. When an image file is from Game object assets properties,
     * it will as a Surface object, or a Sound object for sound files,
     * and in other cases it will be accessible as string.
     *
     * In addition, because this Surface object used made with enchant.Surface.load,
     * direct object manipulation is not possible. Refer to the items of enchant.Surface.load
     *
     * @example
     *   game.preload('player.gif');
     *   game.onload = function() {
     *      var sprite = new Sprite(32, 32);
     *      sprite.image = game.assets['player.gif']; // Access via path
     *      ...
     *   };
     *   game.start();
     *
     * @param {...String} assets Preload image path. Multiple settings possible.
     */
    preload: function(assets) {
        if (!(assets instanceof Array)) {
            assets = Array.prototype.slice.call(arguments);
        }
        [].push.apply(this._assets, assets);
    },
    /**
     * File loading.
     *
     * @param {String} asset Load file path.
     * @param {Function} [callback] Function called up when file loading is finished.
     */
    load: function(src, callback) {
        if (callback == null) callback = function() {};

        var ext = src.match(/\.\w+$/)[0];
        if (ext) ext = ext.slice(1).toLowerCase();
        switch (ext) {
            case 'jpg':
            case 'gif':
            case 'png':
                game.assets[src] = enchant.Surface.load(src);
                game.assets[src].addEventListener('load', callback);
                break;
            case 'mp3':
            case 'aac':
            case 'm4a':
            case 'wav':
            case 'ogg':
                game.assets[src] = enchant.Sound.load(src, 'audio/' + ext);
                game.assets[src].addEventListener('load', callback);
                break;
            default:
                var req = new XMLHttpRequest();
                req.open('GET', src, true);
                req.onreadystatechange = function(e) {
                    if (req.readyState == 4) {
                        if (req.status != 200 && req.status != 0) {
                            throw new Error(req.status + ': ' + 'Cannot load an asset: ' + src);
                        }

                        var type = req.getResponseHeader('Content-Type') || '';
                        if (type.match(/^image/)) {
                            game.assets[src] = enchant.Surface.load(src);
                            game.assets[src].addEventListener('load', callback);
                        } else if (type.match(/^audio/)) {
                            game.assets[src] = enchant.Sound.load(src, type);
                            game.assets[src].addEventListener('load', callback);
                        } else {
                            game.assets[src] = req.responseText;
                            callback();
                        }
                    }
                };
                req.send(null);
        }
    },
    /**
     * Begin game.
     *
     * Obeying the frame rate set in enchant.Game#fps, the frame in
     * enchant.Game#currentScene will be updated. When a preloaded image is present,
     * loading will begin and the loading screen will be displayed.
     */
    start: function() {
        if (this._intervalID) {
            window.clearInterval(this._intervalID);
        } else if (this._assets.length) {
            if (enchant.Sound.enabledInMobileSafari && !game._touched &&
                VENDER_PREFIX == 'webkit' && TOUCH_ENABLED) {
                var scene = new enchant.Scene();
                scene.backgroundColor = '#000';
                var size = Math.round(game.width / 10);
                var sprite = new enchant.Sprite(game.width, size);
                sprite.y = (game.height - size) / 2;
                sprite.image = new enchant.Surface(game.width, size);
                sprite.image.context.fillStyle = '#fff';
                sprite.image.context.font = (size-1) + 'px bold Helvetica,Arial,sans-serif';
                var width = sprite.image.context.measureText('Touch to Start').width;
                sprite.image.context.fillText('Touch to Start', (game.width - width) / 2, size-1);
                scene.addChild(sprite);
                document.addEventListener('touchstart', function() {
                    game._touched = true;
                    game.removeScene(scene);
                    game.start();
                }, true);
                game.pushScene(scene);
                return;
            }

            var o = {};
            var assets = this._assets.filter(function(asset) {
                return asset in o ? false : o[asset] = true;
            });
            var loaded = 0;
            for (var i = 0, len = assets.length; i < len; i++) {
                this.load(assets[i], function() {
                    var e = new enchant.Event('progress');
                    e.loaded = ++loaded;
                    e.total = len;
                    game.dispatchEvent(e);
                    if (loaded == len) {
                        game.removeScene(game.loadingScene);
                        game.dispatchEvent(new enchant.Event('load'));
                    }
                });
            }
            this.pushScene(this.loadingScene);
        } else {
            this.dispatchEvent(new enchant.Event('load'));
        }
        this.currentTime = Date.now();
        this._intervalID = window.setInterval(function() {
            game._tick()
        }, 1000 / this.fps);
        this.running = true;
    },
    /**
     * Begin game debug mode.
     * 
     * Game debug mode can be set to on even if enchant.Game.instance._debug flag is set to true.
     */
    debug: function() {
        this._debug = true;
        this.start();
    },
    actualFps: {
        get: function(){
            return this._actualFps || this.fps;
        }
    },
    _tick: function() {
        var now = Date.now();
        var e = new enchant.Event('enterframe');
        e.elapsed = now - this.currentTime;
        this.currentTime = now;

        var nodes = this.currentScene.childNodes.slice();
        var push = Array.prototype.push;
        while (nodes.length) {
            var node = nodes.pop();
            node.dispatchEvent(e);
            node.age ++;
            if (node.childNodes) {
                push.apply(nodes, node.childNodes);
            }
        }
        
        this._actualFps = (e.elapsed == 0) ? this.fps : Math.round(1000/e.elapsed * 10)/10;

        this.currentScene.dispatchEvent(e);
        this.dispatchEvent(e);

        this.dispatchEvent(new enchant.Event('exitframe'));
        this.frame++;
    },
    /**
     * Stops game.
     *
     * The frame will not be updated, and player input will not be accepted.
     * Game can be reopened in enchant.Game#start.
     */
    stop: function() {
        if (this._intervalID) {
            window.clearInterval(this._intervalID);
            this._intervalID = null;
        }
        this.running = false;
    },
    /**
     * Stops game.
     *
     * The frame will not be updated, and player input will not be accepted.
     * Game can be reopened in enchant.Game#start.
     */
    pause: function() {
        if (this._intervalID) {
            window.clearInterval(this._intervalID);
            this._intervalID = null;
        }
    },
    /**
     * Resumes game.
     */
    resume: function() {
        this.currentTime = Date.now();
        this._intervalID = window.setInterval(function() {
            game._tick();
        }, 1000 / this.fps);
        this.running = true;
    },
        
    /**
     * Switch to new Scene.
     *
     * Scene is controlled in stack, and the display order also obeys stack order.
     * When enchant.Game#pushScene is executed, Scene can be brought to the top of stack.
     * Frame will be updated to reflect Scene at the top of stack.
     *
     * @param {enchant.Scene} scene Switch to new Scene.
     * @return {enchant.Scene} New Scene.
     */
    pushScene: function(scene) {
        this._element.appendChild(scene._element);
        if (this.currentScene) {
            this.currentScene.dispatchEvent(new enchant.Event('exit'));
        }
        this.currentScene = scene;
        this.currentScene.dispatchEvent(new enchant.Event('enter'));
        return this._scenes.push(scene);
    },
    /**
     * End current Scene, return to previous Scene.
     *
     * Scene is controlled in stack, with display order obeying stack order.
     * When enchant.Game#popScene is activated, the Scene at the top of the stack can be pulled out.
     *
     * @return {enchant.Scene} Ended Scene.
     */
    popScene: function() {
        if (this.currentScene == this.rootScene) {
            return;
        }
        this._element.removeChild(this.currentScene._element);
        this.currentScene.dispatchEvent(new enchant.Event('exit'));
        this.currentScene = this._scenes[this._scenes.length-2];
        this.currentScene.dispatchEvent(new enchant.Event('enter'));
        return this._scenes.pop();
    },
    /**
     * Overwrite current Scene with separate Scene.
     *
     * enchant.Game#popScene, enchant.Game#pushScene are enacted simultaneously.
     *
     * @param {enchant.Scene} scene Replace Scene.
     * @return {enchant.Scene} New Scene.
     */
    replaceScene: function(scene) {
        this.popScene();
        return this.pushScene(scene);
    },
    /**
     * Delete Scene.
     *
     * Deletes Scene from Scene stack.
     *
     * @param {enchant.Scene} scene Delete Scene.
     * @return {enchant.Scene} Deleted Scene.
     */
    removeScene: function(scene) {
        if (this.currentScene == scene) {
            return this.popScene();
        } else {
            var i = this._scenes.indexOf(scene);
            if (i != -1) {
                this._scenes.splice(i, 1);
                this._element.removeChild(scene._element);
                return scene;
            }
        }
    },
    /**
     * Set key binding.
     *
     * Assigns key input to left, right, up, down, a, b button input.
     *
     * @param {Number} key Key code that sets key bind.
     * @param {String} button Assign button.
     */
    keybind: function(key, button) {
        this._keybind[key] = button;
    }
});

/**
 * Current Game instance.
 * @type {enchant.Game}
 * @static
 */
enchant.Game.instance = null;

/**
 * @scope enchant.Node.prototype
 */
enchant.Node = enchant.Class.create(enchant.EventTarget, {
    /**
     * Base class for objects in displayed object tree routed to Scene.
     * Not directly used.
     * @constructs
     * @extends enchant.EventTarget
     */
    initialize: function() {
        enchant.EventTarget.call(this);

        this._x = 0;
        this._y = 0;
        this._offsetX = 0;
        this._offsetY = 0;

        this.age = 0;

        this.animation = new Timeline(this);
        this.addEventListener("enterframe", function(){
            this.animation.tick();
        });

        /**
         * Parent Node for Node.
         * @type {enchant.Group}
         */
        this.parentNode = null;
        /**
         * Scene to which Node belongs.
         * @type {enchant.Scene}
         */
        this.scene = null;

        this.addEventListener('touchstart', function(e) {
            if (this.parentNode && this.parentNode != this.scene) {
                this.parentNode.dispatchEvent(e);
            }
        });
        this.addEventListener('touchmove', function(e) {
            if (this.parentNode && this.parentNode != this.scene) {
                this.parentNode.dispatchEvent(e);
            }
        });
        this.addEventListener('touchend', function(e) {
            if (this.parentNode && this.parentNode != this.scene) {
                this.parentNode.dispatchEvent(e);
            }
        });
    },
    /**
     * Move Node.
     * @param {Number} x Target x coordinates.
     * @param {Number} y Target y coordinates.
     */
    moveTo: function(x, y) {
        this._x = x;
        this._y = y;
        this._updateCoordinate();
    },
    /**
     * Move Node.
     * @param {Number} x x axis movement distance.
     * @param {Number} y y axis movement distance.
     */
    moveBy: function(x, y) {
        this._x += x;
        this._y += y;
        this._updateCoordinate();
    },
    /**
     * x coordinates of Node.
     * @type {Number}
     */
    x: {
        get: function() {
            return this._x;
        },
        set: function(x) {
            this._x = x;
            this._updateCoordinate();
        }
    },
    /**
     * y coordinates of Node.
     * @type {Number}
     */
    y: {
        get: function() {
            return this._y;
        },
        set: function(y) {
            this._y = y;
            this._updateCoordinate();
        }
    },
    _updateCoordinate: function() {
        if (this.parentNode) {
            this._offsetX = this.parentNode._offsetX + this._x;
            this._offsetY = this.parentNode._offsetY + this._y;
        } else {
            this._offsetX = this._x;
            this._offsetY = this._y;
        }
    },
    remove: function(){
        if(this._listener){
            this.clearEventListener();
        }
        if(this.parentNode){
            this.removeChild(this);
        }
    }
});

/**
 * @scope enchant.Entity.prototype
 */
enchant.Entity = enchant.Class.create(enchant.Node, {
    /**
     * A class with objects displayed on DOM. Not used directly.
     * @constructs
     * @extends enchant.Node
     */
    initialize: function() {
        enchant.Node.call(this);

        this._element = document.createElement('div');
        this._style = this._element.style;
        this._style.position = 'absolute';

        this._scaleX = 1;
        this._scaleY = 1;
        this._rotation = 0;
        this._dirty = false;

        this._transformOrigin = "";

        this._width = 0;
        this._height = 0;
        this._backgroundColor = null;
        this._opacity = 1;
        this._visible = true;
        this._buttonMode = null;
        
        
        this.addEventListener('render', function() {
            if (this._dirty) {
                this._style[VENDER_PREFIX + 'Transform'] = [
                    'rotate(', this._rotation, 'deg)',
                    'scale(', this._scaleX, ',', this._scaleY, ')'
                ].join('');
                this._dirty = false;
            }
        });

        if(enchant.Game.instance._debug){
            this._style.border = "1px solid blue";
            this._style.margin = "-1px";
        }

        /**
         * Set button function to Entity.
         * Apply touch, click to left, right, up, down, a, b
         * for button input for Entity.
         * @type {String}
         */
        this.buttonMode = null;
        /**
         * Checks if Entity is being pushed.
         * Only functions when buttonMode is set.
         * @type {Boolean}
         */
        this.buttonPressed = false;
        this.addEventListener('touchstart', function() {
            if (!this.buttonMode) return;
            this.buttonPressed = true;
            var e = new enchant.Event(this.buttonMode + 'buttondown');
            this.dispatchEvent(e);
            game.dispatchEvent(e);
        });
        this.addEventListener('touchend', function() {
            if (!this.buttonMode) return;
            this.buttonPressed = false;
            var e = new enchant.Event(this.buttonMode + 'buttonup');
            this.dispatchEvent(e);
            game.dispatchEvent(e);
        });

        var that = this;
        var render = function() {
            that.dispatchEvent(new enchant.Event('render'));
        };
        this.addEventListener('addedtoscene', function() {
            render();
            game.addEventListener('exitframe', render);
        });
        this.addEventListener('removedfromscene', function() {
            game.removeEventListener('exitframe', render);
        });
        this.addEventListener('render', function() {
            if (this._offsetX != this._previousOffsetX) {
                this._style.left = this._offsetX + 'px';
            }
            if (this._offsetY != this._previousOffsetY) {
                this._style.top = this._offsetY + 'px';
            }
            this._previousOffsetX = this._offsetX;
            this._previousOffsetY = this._offsetY;
        });

        var that = this;
        if (TOUCH_ENABLED) {
            this._element.addEventListener('touchstart', function(e) {
                var touches = e.touches;
                for (var i = 0, len = touches.length; i < len; i++) {
                    e = new enchant.Event('touchstart');
                    e.identifier = touches[i].identifier;
                    e._initPosition(touches[i].pageX, touches[i].pageY);
                    that.dispatchEvent(e);
                }
            }, false);
            this._element.addEventListener('touchmove', function(e) {
                var touches = e.touches;
                for (var i = 0, len = touches.length; i < len; i++) {
                    e = new enchant.Event('touchmove');
                    e.identifier = touches[i].identifier;
                    e._initPosition(touches[i].pageX, touches[i].pageY);
                    that.dispatchEvent(e);
                }
            }, false);
            this._element.addEventListener('touchend', function(e) {
                var touches = e.changedTouches;
                for (var i = 0, len = touches.length; i < len; i++) {
                    e = new enchant.Event('touchend');
                    e.identifier = touches[i].identifier;
                    e._initPosition(touches[i].pageX, touches[i].pageY);
                    that.dispatchEvent(e);
                }
            }, false);
        } else {
            this._element.addEventListener('mousedown', function(e) {
                var x = e.pageX;
                var y = e.pageY;
                e = new enchant.Event('touchstart');
                e.identifier = game._mousedownID;
                e._initPosition(x, y);
                that.dispatchEvent(e);
                that._mousedown = true;
            }, false);
            game._element.addEventListener('mousemove', function(e) {
                if (!that._mousedown) return;
                var x = e.pageX;
                var y = e.pageY;
                e = new enchant.Event('touchmove');
                e.identifier = game._mousedownID;
                e._initPosition(x, y);
                that.dispatchEvent(e);
            }, false);
            game._element.addEventListener('mouseup', function(e) {
                if (!that._mousedown) return;
                var x = e.pageX;
                var y = e.pageY;
                e = new enchant.Event('touchend');
                e.identifier = game._mousedownID;
                e._initPosition(x, y);
                that.dispatchEvent(e);
                that._mousedown = false;
            }, false);
        }
    },
    /**
     * DOM ID.
     * @type {String}
     */
    id: {
        get: function() {
            return this._element.id;
        },
        set: function(id) {
            this._element.id = id;
        }
    },
    /**
     * DOM class.
     * @type {String}
     */
    className: {
        get: function() {
            return this._element.className;
        },
        set: function(className) {
            this._element.className = className;
        }
    },
    /**
     * Entity width.
     * @type {Number}
     */
    width: {
        get: function() {
            return this._width;
        },
        set: function(width) {
            this._style.width = (this._width = width) + 'px';
        }
    },
    /**
     * Entity height.
     * @type {Number}
     */
    height: {
        get: function() {
            return this._height;
        },
        set: function(height) {
            this._style.height = (this._height = height) + 'px';
        }
    },
    /**
     * Spriteを拡大縮小・回転する時の原点.
     * CSSの'color'プロパティと同様の形式で指定できる.
     * @type {String} 
     */
    transformOrigin: {
        get: function() {
            return this._transformOrigin;
        },
        set: function(transformOrigin) {
            this._style[VENDER_PREFIX + 'TransformOrigin'] = this._transformOrigin = transformOrigin;
        }
        
    },
    /**
     * Expand or contract Sprite.
     * @param {Number} x Scaling for x axis to be expanded.
     * @param {Number} [y] Scaling for y axis to be expanded.
     */
    scale: function(x, y) {
        if (y == null) y = x;
        this._scaleX *= x;
        this._scaleY *= y;
        this._dirty = true;
    },
    /**
     * Rotate Sprite.
     * @param {Number} deg Rotation angle (frequency).
     */
    rotate: function(deg) {
        this._rotation += deg;
        this._dirty = true;
    },
    /**
     * Scaling for Sprite's x axis direction.
     * @type {Number}
     */
    scaleX: {
        get: function() {
            return this._scaleX;
        },
        set: function(scaleX) {
            this._scaleX = scaleX;
            this._dirty = true;
        }
    },
    /**
     * Scaling for Sprite's y axis direction.
     * @type {Number}
     */
    scaleY: {
        get: function() {
            return this._scaleY;
        },
        set: function(scaleY) {
            this._scaleY = scaleY;
            this._dirty = true;
        }
    },
    /**
     * Sprite rotation angle (frequency).
     * @type {Number}
     */
    rotation: {
        get: function() {
            return this._rotation;
        },
        set: function(rotation) {
            this._rotation = rotation;
            this._dirty = true;
        }
    },
    /**
     * Entity background color.
     * Designates as same format as CSS 'color' properties.
     * @type {String}
     */
     backgroundColor: {
        get: function() {
            return this._backgroundColor;
        },
        set: function(color) {
            this._element.style.backgroundColor = this._backgroundColor = color;
        }
    },
    /**
     * Entity transparency.
     * Sets level from 0 to 1 (0 is completely transparent, 1 is completely opaque).
     * @type {Number}
     */
    opacity: {
        get: function() {
            return this._opacity;
        },
        set: function(opacity) {
            this._style.opacity = this._opacity = opacity;
        }
    },
    /**
     * Indicates whether or not to display Entity.
     * @type {Boolean}
     */
    visible: {
        get: function() {
            return this._visible;
        },
        set: function(visible) {
            if (this._visible = visible) {
                this._style.display = 'block';
            } else {
                this._style.display = 'none';
            }
        }
    },
    /**
     * Designates whether or not to make Entity touch valid.
     * @type {Boolean}
     */
    touchEnabled: {
        get: function() {
            return this._touchEnabled;
        },
        set: function(enabled) {
            if (this._touchEnabled = enabled) {
                this._style.pointerEvents = 'all';
            } else {
                this._style.pointerEvents = 'none';
            }
        }
    },
    /**
     * Operates collision detection based on whether or not rectangle angles are intersecting.
     * @param {*} other Object with properties of x, y, width, height that operate Entity collision detection.
     * @return {Boolean} Collision detection results.
     */
    intersect: function(other) {
        return this.x < other.x + other.width && other.x < this.x + this.width &&
            this.y < other.y + other.height && other.y < this.y + this.height;
    },
    /**
     * Operates collision detection based on distance from Entity's central point.
     * @param {*} other Object with properties of x, y, width, height that operate Entity collision detection.
     * @param {Number} [distance] Greatest distance considered in collision. Default level is average of Entity width and height.
     * @return {Boolean} Collision detection result.
     */
    within: function(other, distance) {
        if (distance == null) {
            distance = (this.width + this.height + other.width + other.height) / 4;
        }
        var _;
        return (_ = this.x - other.x + (this.width - other.width) / 2) * _ +
            (_ = this.y - other.y + (this.height - other.height) / 2) * _ < distance * distance;
    }
});

/**
 * @scope enchant.Sprite.prototype
 */
enchant.Sprite = enchant.Class.create(enchant.Entity, {
    /**
     * Class for image display function.
     *
     * @example
     *   var bear = new Sprite(32, 32);
     *   bear.image = game.assets['chara1.gif'];
     *
     * @param {Number} [width] Sprite width.
     * @param {Number} [height] Sprite height.
     * @constructs
     * @extends enchant.Entity
     */
    initialize: function(width, height) {
        enchant.Entity.call(this);

        this.width = width;
        this.height = height;
        this._image = null;
        this._frame = 0;

        this._style.overflow = 'hidden';
        
        if(enchant.Game.instance._debug){
            this._style.border = "1px solid red";
            this._style.margin = "-1px";
            this.addEventListener("touchstart", function(){
                if(!enchant.Game.instance.running) console.log("touchstart", this);
            });
        }
    },
    /**
     * Image displayed in Sprite.
     * @type {enchant.Surface}
     */
    image: {
        get: function() {
            return this._image;
        },
        set: function(image) {
            if (image == this._image) return;

            if (this._image != null) {
                if (this._image.css) {
                    this._style.backgroundImage = '';
                } else if (this._element.firstChild) {
                    this._element.removeChild(this._element.firstChild);
                    if (this._dirtyListener) {
                        this.removeEventListener('render', this._dirtyListener);
                        this._dirtyListener = null;
                    } else {
                        this._image._parent = null;
                    }
                }
            }

            if (image != null) {
                if (image._css) {
                    this._style.backgroundImage = image._css;
                } else if (image._parent) {
                    var canvas = document.createElement('canvas');
                    var context = canvas.getContext('2d');
                    canvas.width = image.width;
                    canvas.height = image.height;
                    context.drawImage(image._element, 0, 0);
                    this._dirtyListener = function() {
                        if (image._dirty) {
                            context.drawImage(image._element);
                            image._dirty = false;
                        }
                    };
                    this.addEventListener('render', this._dirtyListener);
                    this._element.appendChild(canvas);
                } else {
                    image._parent = this;
                    this._element.appendChild(image._element);
                }
            }
            this._image = image;
            this.frame = this.frame;
       }
    },
    /**
     * Frame index display.
     * Frames with same width and height as Sprite will be arrayed in order from upper left of image properties image.
     * By setting the index to start with 0, frames are switched.
     * @type {Number}
     */
    frame: {
        get: function() {
            return this._frame;
        },
        set: function(frame) {
            this._frame = frame;
            if (this._image != null){
                var row = this._image.width / this._width | 0;
                if (this._image._css) {
                    this._style.backgroundPosition = [
                        -(frame % row) * this._width, 'px ',
                        -(frame / row | 0) * this._height, 'px'
                    ].join('');
                } else if (this._element.firstChild) {
                    var style = this._element.firstChild.style;
                    style.left = -(frame % row) * this._width + 'px';
                    style.top = -(frame / row | 0) * this._height + 'px';
                }
            }
        }
    }
});

/**
 * @scope enchant.Label.prototype
 */
enchant.Label = enchant.Class.create(enchant.Entity, {
    /**
     * Create Label object.
     * @constructs
     * @extends enchant.Entity
     */
    initialize: function(text) {
        enchant.Entity.call(this);

        this.width = 300;
        this.text = text;
    },
    /**
     * Text to display.
     * @type {String}
     */
    text: {
        get: function() {
            return this._element.innerHTML;
        },
        set: function(text) {
            this._element.innerHTML = text;
        }
    },
    /**
     * Font settings.
     * CSSの'font' Can be set to same format as properties.
     * @type {String}
     */
    font: {
        get: function() {
            return this._style.font;
        },
        set: function(font) {
            this._style.font = font;
        }
    },
    /**
     * Text color settings.
     * CSSの'color' Can be set to same format as properties.
     * @type {String}
     */
    color: {
        get: function() {
            return this._style.color;
        },
        set: function(color) {
            this._style.color = color;
        }
    }
});

/**
 * @scope enchant.Map.prototype
 */
enchant.Map = enchant.Class.create(enchant.Entity, {
    /**
     * A class to create and display maps from a tile set.
     *
     * @param {Number} tileWidth Tile width.
     * @param {Number} tileHeight Tile height.
     * @constructs
     * @extends enchant.Entity
     */
    initialize: function(tileWidth, tileHeight) {
        enchant.Entity.call(this);

        var canvas = document.createElement('canvas');
        if (RETINA_DISPLAY && game.scale == 2) {
            canvas.width = game.width * 2;
            canvas.height = game.height * 2;
            this._style.webkitTransformOrigin = '0 0';
            this._style.webkitTransform = 'scale(0.5)';
        } else {
            canvas.width = game.width;
            canvas.height = game.height;
        }
        this._element.appendChild(canvas);
        this._context = canvas.getContext('2d');

        this._tileWidth = tileWidth || 0;
        this._tileHeight = tileHeight || 0;
        this._image = null;
        this._data = [[[]]];
        this._dirty = false;
        this._tight = false;

        this.touchEnabled = false;

        /**
         * Two dimensional array to show level of tiles with collision detection.
         * @type {Array.<Array.<Number>>}
         */
        this.collisionData = null;

        this._listeners['render'] = null;
        this.addEventListener('render', function() {
            if (this._dirty || this._previousOffsetX == null) {
                this._dirty = false;
                this.redraw(0, 0, game.width, game.height);
            } else if (this._offsetX != this._previousOffsetX ||
                       this._offsetY != this._previousOffsetY) {
                if (this._tight) {
                    var x = -this._offsetX;
                    var y = -this._offsetY;
                    var px = -this._previousOffsetX;
                    var py = -this._previousOffsetY;
                    var w1 = x - px + game.width;
                    var w2 = px - x + game.width;
                    var h1 = y - py + game.height;
                    var h2 = py - y + game.height;
                    if (w1 > this._tileWidth && w2 > this._tileWidth &&
                        h1 > this._tileHeight && h2 > this._tileHeight) {
                        var sx, sy, dx, dy, sw, sh;
                        if (w1 < w2) {
                            sx = 0;
                            dx = px - x;
                            sw = w1;
                        } else {
                            sx = x - px;
                            dx = 0;
                            sw = w2;
                        }
                        if (h1 < h2) {
                            sy = 0;
                            dy = py - y;
                            sh = h1;
                        } else {
                            sy = y - py;
                            dy = 0;
                            sh = h2;
                        }

                        if (game._buffer == null) {
                            game._buffer = document.createElement('canvas');
                            game._buffer.width = this._context.canvas.width;
                            game._buffer.height = this._context.canvas.height;
                        }
                        var context = game._buffer.getContext('2d');
                        if (this._doubledImage) {
                            context.clearRect(0, 0, sw*2, sh*2);
                            context.drawImage(this._context.canvas,
                                sx*2, sy*2, sw*2, sh*2, 0, 0, sw*2, sh*2);
                            context = this._context;
                            context.clearRect(dx*2, dy*2, sw*2, sh*2);
                            context.drawImage(game._buffer,
                                0, 0, sw*2, sh*2, dx*2, dy*2, sw*2, sh*2);
                        } else {
                            context.clearRect(0, 0, sw, sh);
                            context.drawImage(this._context.canvas,
                                sx, sy, sw, sh, 0, 0, sw, sh);
                            context = this._context;
                            context.clearRect(dx, dy, sw, sh);
                            context.drawImage(game._buffer,
                                0, 0, sw, sh, dx, dy, sw, sh);
                        }

                        if (dx == 0) {
                            this.redraw(sw, 0, game.width - sw, game.height);
                        } else {
                            this.redraw(0, 0, game.width - sw, game.height);
                        }
                        if (dy == 0) {
                            this.redraw(0, sh, game.width, game.height - sh);
                        } else {
                            this.redraw(0, 0, game.width, game.height - sh);
                        }
                    } else {
                        this.redraw(0, 0, game.width, game.height);
                    }
                } else {
                    this.redraw(0, 0, game.width, game.height);
                }
            }
            this._previousOffsetX = this._offsetX;
            this._previousOffsetY = this._offsetY;
        });
    },
    /**
     * Set data.
     * Sees that tiles are set in order in array from the upper left of image properties image, 
     * and sets a two-dimensional index array starting from 0. When more than one is set, they are displayed in reverse order.
     * @param {...Array<Array.<Number>>} data Two-dimensional display of tile index. Multiple designations possible.
     */
    loadData: function(data) {
        this._data = Array.prototype.slice.apply(arguments);
        this._dirty = true;

        this._tight = false;
        for (var i = 0, len = this._data.length; i < len; i++) {
            var c = 0;
            var data = this._data[i];
            for (var y = 0, l = data.length; y < l; y++) {
                for (var x = 0, ll = data[y].length; x < ll; x++) {
                    if (data[y][x] >= 0) c++;
                }
            }
            if (c / (data.length * data[0].length) > 0.2) {
                this._tight = true;
                break;
            }
        }
    },
    /**
     * Judges whether or not obstacles are on top of Map.
     * @param {Number} x x coordinates of detection spot on map.
     * @param {Number} y y coordinates of detection spot on map.
     * @return {Boolean} Checks for obstacles.
     */
    hitTest: function(x, y) {
        if (x < 0 || this.width <= x || y < 0 || this.height <= y) {
            return false;
        }
        var width = this._image.width;
        var height = this._image.height;
        var tileWidth = this._tileWidth || width;
        var tileHeight = this._tileHeight || height;
        x = x / tileWidth | 0;
        y = y / tileHeight | 0;
        if (this.collisionData != null) {
            return this.collisionData[y] && !!this.collisionData[y][x];
        } else {
            for (var i = 0, len = this._data.length; i < len; i++) {
                var data = this._data[i];
                var n;
                if (data[y] != null && (n = data[y][x]) != null &&
                    0 <= n && n < (width / tileWidth | 0) * (height / tileHeight | 0)) {
                    return true;
                }
            }
            return false;
        }
    },
    /**
     * Tile set image displayed on Map.
     * @type {enchant.Surface}
     */
    image: {
        get: function() {
            return this._image;
        },
        set: function(image) {
            this._image = image;
            if (RETINA_DISPLAY && game.scale == 2) {
                var img = new enchant.Surface(image.width * 2, image.height * 2);
                var tileWidth = this._tileWidth || image.width;
                var tileHeight = this._tileHeight || image.height;
                var row = image.width / tileWidth | 0;
                var col = image.height / tileHeight | 0;
                for (var y = 0; y < col; y++) {
                    for (var x = 0; x < row; x++) {
                        img.draw(image, x * tileWidth, y * tileHeight, tileWidth, tileHeight,
                            x * tileWidth * 2, y * tileHeight * 2, tileWidth * 2, tileHeight * 2);
                    }
                }
                this._doubledImage = img;
            }
            this._dirty = true;
        }
    },
    /**
     * Map tile width.
     * @type {Number}
     */
    tileWidth: {
        get: function() {
            return this._tileWidth;
        },
        set: function(tileWidth) {
            this._tileWidth = tileWidth;
            this._dirty = true;
        }
    },
    /**
     * Map tile height.
     * @type {Number}
     */
    tileHeight: {
        get: function() {
            return this._tileHeight;
        },
        set: function(tileHeight) {
            this._tileHeight = tileHeight;
            this._dirty = true;
        }
    },
    /**
     * @private
     */
    width: {
        get: function() {
            return this._tileWidth * this._data[0][0].length
        }
    },
    /**
     * @private
     */
    height: {
        get: function() {
            return this._tileHeight * this._data[0].length
        }
    },
    /**
     * @private
     */
    redraw: function(x, y, width, height) {
        if (this._image == null) {
            return;
        }

        var image, tileWidth, tileHeight, dx, dy;
        if (this._doubledImage) {
            image = this._doubledImage;
            tileWidth = this._tileWidth * 2;
            tileHeight = this._tileHeight * 2;
            dx = -this._offsetX * 2;
            dy = -this._offsetY * 2;
            x *= 2;
            y *= 2;
            width *= 2;
            height *= 2;
        } else {
            image = this._image;
            tileWidth = this._tileWidth;
            tileHeight = this._tileHeight;
            dx = -this._offsetX;
            dy = -this._offsetY;
        }
        var row = image.width / tileWidth | 0;
        var col = image.height / tileHeight | 0;
        var left = Math.max((x + dx) / tileWidth | 0, 0);
        var top = Math.max((y + dy) / tileHeight | 0, 0);
        var right = Math.ceil((x + dx + width) / tileWidth);
        var bottom = Math.ceil((y + dy + height) / tileHeight);

        var source = image._element;
        var context = this._context;
        var canvas = context.canvas;
        context.clearRect(x, y, width, height);
        for (var i = 0, len = this._data.length; i < len; i++) {
            var data = this._data[i];
            var r = Math.min(right, data[0].length);
            var b = Math.min(bottom, data.length);
            for (y = top; y < b; y++) {
                for (x = left; x < r; x++) {
                    var n = data[y][x];
                    if (0 <= n && n < row * col) {
                        var sx = (n % row) * tileWidth;
                        var sy = (n / row | 0) * tileHeight;
                        context.drawImage(source, sx, sy, tileWidth, tileHeight,
                            x * tileWidth - dx, y * tileHeight - dy, tileWidth, tileHeight);
                    }
                }
            }
        }
    }
});

/**
 * @scope enchant.Group.prototype
 */
enchant.Group = enchant.Class.create(enchant.Node, {
    /**
     * A class that can hold multiple Nodes.
     *
     * @example
     *   var stage = new Group();
     *   stage.addChild(player);
     *   stage.addChild(enemy);
     *   stage.addChild(map);
     *   stage.addEventListener('enterframe', function() {
     *      // Scrolls entire frame in response to player's coordinates.
     *      if (this.x > 64 - player.x) {
     *          this.x = 64 - player.x;
     *      }
     *   });
     *
     * @constructs
     * @extends enchant.Node
     */
    initialize: function() {
        enchant.Node.call(this);

        /**
         * Child Node.
         * @type {Array.<enchant.Node>}
         */
        this.childNodes = [];

        this._x = 0;
        this._y = 0;
    },
    /**
     * Adds Node to Group.
     * @param {enchant.Node} node Added Node.
     */
    addChild: function(node) {
        this.childNodes.push(node);
        node.parentNode = this;
        node.dispatchEvent(new enchant.Event('added'));
        if (this.scene) {
            var e = new enchant.Event('addedtoscene');
            node.scene = this.scene;
            node.dispatchEvent(e);
            node._updateCoordinate();

            var fragment = document.createDocumentFragment();
            var nodes;
            var push = Array.prototype.push;
            if (node._element) {
                fragment.appendChild(node._element);
            } else if (node.childNodes) {
                nodes = node.childNodes.slice().reverse();
                while (nodes.length) {
                    node = nodes.pop();
                    node.scene = this.scene;
                    node.dispatchEvent(e);
                    if (node._element) {
                        fragment.appendChild(node._element);
                    } else if (node.childNodes) {
                        push.apply(nodes, node.childNodes.reverse());
                    }
                }
            }
            if (!fragment.childNodes.length) return;

            var nextSibling, thisNode = this;
            while (thisNode.parentNode) {
                nodes = thisNode.parentNode.childNodes;
                nodes = nodes.slice(nodes.indexOf(thisNode) + 1).reverse();
                while (nodes.length) {
                    node = nodes.pop();
                    if (node._element) {
                        nextSibling = node._element;
                        break;
                    } else if (node.childNodes) {
                        push.apply(nodes, node.childNodes.slice().reverse());
                    }
                }
                thisNode = thisNode.parentNode;
            }
            if (nextSibling) {
                this.scene._element.insertBefore(fragment, nextSibling);
            } else {
                this.scene._element.appendChild(fragment);
            }
        }
    },
    /**
     * Incorporates Node into Group.
     * @param {enchant.Node} node Incorporated Node.
     * @param {enchant.Node} reference Node in position before incorporation.
     */
    insertBefore: function(node, reference) {
        var i = this.childNodes.indexOf(reference);
        if (i != -1) {
            this.childNodes.splice(i, 0, node);
            node.parentNode = this;
            node.dispatchEvent(new enchant.Event('added'));
            if (this.scene) {
                var e = new enchant.Event('addedtoscene');
                node.scene = this.scene;
                node.dispatchEvent(e);
                node._updateCoordinate();

                var fragment = document.createDocumentFragment();
                var nodes;
                var push = Array.prototype.push;
                if (node._element) {
                    fragment.appendChild(node._element);
                } else if (node.childNodes) {
                    nodes = node.childNodes.slice().reverse();
                    while (nodes.length) {
                        node = nodes.pop();
                        node.scene = this.scene;
                        node.dispatchEvent(e);
                        if (node._element) {
                            fragment.appendChild(node._element);
                        } else if (node.childNodes) {
                            push.apply(nodes, node.childNodes.reverse());
                        }
                    }
                }
                if (!fragment.childNodes.length) return;

                var nextSibling, thisNode = reference;
                while (thisNode.parentNode) {
                    if (i != null) {
                        nodes = this.childNodes.slice(i+1).reverse();
                        i = null;
                    } else {
                        nodes = thisNode.parentNode.childNodes;
                        nodes = nodes.slice(nodes.indexOf(thisNode) + 1).reverse();
                    }
                    while (nodes.length) {
                        node = nodes.pop();
                        if (node._element) {
                            nextSibling = node._element;
                            break;
                        } else if (node.childNodes) {
                            push.apply(nodes, node.childNodes.slice().reverse());
                        }
                    }
                    thisNode = thisNode.parentNode;
                }
                if (nextSibling) {
                    this.scene._element.insertBefore(fragment, nextSibling);
                } else {
                    this.scene._element.appendChild(fragment);
                }
            }
        } else {
            this.addChild(node);
        }
    },
    /**
     * Delete Node from Group.
     * @param {enchant.Node} node Deleted Node.
     */
    removeChild: function(node) {
        var i = this.childNodes.indexOf(node);
        if (i != -1) {
            this.childNodes.splice(i, 1);
        } else {
            return;
        }
        node.parentNode = null;
        node.dispatchEvent(new enchant.Event('removed'));
        if (this.scene) {
            var e = new enchant.Event('removedfromscene');
            node.scene = null;
            node.dispatchEvent(e);
            if (node._element) {
                this.scene._element.removeChild(node._element);
            } else if (node.childNodes) {
                var nodes = node.childNodes.slice();
                var push = Array.prototype.push;
                while (nodes.length) {
                    node = nodes.pop();
                    node.scene = null;
                    node.dispatchEvent(e);
                    if (node._element) {
                        this.scene._element.removeChild(node._element);
                    } else if (node.childNodes) {
                        push.apply(nodes, node.childNodes);
                    }
                }
            }
        }
    },
    /**
     * First child Node.
     * @type {enchant.Node}
     */
    firstChild: {
        get: function() {
            return this.childNodes[0];
        }
    },
    /**
     * Last child Node.
     * @type {enchant.Node}
     */
    lastChild: {
        get: function() {
            return this.childNodes[this.childNodes.length-1];
        }
    },
    _updateCoordinate: function() {
        if (this.parentNode) {
            this._offsetX = this.parentNode._offsetX + this._x;
            this._offsetY = this.parentNode._offsetY + this._y;
        } else {
            this._offsetX = this._x;
            this._offsetY = this._y;
        }
        for (var i = 0, len = this.childNodes.length; i < len; i++) {
            this.childNodes[i]._updateCoordinate();
        }
    }
});

/**
 * @scope enchant.RGroup.prototype
 */
enchant.RGroup = enchant.Class.create(enchant.Group, {
    /**
     * 回転できるGroup。ただし高さ・幅を指定しなければならない
     *
     * @example
     *   var scene = new RotateGroup();
     *   scene.addChild(player);
     *   scene.addChild(enemy);
     *   game.pushScene(scene);
     *
     * @constructs
     * @extends enchant.Group
     */
    initialize: function(width, height) {
        enchant.Group.call(this);

        if(arguments.length < 2) throw("Width and height of RGroup must be specified");
        this.width = width;
        this.height = height;
        this.rotationOrigin = {
            x : width/2 ,
            y : height/2
        }
        console.log(this.x, this.y, this.rotationOrigin.x, this.rotationOrigin.y);
        this._rotation = 0;
    },
    addChild: function(node) {
        console.log(node);
        enchant.Group.prototype.addChild.apply(this, arguments);
        node.transformOrigin = "0 0";
    },
    rotation: {
        get: function(){
            return this._rotation;
        },
        set: function(rotation){
            var diff_rotation = (rotation - this._rotation);

            if(diff_rotation == 0)return;
            var rad = diff_rotation / 180 * Math.PI;
            var sin = Math.sin(rad);
            var cos = Math.cos(rad);
            var origin = {
                x : this.width/2,
                y : this.height/2
            }
            console.log("diff_rotation", diff_rotation, "rad", rad);
            console.log("origin", origin.x, origin.y);
            console.log("sin", sin, "cos", cos);

            for(var i = 0, len = this.childNodes.length; i < len; i++){
                var node = this.childNodes[i];
                node.rotation -= diff_rotation;
                var rx = (node.x - origin.x);
                var ry = (node.y - origin.y);
                console.log(origin.x, origin.y, cos, sin, origin, rx, ry, node.x, node.y);
                node.x = +cos * rx + sin * ry + origin.x;
                node.y = -sin * rx + cos * ry + origin.y;
            }

            this._rotation = rotation;
        }
    }    
});

/**
 * @scope enchant.Scene.prototype
 */
enchant.Scene = enchant.Class.create(enchant.Group, {
    /**
     * Class that becomes route for display object tree.
     *
     * @example
     *   var scene = new Scene();
     *   scene.addChild(player);
     *   scene.addChild(enemy);
     *   game.pushScene(scene);
     *
     * @constructs
     * @extends enchant.Group
     */
    initialize: function() {
        enchant.Group.call(this);

        this._element = document.createElement('div');
        this._element.style.position = 'absolute';
        this._element.style.overflow = 'hidden';
        this._element.style.width = (this.width = game.width) + 'px';
        this._element.style.height = (this.height = game.height) + 'px';
        this._element.style[VENDER_PREFIX + 'TransformOrigin'] = '0 0';
        this._element.style[VENDER_PREFIX + 'Transform'] = 'scale(' +  game.scale + ')';

        this.scene = this;

        var that = this;
        if (TOUCH_ENABLED) {
            this._element.addEventListener('touchstart', function(e) {
                var touches = e.touches;
                for (var i = 0, len = touches.length; i < len; i++) {
                    e = new enchant.Event('touchstart');
                    e.identifier = touches[i].identifier;
                    e._initPosition(touches[i].pageX, touches[i].pageY);
                    that.dispatchEvent(e);
                }
            }, false);
            this._element.addEventListener('touchmove', function(e) {
                var touches = e.touches;
                for (var i = 0, len = touches.length; i < len; i++) {
                    e = new enchant.Event('touchmove');
                    e.identifier = touches[i].identifier;
                    e._initPosition(touches[i].pageX, touches[i].pageY);
                    that.dispatchEvent(e);
                }
            }, false);
            this._element.addEventListener('touchend', function(e) {
                var touches = e.changedTouches;
                for (var i = 0, len = touches.length; i < len; i++) {
                    e = new enchant.Event('touchend');
                    e.identifier = touches[i].identifier;
                    e._initPosition(touches[i].pageX, touches[i].pageY);
                    that.dispatchEvent(e);
                }
            }, false);
        } else {
            this._element.addEventListener('mousedown', function(e) {
                var x = e.pageX;
                var y = e.pageY;
                e = new enchant.Event('touchstart');
                e.identifier = game._mousedownID;
                e._initPosition(x, y);
                that.dispatchEvent(e);
                that._mousedown = true;
            }, false);
            game._element.addEventListener('mousemove', function(e) {
                if (!that._mousedown) return;
                var x = e.pageX;
                var y = e.pageY;
                e = new enchant.Event('touchmove');
                e.identifier = game._mousedownID;
                e._initPosition(x, y);
                that.dispatchEvent(e);
            }, false);
            game._element.addEventListener('mouseup', function(e) {
                if (!that._mousedown) return;
                var x = e.pageX;
                var y = e.pageY;
                e = new enchant.Event('touchend');
                e.identifier = game._mousedownID;
                e._initPosition(x, y);
                that.dispatchEvent(e);
                that._mousedown = false;
            }, false);
        }
    },
    /**
     * Scene background color.
     * Can indicate same format as CSS 'color' property.
     * @type {String}
     */
    backgroundColor: {
        get: function() {
            return this._backgroundColor;
        },
        set: function(color) {
            this._element.style.backgroundColor = this._backgroundColor = color;
        }
    },
    _updateCoordinate: function() {
        this._offsetX = this._x;
        this._offsetY = this._y;
        for (var i = 0, len = this.childNodes.length; i < len; i++) {
            this.childNodes[i]._updateCoordinate();
        }
    }
});

var CANVAS_DRAWING_METHODS = [
    'putImageData', 'drawImage', 'drawFocusRing', 'fill', 'stroke',
    'clearRect', 'fillRect', 'strokeRect', 'fillText', 'strokeText'
];

/**
 * @scope enchant.Surface.prototype
 */
enchant.Surface = enchant.Class.create(enchant.EventTarget, {
    /**
     * Class that wraps canvas elements.
     *
     * Can set Sprite and Map's image properties and display.
     * Uses context properties when you wish to access Canvas API.
     *
     * @example
     *   // Creates Sprite that displays a circle.
     *   var ball = new Sprite(50, 50);
     *   var surface = new Surface(50, 50);
     *   surface.context.beginPath();
     *   surface.context.arc(25, 25, 25, 0, Math.PI*2, true);
     *   surface.context.fill();
     *   ball.image = surface;
     *
     * @param {Number} width Surface width.
     * @param {Number} height Surface height.
     * @constructs
     */
    initialize: function(width, height) {
        enchant.EventTarget.call(this);

        /**
         * Surface width.
         * @type {Number}
         */
        this.width = width;
        /**
         * Surface height.
         * @type {Number}
         */
        this.height = height;
        /**
         * Surface drawing context.
         * @type {CanvasRenderingContext2D}
         */
        this.context = null;

        var id = 'enchant-surface' + game._surfaceID++;
        if (document.getCSSCanvasContext) {
            this.context = document.getCSSCanvasContext('2d', id, width, height);
            this._element = this.context.canvas;
            this._css = '-webkit-canvas(' + id + ')';
            var context = this.context;
        } else if (document.mozSetImageElement) {
            this._element = document.createElement('canvas');
            this._element.width = width;
            this._element.height = height;
            this._css = '-moz-element(#' + id + ')';
            this.context = this._element.getContext('2d');
            document.mozSetImageElement(id, this._element)
        } else {
            this._element = document.createElement('canvas');
            this._element.width = width;
            this._element.height = height;
            this._element.style.position = 'absolute';
            this.context = this._element.getContext('2d');

            CANVAS_DRAWING_METHODS.forEach(function(name) {
                var method = this.context[name];
                this.context[name] = function() {
                    method.apply(this, arguments);
                    this._dirty = true;
                }
            }, this);
        }
    },
    /**
     * Acquires 1 pixel from Surface.
     * @param {Number} x Acquired pixel's x coordinates.
     * @param {Number} y Acquired pixel's y coordinates.
     * @return {Array.<Number>} An array that holds pixel information in [r, g, b, a] format.
     */
    getPixel: function(x, y) {
        return this.context.getImageData(x, y, 1, 1).data;
    },
    /**
     * Surfaceに1ピクセル設定する.
     * @param {Number} x Set pixel's x coordinates.
     * @param {Number} y Set pixel's y coordinates.
     * @param {Number} r Set pixel's r level.
     * @param {Number} g Set pixel's g level.
     * @param {Number} b Set pixel's b level.
     * @param {Number} a Set pixel's transparency.
     */
    setPixel: function(x, y, r, g, b, a) {
        var pixel = this.context.createImageData(1, 1);
        pixel.data[0] = r;
        pixel.data[1] = g;
        pixel.data[2] = b;
        pixel.data[3] = a;
        this.context.putImageData(pixel, x, y, 1, 1);
    },
    /**
     * Clears all Surface pixels and sets transparency level 0 to black.
     */
    clear: function() {
        this.context.clearRect(0, 0, this.width, this.height);
    },
    /**
     * Draws indicated Surface in argument corresponding to Surface.
     *
     * Wraps Canvas API drawImage, and sets drawing rectangle to same format.
     *
     * @example
     *   var src = game.assets['src.gif'];
     *   var dst = new Surface(100, 100);
     *   dst.draw(src);         // Draws source at (0, 0)
     *   dst.draw(src, 50, 50); // Draws source at (50, 50)
     *   // Draws just 30 horizontal and vertical pixels of source at (50, 50)
     *   dst.draw(src, 50, 50, 30, 30);
     *   // Reduces the horizontal and vertical 40 pixel image at source (10, 10) to a horizontal and vertical 30 pixel image at (50, 50)
     *   dst.draw(src, 10, 10, 40, 40, 50, 50, 30, 30);
     *
     * @param {enchant.Surface} image Surface used in drawing.
     */
    draw: function(image) {
        arguments[0] = image = image._element;
        if (arguments.length == 1) {
            this.context.drawImage(image, 0, 0);
        } else {
            this.context.drawImage.apply(this.context, arguments);
        }
    },
    /**
     * Copies Surface.
     * @return {enchant.Surface} Copied Surface.
     */
    clone: function() {
        var clone = new enchant.Surface(this.width, this.height);
        clone.draw(this);
        return clone;
    },
    /**
     * Creates data scheme URL from Surface.
     * @return {String} Data scheme URL that shows Surface.
     */
    toDataURL: function() {
        var src = this._element.src;
        if (src) {
            if (src.slice(0, 5) == 'data:') {
                return src;
            } else {
                return this.clone().toDataURL();
            }
        } else {
            return this._element.toDataURL();
        }
    }
});

/**
 * Loads image and creates Surface object.
 *
 * Surface created with this method does not allow access to wrap img elements context properties, 
 * or image operation via Canvas API called up by draw,clear, getPixel, setPixel and other methods. 
 * However it is possible to make draw method arguments, and you can operate images drawn on other surfaces
 * (when loading in cross domain, pixel acquisition and other image manipulation is limited). 
 *
 * 
 *
 * @param {String} src Loaded image file path.
 * @static
 */
enchant.Surface.load = function(src) {
    var image = new Image();
    var surface = Object.create(Surface.prototype, {
        context: { value: null },
        _css: { value: 'url(' + src + ')' },
        _element: { value: image }
    });
    enchant.EventTarget.call(surface);
    image.src = src;
    image.onerror = function() {
        throw new Error('Cannot load an asset: ' + image.src);
    };
    image.onload = function() {
        surface.width = image.width;
        surface.height = image.height;
        surface.dispatchEvent(new enchant.Event('load'));
    };
    return surface;
};

/**
 * @scope enchant.Sound.prototype
 */
enchant.Sound = enchant.Class.create(enchant.EventTarget, {
    /**
     * Class to wrap audio elements.
     *
     * Safari, Chrome, Firefox, Opera, and IE all play MP3 files
     * (Firefox and Opera play via Flash). WAVE files can be played on
     * Safari, Chrome, Firefox, and Opera. When the browser is not compatible with
     * the codec the file will not fully play.
     *
     * Instances are created not via constructor but via enchant.Sound.load.
     *
     * @constructs
     */
    initialize: function() {
        enchant.EventTarget.call(this);
        throw new Error("Illegal Constructor");

        /**
         * Sound play time (seconds).
         * @type {Number}
         */
        this.duration = 0;
    },
    /**
     * Begin playing.
     */
    play: function() {
        if (this._element) this._element.play();
    },
    /**
     * Interrupt playing.
     */
    pause: function() {
        if (this._element) this._element.pause();
    },
    /**
     * Stop playing.
     */
    stop: function() {
        this.pause();
        this.currentTime = 0;
    },
    /**
     * Copy Sound.
     * @return {enchant.Sound} Copied Sound.
     */
    clone: function() {
        var clone;
        if (this._element instanceof Audio) {
            clone = Object.create(enchant.Sound.prototype, {
                _element: { value: this._element.cloneNode(false) },
                duration: { value: this.duration }
            });
        } else {
            clone = Object.create(enchant.Sound.prototype);
        }
        enchant.EventTarget.call(clone);
        return clone;
    },
    /**
     * Current play point (seconds).
     * @type {Number}
     */
    currentTime: {
        get: function() {
            return this._element ? this._element.currentTime : 0;
        },
        set: function(time) {
            if (this._element) this._element.currentTime = time;
        }
    },
    /**
     * Volume. 0 (mute) ～ 1 (full volume).
     * @type {Number}
     */
    volume: {
        get: function() {
            return this._element ? this._element.volume : 1;
        },
        set: function(volume) {
            if (this._element) this._element.volume = volume;
        }
    }
});

/**
 * Load audio file, create Surface object.
 *
 * @param {String} src Path of loaded audio file.
 * @param {String} [type] MIME Type of audio file.
 * @static
 */
enchant.Sound.load = function(src, type) {
    if (type == null) {
        var ext = src.match(/\.\w+$/)[0];
        if (ext) {
            type = 'audio/' + ext.slice(1).toLowerCase();
        } else {
            type = '';
        }
    }
    type = type.replace('mp3', 'mpeg');

    var sound = Object.create(enchant.Sound.prototype);
    enchant.EventTarget.call(sound);
    var audio = new Audio();
    if (!enchant.Sound.enabledInMobileSafari &&
        VENDER_PREFIX == 'webkit' && TOUCH_ENABLED) {
        window.setTimeout(function() {
            sound.dispatchEvent(new enchant.Event('load'));
        }, 0);
    } else {
        if (audio.canPlayType(type)) {
            audio.src = src;
            audio.load();
            audio.autoplay = false;
            audio.onerror = function() {
                throw new Error('Cannot load an asset: ' + audio.src);
            };
            audio.addEventListener('canplaythrough', function() {
                sound.duration = audio.duration;
                sound.dispatchEvent(new enchant.Event('load'));
            }, false);
            sound._element = audio;
        } else if (type == 'audio/mpeg') {
            var embed = document.createElement('embed');
            var id = 'enchant-audio' + game._soundID++;
            embed.width = embed.height = 1;
            embed.name = id;
            embed.src = 'sound.swf?id=' + id + '&src=' + src;
            embed.allowscriptaccess = 'always';
            embed.style.position = 'absolute';
            embed.style.left = '-1px';
            sound.addEventListener('load', function() {
                Object.defineProperties(embed, {
                    currentTime: {
                        get: function() { return embed.getCurrentTime() },
                        set: function(time) { embed.setCurrentTime(time) }
                    },
                    volume: {
                        get: function() { return embed.getVolume() },
                        set: function(volume) { embed.setVolume(volume) }
                    }
                });
                sound._element = embed;
                sound.duration = embed.getDuration();
            });
            game._element.appendChild(embed);
            enchant.Sound[id] = sound;
        } else {
            window.setTimeout(function() {
                sound.dispatchEvent(new enchant.Event('load'));
            }, 0);
        }
    }
    return sound;
};

enchant.Sound.enabledInMobileSafari = false;

/**
 * animation.enchant.js v0.1
 * @author sidestepism
 * @example
 * var bear = new AnimationSprite(32, 32);
 * bear.image = game.assets['icon0.gif'];
 * bear.animation.moveTo(64, 64, 30).fadeOut(30);
 * game.rootScene.addChild(bear);
 *
 * @example
 * var bear = new AnimationSprite(32, 32);
 * bear.animation.hide().pushTween({
 *     opacity: 1,
 *     scaleX: 3,
 *     scaleY: 3,
 *     time: 30
 * });
 * game.rootScene.addChild(bear);
 **/

enchant.Action = enchant.Class.create({
    /**
     * アクションオブジェクトのコンストラクタ。
     * 第二引数で親となるタイムラインを指定する。
     * 第三引数にオブジェクトを渡すと、パラメータを上書きできる。
     * アクションを管理するオブジェクト(タイムラインオブジェクト) と組み合わせて利用する。
     *
     * @param timeline
     * @param args
     */
    initialize: function(timeline, args){
        /**
         * 親となるタイムライン
         * @type {enchant.Timeline}
         */
        this.timeline = timeline;

        /**
         * アクションのなか操作するノード
         * @type {enchant.Node}
         */
        this.node = timeline.node;

        /**
         * 現在の経過フレーム数
         * time: 1,
         * @type {Number}
         */
        this.frame = 0;

        /**
         * アクションが持続フレーム数
         * アクションを実行したのち、frame++ > time ならばタイムラインの次のアクションに遷移する
         * @type {Number}
         */
        this.time = 0;

        /**
         * アクションの実体となる関数
         * tick(); が実行されるごとに一度だけ実行される。
         * 実行された回数は frame プロパティに記録されている
         * @type {Function}
         */
        this.func = null;

        /**
         * アクションが終了する前に実行される
         * @type {Function}
         */
        this.callback = null;

        /**
         * アクションがすでに一度でも実行されているかどうか
         * @type {Boolean}
         */
        this.loaded = false;

        /**
         * アクションの初回実行時に実行される関数
         * @type {Function}
         */
        this.onload = null;
        if(args){
            for(var i in args){
                this[i] = args[i];
            }
        }
    },
    /**
     * 1フレーム経過するごとに実行する関数
     * @return {Boolean} [result] アクションが次のフレームでも持続するかどうか
     */
    tick: function(){
        if(!this.loaded){
            if(this.onload)this.onload.call(this);
            this.loaded = true;
        }
        if(this.func){
            this.func();
        }
        this.frame ++;
        if(this.time < this.frame){
            if(this.callback){
                this.callback();
                return false;
            }
        }else{
            return true;
        }
    },
    /**
     * 実行されていない状態に戻す
     */
    reset: function(){
        this.frame = 0;
        this.loaded = false;
    }
});



enchant.Tween = enchant.Class.create(enchant.Action, {
    /**
     * トゥイーンクラス。
     * アクションクラスを継承しており、座標や回転・大きさ・透明度などを、時間に従って変更するために使う。
     * イージング関数を指定することで、様々なイージングを実現できる。
     * コンストラクタの第二引数で、トゥイーンの詳細を指定する。
     *
     * @example
     * var tween = new Tween(sprite, {
     *     x: 100,
     *     y: 0,
     *     easing: enchant.Easing.QUAD_EASEINOUT
     * });
     *
     * @param {enchant.Node} [node] 親となるノード
     * @param {*} [args] パラメータ
     * @constructs
     * @extends enchant.Action
     */
    initialize: function(node, args){
        this._origin = {};
        this._target = {};
        enchant.Action.call(this, node, args);

        if(typeof this.easing === "undefined"){
            this.easing = function(t, b, c, d) {
                return c*t/d + b;
            };
        }

        if(this.onload == null){
            this.onload = function(){
                // トゥイーンの対象とならないプロパティ
                var excepted = ["frame", "time", "callback", "onload"];
                for(var i in args){
                    if(excepted.indexOf(i) == -1){
                        this._origin[i] = node[i];
                        this._target[i] = args[i];
                    }
                }
            }
        }

        this.node = node;
        
        /**
         * トゥイーンで毎フレーム実行される関数
         */
        this.func = function(){
            for(var i in this._target){
                if(typeof this.node[i] === "undefined")continue;
                var ratio = this.easing(this.frame, 0, 1, this.time);
                var val = this._target[i] * ratio + this._origin[i] * (1 - ratio);
                if(i === "x" || i === "y"){
                    this.node[i] = Math.round(val);
                }else{
                    this.node[i] = val;
                }
            }
        }
    }
});


enchant.Timeline = enchant.Class.create({
    /**
     * タイムラインクラス。
     * ノードに関するアクションの実行を管理するオブジェクト。
     * タイムラインに追加されたアクションは順に実行され、すべて実行し終わると待機状態となる。
     *
     * タイムライン自身に様々なアクション・トゥイーンを追加するメソッドが用意されており、
     * メソッドチェーンによりアクションを次々に追加することも可能。
     *
     * @example
     * var bear = new AnimationSprite(32, 32);
     * bear.animation.delay(30).moveTo(0, 320, 60);
     *
     * @param {enchant.Node} [node] アクションの対象となるノード (スプライトなど)
     */
    initialize: function(node){
        this.queue = [];
        this.node = node;
        this.paused = false;
        this.looped = false;
    },
    /**
     * 1フレームごとに実行するメソッド。
     * 親ノードの、enterframeイベントに対するリスナとして登録される。
     * queue プロパティの最初のアクションを実行する。
     * 返値が false ならば、次のアクションを実行する。
     */
    tick: function(){
        if(this.paused) return;
        if(this.queue.length == 0){
            // do nothing
        }else{
            if(this.queue[0].tick()){
                // ticked
            }else{
                // end
                if(this.looped){
                    // 再度キューに追加する
                    var action = this.queue.shift();
                    action.reset();
                    this.queue.push(action);
                }else{
                    this.queue.shift();
                }
                this.tick();
            }
        }
    },
    /**
     * トゥイーンを生成し、追加する。
     * 引数で生成するトゥイーンの詳細を指定できる。
     * (すでに生成したトゥイーンを実行待ちキューに追加するには、
     *  timeline.queue.push(tween) を用いる。)
     * @param {Number} args
     * @time {Number} フレーム数 optional
     */
    pushTween: function(args, time){
        var tween = new Tween(this.node, args);
        if(time !== undefined)tween.time = time;
        this.queue.push(tween);
        return this;
    },
    /**
     * アクションを生成し、追加する。
     * 引数で生成するアクションの詳細を指定できる。
     * (すでに生成したアクションを実行待ちキューに追加するには、
     *  timeline.queue.push(tween) を用いる。)
     * @param {Number} args
     * @time {Number} フレーム数 optional
     */
    pushAction: function(args, time){
        var action = new Action(this, args)
        if(time !== undefined)tween.time = time;
        this.queue.push(action);
        return this;
    },
    /**
     * 不透明度を遷移させるトゥイーンを生成し、キューに追加するメソッド
     * @param {Number} opacity 目標値
     * @param {Number} time フレーム数
     * @param {Function} easing トゥイーン関数
     */
    fadeTo: function(opacity, time, easing){
        if(arguments.length < 2)time = enchant.Game.fps;
        if(arguments.length < 3)easing = enchant.Easing.LINEAR;
        this.pushTween({
            time: time,
            opacity: opacity,
            easing: easing
        });
        return this;
    },
    /**
     * 不透明度を現在の値から1に遷移させるトゥイーンを生成し、キューに追加するメソッド
     * フェードインが実現できる。
     * シーンからの removeChild は実行されないので注意
     * @param {Number} time フレーム数
     * @param {Function} easing トゥイーン関数
     */
    fadeIn: function(time, easing){
        if(time === undefined)time = enchant.Game.instance.fps;
        if(easing === undefined)easing = enchant.Easing.LINEAR;
        this.fadeTo(1, time, easing);
        return this;
    },
    /**
     * 不透明度を現在の値から1に遷移させるトゥイーンを生成し、キューに追加するメソッド
     * フェードインが実現できる。
     * シーンへの addChild は実行されないので注意
     * @param {Number} time フレーム数
     * @param {Function} easing トゥイーン関数
     */
    fadeOut: function(time, easing){
        if(time === undefined)time = enchant.Game.instance.fps;
        if(easing === undefined)easing = enchant.Easing.LINEAR;
        this.fadeTo(0, time, easing);
        return this;
    },
    /**
     * 消す (opacity = 0)
     */
    hide: function(){
        this.pushAction({
            time: 0,
            callback: function(){
                this.node.opacity = 0;
            }
        });
        return this;
    },
    /**
     * 出す (opacity = 1)
     */
    show: function(){
        this.pushAction({
            time: 0,
            callback: function(){
                this.opacity = 0;
            }
        })
    },
    /**
     * 縮尺を変化させるトゥイーンを生成し、キューに追加するメソッド
     * @param {Number} scale 目標値
     * @param {Number} time フレーム数
     * @param {Function} easing トゥイーン関数
     */
    scaleTo: function(scale, time, easing){
        if(arguments.length < 2)time = enchant.Game.fps;
        if(arguments.length < 3)easing = enchant.Easing.LINEAR;
        this.pushTween({
            time: time,
            scaleX: scale,
            scaleY: scale,
            easing: easing
        });
        return this;
    },
    /**
     * 縮尺を変化させるトゥイーンを生成し、キューに追加するメソッド
     * @param {Number} scale 目標値
     * @param {Number} time フレーム数
     * @param {Function} easing トゥイーン関数
     */
    scaleBy: function(scale, time, easing){
        if(time === undefined)time = enchant.Game.instance.fps;
        if(easing === undefined)easing = enchant.Easing.LINEAR;
        this.pushTween({
            time: time,
            onload: function(){
                this._origin.scaleX = this.node.scaleX;
                this._target.scaleX = this.node.scaleX * scale;
                this._origin.scaleY = this.node.scaleY;
                this._target.scaleY = this.node.scaleY * scale;
            },
            scale: scale,
            easing: easing
        });
        return this;
    },
    /**
     * 回転するトゥイーンを生成し、キューに追加するメソッド
     * rotation プロパティの値を、現在の値から指定した値に変化させる
     * @param {Number} deg 回転角度 (度数法)
     * @param {Number} time フレーム数
     * @param {Function} easing トゥイーン関数
     */
    rotateTo: function(deg, time, easing){
        if(time === undefined)time = enchant.Game.instance.fps;
        if(easing === undefined)easing = enchant.Easing.LINEAR;
        this.pushTween({
            time: time,
            rotation: deg,
            easing: easing
        });
        return this;
    },
    /**
     * 回転するトゥイーンを生成し、キューに追加するメソッド
     * rotation プロパティの値を、現在の値から指定した値だけ変化させる
     * @param {Number} deg 回転角度 (度数法)
     * @param {Number} time フレーム数
     * @param {Function} easing トゥイーン関数
     */
    rotateBy: function(deg, time, easing){
        if(time === undefined)time = enchant.Game.instance.fps;
        if(easing === undefined)easing = enchant.Easing.LINEAR;
        this.pushTween({
            time: time,
            onload: function(){
                this._origin.rotation = this.node.rotation;
                this._target.rotation = this.node.rotation + deg;
            },
            rotation: deg,
            easing: easing
        });
        return this;
    },
    /**
     * 移動するトゥイーンを生成し、キューに追加するメソッド
     * x, y座標を、現在の値から指定した値に変化させる
     * @param {Number} x 移動先のx座標
     * @param {Number} y 移動先のy座標
     * @param {Number} time 角度
     * @param {Function} easing トゥイーン関数
     */
    moveTo: function(x, y, time, easing){
        if(time === undefined)time = enchant.Game.instance.fps;
        if(easing === undefined)easing = enchant.Easing.LINEAR;
        this.pushTween({
            time: time,
            x: x,
            y: y,
            easing: easing
        });
        return this;
    },
    /**
     * 移動するトゥイーンを生成し、キューに追加するメソッド
     * x, y座標を、現在の値から指定した値だけ変化させる
     * @param {Number} x x座標の移動量
     * @param {Number} y y座標の移動量
     * @param {Number} time 角度
     * @param {Function} easing トゥイーン関数
     */
    moveBy: function(x, y, time, easing){
        if(time === undefined)time = enchant.Game.instance.fps;
        if(easing === undefined)easing = enchant.Easing.LINEAR;
        this.pushTween({
            time: time,
            onload: function(){
                this._origin.x = this.node.x;
                this._origin.y = this.node.y;
                this._target.x = this.node.x + x;
                this._target.y = this.node.y + y;
            },
            easing: easing
        });
        return this;
    },
    /**
     * 何もせず、指定されたフレーム数だけ待つアクションをキューに追加する
     * @param time
     */
    delay: function(time){
        this.pushAction({
            time: time
        });
        return this;
    },
    /**
     *
     * 指定した関数を1度だけ実行するアクションをキューに追加する
     * delayと組み合わせて、一定フレーム後に実行する関数を指定することもできる
     * @param func 実行する関数
     */
    then: function(func){
        this.pushAction({
            time: 0,
            callback: func
        });
        return this;
    },
    /**
     * 指定した関数を、返り値が true になるまで毎フレーム実行するアクションをキューに追加する
     * @param func 実行する関数
     */
    after: function(func){
        this.pushAction({
            tick: function(){
                return !func();
            }
        });
        return this;
    },
    /**
     * 指定した関数を、返り値が true になるまで毎フレーム実行するアクションをキューに追加する
     * @param func 実行する関数
     */
    repeat: function(func, time, span){
        if(span === undefined)span = 1;
        this.pushAction({
            func: function(){
                if(this.frame % span == 0){
                    func();
                }
            },
            time: time
        });
        return this;
    },
    loop: function(actions){
        return this;
    },
    /**
     * x,y 座標をディレイなしで変更するアクションをキューに追加する
     * @param x
     * @param y
     */
    jumpTo: function(x, y){
        var node = this.node;
        return this.then(function(){
            node.x = x;
            node.y = y;
            });
    },
    /**
     * x,y 座標をディレイなしで変更するアクションをキューに追加する
     * @param x
     * @param y
     */
    jumpBy: function(x, y){
        var node = this.node;
        return this.then(function(){
            node.x = node.x + x;
            node.y = node.y + y;
            });
    },
    /**
     * アニメーションキューの実行をストップする
     */
    pause: function(){
        this.paused = true;
        return this;
    },
    /**
     * アニメーションキューの実行を再開する
     */
    start: function(){
        this.paused = false;
        return this;
    },
    /**
     * アニメーションキューを空にする
     */
    clear: function(){
        this.queue = [];
        this.paused = false;
        return this;
    }
})

/**
 * ============================================================================================
 * Easing Equations v2.0
 * September 1, 2003
 * (c) 2003 Robert Penner, all rights reserved.
 * This work is subject to the terms in http://www.robertpenner.com/easing_terms_of_use.html.
 * ============================================================================================
 */

enchant.Easing = {
    LINEAR: function(t, b, c, d) {
		return c*t/d + b;
    },
	// quad
	QUAD_EASEIN: function(t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	QUAD_EASEOUT: function(t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	QUAD_EASEINOUT: function(t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	// qubic
	QUBIC_EASEIN: function(t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	QUBIC_EASEOUT: function(t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	QUBIC_EASEINOUT: function(t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	// quart
	QUART_EASEIN: function(t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	QUART_EASEOUT: function(t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	QUART_EASEINOUT: function(t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	// quint
	QUINT_EASEIN: function(t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	QUINT_EASEOUT: function(t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	QUINT_EASEINOUT: function(t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
    //sin
	SIN_EASEIN: function(t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	SIN_EASEOUT: function(t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	SIN_EASEINOUT: function(t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	// circ
	CIRC_EASEIN: function(t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	CIRC_EASEOUT: function(t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	CIRC_EASEINOUT: function(t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	// elastic
    ELASTIC_EASEIN: function (t, b, c, d, a, p) {
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	ELASTIC_EASEOUT: function (t, b, c, d, a, p) {
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return (a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b);
	},
	ELASTIC_EASEINOUT: function (t, b, c, d, a, p) {
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
    // bounce
	BOUNCE_EASEOUT: function(t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	BOUNCE_EASEIN: function(t, b, c, d) {
		return c - enchant.Easing.BOUNCE_EASEOUT(d-t, 0, c, d) + b;
	},
	BOUNCE_EASEINOUT: function(t, b, c, d) {
		if (t < d/2) return enchant.Easing.BOUNCE_EASEIN(t*2, 0, c, d) * .5 + b;
		else return enchant.Easing.BOUNCE_EASEOUT(t*2-d, 0, c, d) * .5 + c*.5 + b;
	},
    // back
	BACK_EASEIN: function(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	BACK_EASEOUT: function(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	BACK_EASEINOUT: function(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	// expo
	EXPO_EASEIN: function(t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	EXPO_EASEOUT: function(t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	EXPO_EASEINOUT: function(t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	}
};

/**
 * End of "Easing Equations v2.0"
 */

window.addEventListener("message", function(msg, origin){
    var data = JSON.parse(msg.data);
    if (data.type == "event") {
		game.dispatchEvent(new Event(data.value));
    }else if (data.type == "debug"){
        switch(data.value) {
            case "start":
                enchant.Game.instance.start();
                break;
            case "pause":
                enchant.Game.instance.pause();
                break;
            case "resume":
                enchant.Game.instance.resume();
                break;
            case "tick":
                enchant.Game.instance._tick();
                break;
            default:
                break;
        }
            
    }
})

})();