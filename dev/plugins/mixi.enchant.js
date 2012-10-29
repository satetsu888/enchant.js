
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
