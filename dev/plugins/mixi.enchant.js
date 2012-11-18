
(function() {

enchant.mixi = { assets: ['pause_button.png'] };

enchant.mixi.app_id;

enchant.mixi.init = function(app_id){

    if(app_id){
        enchant.mixi.app_id = app_id;
    }

    if (retrieveGETqs()["code"]){
        return;
    }

    console.log("mixi.init called");
    mixi.init({
        appId:    "mixiapp-web_"+app_id
    });


    console.log("mixi.auth called");
    mixi.auth({
        scope: "mixi_apps2",
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

    console.log("ixi.activity called");
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

    loadImage: function(name, src, callback) {
        if (callback == null) {
            callback = function() {
            };
        }
        this.assets[name] = enchant.Surface.load(src);
        this.assets[name].addEventListener('load', callback);
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
            this.loadImage(friends.datas[i].nickname, friends.datas[i].thumbnailUrl,loadListener);
        }
        this.pushScene(this.loadingScene);
    },

    end: function(){

    },

});

enchant.mixi.PauseButton = enchant.Class.create(enchant.Sprite, {

    initialize: function(){
        var game = enchant.Game.instance;
        enchant.Sprite.call(this, 32, 32);
        var image = game.assets['pause_button.png'];
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
            game.start();
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
            return enchant.mixi.Friends.instance;
        }

        this.datas = this.getFriends("all");
        enchant.mixi.Friends.instance = this;
    },

    getFriends: function(mode){
        var friends_array = new Array();

        //API叩く

        //enchant.mixi = { assets: ['https://si0.twimg.com/profile_images/2008781742/icon_reasonably_small.png'] };

        //Friendオブジェクト作る
        var friend = new enchant.mixi.Friend(100, "IHR",'https://si0.twimg.com/profile_images/2008781742/icon_reasonably_small.png');
        friends_array.push(friend);

        return friends_array;
    }
});

enchant.mixi.Friend = enchant.Class.create( enchant.Sprite,{

    initialize: function(id, nickname, thumbnailUrl){
        var game = enchant.Game.instance;
        enchant.Sprite.call(this, 100,100);
        this.id           = id;
        this.nickname     = nickname;
        this.thumbnailUrl = thumbnailUrl;
    },

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

})();
