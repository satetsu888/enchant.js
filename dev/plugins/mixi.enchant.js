
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
        call_api("people", "get", "/@friends", code, JSON.stringify(param));
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
        var friends = new enchant.mixi.Friends();
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
        var total = assets.length + friends.datas.length;

        for (i = 0, l = assets.length; i < l; i++) {
            this.load(assets[i], loadListener);
        }
        for(var i=0; i<friends.datas.length; i++){
            this.loadImage(friends.datas[i].id, friends.datas[i].thumbnailUrl,loadListener);
        }
        this.pushScene(this.loadingScene);
    },

    end: function(){
        game.pause();
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

    getFriends: function(mode){
        var friends_array = new Array();

        //Friendオブジェクト作る
        var peoples = enchant.mixi.apiResult["people"]["/@friends"];
        for(var i=0; i<peoples.entry.length; i++){
        if (!peoples.entry[i].thumbnailUrl || ! peoples.entry[i].id){
            continue;
        }
        var friend = new enchant.mixi.Friend(
            peoples.entry[i].id,
            peoples.entry[i].displayName,
            peoples.entry[i].thumbnailUrl,
            peoples.entry[i].thumbnailDetails[0].height,
            peoples.entry[i].thumbnailDetails[0].width
            );
        friends_array.push(friend);
        }

        return friends_array;
    }
});

enchant.mixi.Friend = enchant.Class.create( enchant.Sprite,{

    initialize: function(id, nickname, thumbnailUrl, img_height, img_width){
        var game = enchant.Game.instance;
        enchant.Sprite.call(this, img_width, img_height);
        this.id           = id;
        this.nickname     = nickname;
        this.thumbnailUrl = thumbnailUrl;
        this.image = game.assets[this.id];
    },

    set_param: function(key, value){
        this[key] = value;
    },

    resize: function(xsize, ysize){
        this.scale(xsize/this.x, ysize,this.y);
    },

});

enchant.mixi.SharedObject = enchant.Class.create({

    initialize: function(){

    },

    set: function(param){
        call_api("persistence","post","/@self","",JSON.stringify(param));
    },

    get: function(fields){
        var param = {};
        param.fields = fields;
        call_api("persistence","get","/@self","",JSON.stringify(param));
    },

    get_friends: function(){
        call_api("persistence","get","/@friends");
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


function call_api(api, method, target, code, param){
    var xhr = new XMLHttpRequest();
    xhr.open("post", enchant.mixi.config.call_api_file_path, false);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4)
            if (xhr.status === 200)
                console.log(xhr.responseText);
                var res = JSON.parse(xhr.responseText);
                enchant.mixi.apiResult[api][target] = res.result;
                enchant.mixi.token = JSON.stringify(res.token);
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


})();
