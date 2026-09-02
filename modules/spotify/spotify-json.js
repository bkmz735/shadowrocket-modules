let url = $request.url;

if (url.includes('.com:443')) {
    url = url.replace(/\.com:443/g, '.com');
}

if (url.includes('platform=iphone')) {
    url = url.replace(/platform=iphone/g, 'platform=ipad');
}

$done({
    url
});
