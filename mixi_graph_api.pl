#!/usr/bin/perl

use strict;
use warnings;

use constant {
    CONSUMER_KEY    => 'mixiapp-web_38927',
    CONSUMER_SECRET => '8205481483c668871bf6046b260094a450b4d6b5',
    REDIRECT_URI    => 'http://www.satetsu888.com/enchant.js/examples/expert/getbanana/',

    MIXI_TOKEN_ENDPOINT => 'https://secure.mixi-platform.com/2/token',
    MIXI_API_ENDPOINT   => 'https://api.mixi-platform.com/2',

    API_END_POINT_MAP => {
        people      => '/people',
        persistence => '/apps/appdata',
    },
    API_FIELD_CONST   =>{
        people => {
            get  => '?fields=id,displayName,thumbnailUrl,thumbnailDetails',
        },
        persistence => {
            post => '',
            get  => '?fields=high_score,last_play',
        },
    },
};

use URI::Escape qw/ uri_escape /;
use HTTP::Request;
use LWP::UserAgent;
use JSON::XS;
use Data::Dumper;
use CGI;

my $q = CGI->new;
my $api    = $q->param('api');
my $method = $q->param('method');
my $target = $q->param('target');
my $code   = $q->param('code');
my $token  = $q->param('token');
my $param  = $q->param('param');

sub request {
    my ($method, $url, $data_arr) = @_;

    my $req = HTTP::Request->new(
        $method => $url
    );

    if ($method eq 'POST') {
        my $data_str = join '&', map { uri_escape($_) . '=' . uri_escape($data_arr->{$_}) } keys %$data_arr;
        $req->content_type('application/x-www-form-urlencoded');
        $req->content($data_str);
    }

    my $ua = LWP::UserAgent->new();
    my $res = $ua->request($req);

    return $res;
}

sub json_request {
    my ($method, $url, $data_arr) = @_;

    my $req = HTTP::Request->new(
        $method => $url
    );

    if ($method eq 'POST') {
        $req->content_type('application/json');
        $req->content($data_arr);
    }

    my $ua = LWP::UserAgent->new();
    my $res = $ua->request($req);

    return $res;
}

sub get_token {
    my $auth_code = shift;

    my %data_arr = (
        'grant_type'    => 'authorization_code',
        'client_id'     => CONSUMER_KEY,
        'client_secret' => CONSUMER_SECRET,
        'code'          => $auth_code,
        'redirect_uri'  => REDIRECT_URI,
    );

    my $res = request('POST', MIXI_TOKEN_ENDPOINT, \%data_arr);
    die 'Request failed. ' . $res->status_line unless $res->is_success;

    return decode_json($res->content);
}

sub get_new_token {
    my $refresh_token = shift;

    my %data_arr = (
        'grant_type'    => 'refresh_token',
        'client_id'     => CONSUMER_KEY,
        'client_secret' => CONSUMER_SECRET,
        'refresh_token' => $refresh_token,
    );

    my $res = request('POST', MIXI_TOKEN_ENDPOINT, \%data_arr);
    die 'Request failed. ' . $res->status_line unless $res->is_success;

    return decode_json($res->content);
}

sub call {
    my ($api, $method, $token, $param) = @_;
    my $endpoint = API_END_POINT_MAP->{$api}.'/@me'.$target.API_FIELD_CONST->{$api}->{$method};

    my $delimita = ($endpoint =~ qr/\?/) ? '&' : '?';
    my $url = MIXI_API_ENDPOINT . $endpoint . $delimita .'oauth_token=' . uri_escape($token->{'access_token'});
    my $res;

    warn Data::Dumper::Dumper uc $method;
    warn Data::Dumper::Dumper $url;

    if($api eq 'people'){
        $res = request(uc $method, $url, $param);
    } elsif($api eq "persistence"){
        $res = json_request(uc $method, $url, $param);
    }

    if (defined $res->header('WWW-Authenticate')) {
        my $error_msg = $res->header('WWW-Authenticate');

        if ($error_msg =~ /invalid_request/) {
            die 'Invalid request.';
        } elsif ($error_msg =~ /invalid_token/) {
            die 'Invalid token.';
        } elsif ($error_msg =~ /expired_token/) {
            $token = get_new_token($token->{'refresh_token'});
            $url = MIXI_API_ENDPOINT . $endpoint . '&oauth_token=' . uri_escape($token->{'access_token'});
            return decode_json(request('GET', $url)->{'_content'});
        } elsif ($error_msg =~ /insufficient_scope/) {
            die 'Insufficient scope.';
        }
    }

    return decode_json($res->content);
}

print "Content-type: text/html\n\n";

#print Dumper($code);
if($code){
    $token = get_token($code);
} else {
    $token = decode_json($token);
}

warn Data::Dumper::Dumper $token;
warn Data::Dumper::Dumper $target;
warn Data::Dumper::Dumper $param;
my $result = call($api, $method, $token, $param);

my $json_href = { token => $token, result => $result };
print encode_json($json_href);

1;


