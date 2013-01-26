
(function() {

enchant.mixi = { assets: ['./img/pause_button.png'] };

enchant.mixi.config = { call_api_file_path: "mixi_graph_api.pl"};

enchant.mixi.apiResult = {};
enchant.mixi.apiResult["people"] = {};
enchant.mixi.apiResult["persistence"] = {};

enchant.mixi.app_id;

enchant.mixi.init = function(app_id){

    if(app_id){
        enchant.mixi.app_id = app_id;
    }

    var code = retrieveGETqs()["code"];
    if (code){
        var param ={};
        param.fields = "id,displayName,thumbnailUrl,thumbnailDetails";
        call_api(
                "people",
                "get",
                "/@friends",
                code,
                JSON.stringify(param),
                function(res){
                    enchant.mixi.apiResult["people"]["/@friends"] =
                        _convert_res_as_hash_for_people(res.entry);
                });

        call_api(
                "people",
                "get",
                "/@self",
                "",
                JSON.stringify(param),
                function(res){
                    enchant.mixi.apiResult["people"]["/@self"] =
                        _convert_res_as_hash_for_people(res.entry, "/@self");
                });

        var so = new enchant.mixi.SharedObject();

        so.get_friends({}, function(res){
            enchant.mixi.apiResult["persistence"]["/@friends"] =
                _convert_res_as_hash_for_persistence(res.entry);
        });
        so.get("", function(res){
            enchant.mixi.apiResult["persistence"]["/@self"] =
                _convert_res_as_hash_for_persistence(res.entry) ;
        });

        var set_params = {};
        set_params.last_play = new Date();
        so.set(set_params, function(res){
            console.log(res);
        });

        return;
    }

    console.log("mixi.init called");
    mixi.init({
        appId:    "mixiapp-web_"+app_id
    });

    console.log("mixi.auth called");
    mixi.auth({
        scope: "mixi_apps2 r_profile",
        state: "touch"
    });

};

enchant.mixi.invite = function() {

    console.log("mixi.invite called");

    opensocial.requestShareApp("VIEWER_FRIENDS", null, function(response) {
            if (response.hadError()) {
            var errCode = response.getErrorCode();
            // do something...
            } else {
            // do something...
            }
            });

};

enchant.mixi.activity = function(title) {

    console.log("mixi.activity called");
    var params = {};
    params[opensocial.Activity.Field.TITLE] = title;
    var activity = opensocial.newActivity(params);
    opensocial.requestCreateActivity(
            activity, opensocial.CreateActivityPriority.HIGH, function(response) {
            if (response.hadError()) {
            var code = response.getErrorCode();
            console.log(code);
            // do something...
            } else {
            // do something...
            console.log("success");
            }
            });

};

enchant.mixi.voice = function(body) {
    var params = {};
    params[mixi.Status.Field.TOUCH_URL] = "http://mixi.jp/run_appli.pl?id="+enchant.mixi.app_id+"&appParams=param"
        mixi.requestUpdateStatus(body, function(response) {
                if (response.hadError()) {
                var code = response.getErrorCode();
                var msg = response.getErrorMessage();
                // エラー時の処理
                } else {
                // 成功時の処理
                }
                }, params);
};

enchant.mixi.enableScroll = function(){
    var tags = enchant.ENV.USE_DEFAULT_EVENT_TAGS;
    if(tags[tags.length-1] != "div"){
        tags.push('div');
    }
};

enchant.mixi.disableScroll = function(){
    var tags = enchant.ENV.USE_DEFAULT_EVENT_TAGS;
    if(tags[tags.length-1] == "div"){
        tags.pop();
    }

    mixi.window.scrollTo();
};

enchant.mixi.MixiGame = enchant.Class.create(enchant.Game, {
    initialize: function(width, height) {
        enchant.Game.call(this, width, height);
        this.addEventListener('load', function() {
            this.currentTime = Date.now();
            this._intervalID = window.setInterval(function() {
                game._tick();
            }, 1000 / this.fps);
            this.running = true;
        });
    },

    loadImage: function(id, src, callback) {
        if (callback == null) {
            callback = function() {
            };
        }
        this.assets[id] = enchant.Surface.load(src);
        this.assets[id].addEventListener('load', callback);
    },


    start: function(){
        var friends = new enchant.mixi.Friends().getFriends("all");
        var me      = new enchant.mixi.Friends().getSelf();
        var loaded = 0;
        var loadListener = function(){
            var e = new enchant.Event('progress');
            e.loaded = ++loaded;
            e.total = total;
            game.dispatchEvent(e);
            console.log(loaded);
            console.log(total);
            if (loaded === total) {
                game.removeScene(game.loadingScene);
                game.dispatchEvent(new enchant.Event('load'));
            }
        };
        var o = {};
        var assets = this._assets.filter(function(asset) {
            return asset in o ? false : o[asset] = true;
        });
        var total = assets.length + friends.length;

        for (i = 0, l = assets.length; i < l; i++) {
            this.load(assets[i], loadListener);
        }
        for(var i=0; i<friends.length; i++){
            this.loadImage(friends[i].id, friends[i].thumbnailUrl,loadListener);
        }
        this.loadImage(me.id, me.thumbnailUrl,loadListener);

        this.pushScene(this.loadingScene);
    },

    end: function(score, message){
        game.pause();
        var so = new enchant.mixi.SharedObject();
        var set_params = {};
        set_params.last_score = score;
        var me = new enchant.mixi.Friends().getSelf();
        if(me.data){
            if(me.data.high_score < score){
                set_params.high_score = score;
            }
        }

        so.set(set_params, function(res){
            console.log("callback function called");
            console.log(res);
            if(me.data.high_score < score){
                enchant.mixi.socialranking.setSelfScore(score);
            }
        });
    },

});

enchant.mixi.PauseButton = enchant.Class.create(enchant.Sprite, {

    initialize: function(){
        var game = enchant.Game.instance;
        enchant.Sprite.call(this, 32, 32);
        var image = game.assets['./img/pause_button.png'];
        this.image = image;
        this.x = game.width - this.width;
        this.y = 0;
        this.frame = 0;

        this.isPause = false;

        this.addEventListener('touchstart', function(e){
            this.tap(game);
            });
    },

    tap: function(game){
        if(this.isPause){
            this.frame = 0;
            enchant.mixi.disableScroll();
            gadgets.window.adjustHeight();
            game.resume();
            this.isPause = false;
        } else {
            this.frame = 1;
            enchant.mixi.enableScroll();
            game.pause();
            this.isPause = true;
        }
    },

});


enchant.mixi.Friends = enchant.Class.create({

    initialize: function(){
        if(enchant.mixi.Friends.instance){
            return enchant.mixi.Friends.instance.datas;
        }

        this.datas = this.getFriends("all");
        enchant.mixi.Friends.instance = this;
    },

    getFriends: function(){
        var friends_array = new Array();

        //Friendオブジェクト作る
        var peoples = enchant.mixi.apiResult["people"]["/@friends"];
        for(var i in peoples){
        if (!peoples[i].thumbnailUrl || ! peoples[i].id){
            continue;
        }
        var friend = new enchant.mixi.Friend(
            peoples[i].id,
            peoples[i].displayName,
            peoples[i].thumbnailUrl,
            peoples[i].thumbnailDetails[0].height,
            peoples[i].thumbnailDetails[0].width
            );
        friend.data = enchant.mixi.apiResult["persistence"]["/@friends"][peoples[i].id];
        friends_array.push(friend);
        }

        return friends_array;
    },

    getSelf: function(){
        var selfData = enchant.mixi.apiResult["people"]["/@self"];
        console.log(selfData);
        var me = new enchant.mixi.Friend(
            selfData.id,
            selfData.displayName,
            selfData.thumbnailUrl,
            selfData.thumbnailDetails[0].height,
            selfData.thumbnailDetails[0].width
        );
        me.data = enchant.mixi.apiResult["persistence"]["/@self"][me.id];
        return me;
    },
});

enchant.mixi.Friend = enchant.Class.create( enchant.Group,{

    initialize: function(id, nickname, thumbnailUrl, img_height, img_width){
        var game = enchant.Game.instance;
        enchant.Group.call(this);
        this.id           = id;
        this.nickname     = nickname;
        this.thumbnailUrl = thumbnailUrl;

        this.icon = new enchant.Sprite(img_width, img_height);
        this.icon.image = game.assets[this.id];

        this.namePlate = new enchant.Label(this.nickname);
        with(this.namePlate){
            width = this.icon.width;
            textAlign = "center";
            visible = false;
            y = this.icon.height;
        }

        this.scorePlate = new enchant.Label("");
        with(this.scorePlate){
            width = this.icon.width * 2;
            textAlign = "center";
            font = "15px 'Consolas', 'Monaco', 'ＭＳ ゴシック'";
        }
            console.log(this.scorePlate.font);

        this.addChild(this.icon);
        this.addChild(this.namePlate);
        this.addChild(this.scorePlate);
    },

    set_param: function(key, value){
        this[key] = value;
    },

    resize: function(xsize, ysize){
        this.icon.scale(xsize/this.icon.width, ysize/this.icon.height);
        this.icon.x -= (this.icon.width  - xsize)/2;
        this.icon.y -= (this.icon.height - ysize)/2;

        this.namePlate.x = -xsize*0.1;
        this.namePlate.width = xsize*1.2;
        this.namePlate.y = ysize;
        this.scorePlate.x = xsize + xsize*0.1;
        this.scorePlate.width = xsize*1.8;
        this.scorePlate.y = ysize/2;
    },

    showNickname: function(bool){
        this.namePlate.visible = bool;
    },

    showScore: function(text){
        this.scorePlate.text = text;
    },

});

enchant.mixi.SocialRanking = enchant.Class.create(enchant.Group, {

    initialize: function(){
        enchant.Group.call(this);
        console.log("ranking");
        enchant.mixi.socialranking = this;
        this.drugging = false;
        this.oldTouchX = 0;
        this.vx = 0;
        this.x = 0;
        var MARGIN = 5;
        var rankingPeoples = new Array();

        this.me = new enchant.mixi.Friends().getSelf();
        rankingPeoples.push(this.me);

        // filter friends
        var friends = new enchant.mixi.Friends().getFriends("all");
        for(var i in friends){
            if(friends[i].data){
                rankingPeoples.push(friends[i]);
            }
        }

        // sort by data.high_sore
        rankingPeoples.sort(
            function(a,b){
                if(a.data.high_score > b.data.high_score){
                    return 1;
                }
                else {
                    return -1;
                }
            }
        );

        // show people
        for(var i in rankingPeoples){
            rankingPeoples[i].resize(32,32);
            rankingPeoples[i].showNickname(true);
            console.log(rankingPeoples[i].data.high_score);
            rankingPeoples[i].showScore(rankingPeoples[i].data.high_score);
            rankingPeoples[i].x = (32*3 + MARGIN) * i + MARGIN;
            this.addChild(rankingPeoples[i]);
        }

        this.width = Math.max(window.screen.width, rankingPeoples.length * (MARGIN *2 + 32 * 3));

        // set touch event handler
        this.addEventListener('touchstart', function(e){
            console.log("touch ranking");
            this.drugging = true;
            this.oldTouchX = e.x
        });
        this.addEventListener('touch)end', function(e){
            this.drugging = false;
        });
        this.addEventListener('touchmove', function(e){
            console.log("move ranking");
            if(this.drugging == true){
                this.x += e.x - this.oldTouchX;
                this.vx = Math.min(1000, (e.x - this.oldTouchX)* 0.73);
            }
            this.oldTouchX = e.x
        });
        this.addEventListener('enterframe', function(e){
            if(this.drugging == false){
                this.x += this.vx;
                this.vx *= 0.99;
                if(this.x + this.width < window.screen.width +10){
                    this.x = window.screen.width + 10 - this.width;
                }
                if(this.x > 10){
                    this.x = 10;
                }
            }
            console.log(this.width);
        });
    },

    setSelfScore: function(newScore){
        this.me.showScore(newScore);
    },
});

enchant.mixi.SharedObject = enchant.Class.create({

    initialize: function(){

    },

    set: function(param, callback){
        call_api("persistence","post","/@self","",JSON.stringify(param), callback);
    },

    get: function(fields, callback){
        var param = {};
        param.fields = fields;
        call_api("persistence","get","/@self","",JSON.stringify(param), callback);
    },

    get_friends: function(param, callback){
        call_api("persistence","get","/@friends","",JSON.stringify(param), callback);
    }
});

function retrieveGETqs() {
    var qsParm = {};
    var query = window.location.search.substring(1);
    var parms = query.split('&');
    for (var i=0; i<parms.length; i++) {
        var pos = parms[i].indexOf('=');
        if (pos > 0) {
            var key = parms[i].substring(0,pos);
            var val = parms[i].substring(pos+1);
            qsParm[key] = val;
        }
    }
    return qsParm;
}


function call_api(api, method, target, code, param, callback){
    if (callback == null){ callback = function(){}; };
    var xhr = new XMLHttpRequest();
    xhr.open("post", enchant.mixi.config.call_api_file_path, false);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4)
            if (xhr.status === 200)
                var res = JSON.parse(xhr.responseText);
                console.log(res);
                enchant.mixi.token = JSON.stringify(res.token);
                callback(res.result);
    };
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    var url_param = _make_url_param(api,method,target,code,param);
    xhr.send(url_param);
}

function _make_url_param(api, method, target, code, param){

    var url_param = "api="+api+"&method="+method+"&target="+target;

    if(enchant.mixi.token != null){
        console.log(enchant.mixi.token);
        url_param += '&token='+enchant.mixi.token;
    } else {
        url_param += "&code="+code;
        console.log("code:"+code);
    }

    if(param !=null){
        url_param += "&param="+param;
    }

    return url_param;
}

function _convert_res_as_hash_for_persistence(array){
    var hash_res = {};
    for(var i in array){
        hash_res[array[i].id] = array[i].data;
    }
    return hash_res;
}
function _convert_res_as_hash_for_people(array, target){
    var res = {};
    if(target =="/@self"){
        return array;
    }
    else {
        for(var i in array){
            res[array[i].id] = array[i];
        }
    }
    return res;
}
})();
