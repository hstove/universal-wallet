function _registerEvent(target, eventType, cb) {
    if (target.addEventListener) {
        target.addEventListener(eventType, cb);
        return {
            remove: function () {
                target.removeEventListener(eventType, cb);
            }
        };
    } else {
        target.attachEvent(eventType, cb);
        return {
            remove: function () {
                target.detachEvent(eventType, cb);
            }
        };
    }
}

function _createHiddenIframe(target, uri) {
    var iframe = document.createElement("iframe");
    iframe.src = uri;
    iframe.id = "hiddenIframe";
    iframe.style.display = "none";
    target.appendChild(iframe);

    return iframe;
}

function openUriWithHiddenFrame(uri, failCb, successCb) {

    var timeout = setTimeout(function () {
        failCb();
        handler.remove();
    }, 1000);

    var iframe = document.querySelector("#hiddenIframe");
    if (!iframe) {
        iframe = _createHiddenIframe(document.body, "about:blank");
    }

    var handler = _registerEvent(window, "blur", onBlur);

    function onBlur() {
        clearTimeout(timeout);
        handler.remove();
        successCb();
    }

    iframe.contentWindow.location.href = uri;
}

function openUriWithTimeoutHack(uri, failCb, successCb) {

    var timeout = setTimeout(function () {
        failCb();
        handler.remove();
    }, 1000);

    //handle page running in an iframe (blur must be registered with top level window)
    var target = window;
    while (target != target.parent) {
        target = target.parent;
    }

    var handler = _registerEvent(target, "blur", onBlur);

    function onBlur() {
        clearTimeout(timeout);
        handler.remove();
        successCb();
    }

    window.location = uri;
}

function openUriUsingFirefox(uri, failCb, successCb) {
    var iframe = document.querySelector("#hiddenIframe");

    if (!iframe) {
        iframe = _createHiddenIframe(document.body, "about:blank");
    }

    try {
        iframe.contentWindow.location.href = uri;
        successCb();
    } catch (e) {
        if (e.name == "NS_ERROR_UNKNOWN_PROTOCOL") {
            failCb();
        }
    }
}

function openUriUsingIEInOlderWindows(uri, failCb, successCb) {
    if (getInternetExplorerVersion() === 10) {
        openUriUsingIE10InWindows7(uri, failCb, successCb);
    } else if (getInternetExplorerVersion() === 9 || getInternetExplorerVersion() === 11) {
        openUriWithHiddenFrame(uri, failCb, successCb);
    } else {
        openUriInNewWindowHack(uri, failCb, successCb);
    }
}

function openUriUsingIE10InWindows7(uri, failCb, successCb) {
    var timeout = setTimeout(failCb, 1000);
    window.addEventListener("blur", function () {
        clearTimeout(timeout);
        successCb();
    });

    var iframe = document.querySelector("#hiddenIframe");
    if (!iframe) {
        iframe = _createHiddenIframe(document.body, "about:blank");
    }
    try {
        iframe.contentWindow.location.href = uri;
    } catch (e) {
        failCb();
        clearTimeout(timeout);
    }
}

function openUriInNewWindowHack(uri, failCb, successCb) {
    var myWindow = window.open('', '', 'width=0,height=0');

    myWindow.document.write("<iframe src='" + uri + "'></iframe>");

    setTimeout(function () {
        try {
            myWindow.location.href;
            myWindow.setTimeout("window.close()", 1000);
            successCb();
        } catch (e) {
            myWindow.close();
            failCb();
        }
    }, 1000);
}

function openUriWithMsLaunchUri(uri, failCb, successCb) {
    navigator.msLaunchUri(uri,
        successCb,
        failCb
    );
}

function checkBrowser() {
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    function isSafari() {
      var ua = navigator.userAgent.toLowerCase();
      var re = new RegExp("safari");
      var re2 = new RegExp("chrome");

      return re.exec(ua) && !re2.exec(ua)
    }

    return {
        isOpera   : isOpera,
        isFirefox : typeof InstallTrigger !== 'undefined',
        isSafari  : isSafari(),
        isChrome  : !!window.chrome && !isOpera,
        isIE      : /*@cc_on!@*/false || !!document.documentMode // At least IE6
    }
}

function getInternetExplorerVersion() {
    var rv = -1;
    if (navigator.appName === "Microsoft Internet Explorer") {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            rv = parseFloat(RegExp.$1);
    }
    else if (navigator.appName === "Netscape") {
        var ua = navigator.userAgent;
        var re = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null) {
            rv = parseFloat(RegExp.$1);
        }
    }
    return rv;
}

function OpenWithHack(uri) {
    const { REACT_APP_BLOCKSTACK_LINK } = process.env
    const BLOCKSTACK_LINK = localStorage.getItem('BLOCKSTACK_LINK')
    const oneOrTheOther = REACT_APP_BLOCKSTACK_LINK || BLOCKSTACK_LINK
    if (oneOrTheOther) {
        console.log('openUri with Hack: ', oneOrTheOther)
        const myUrl = oneOrTheOther + '/auth?authRequest='
        const finalUri = myUrl + uri.substr(11) + '#coreAPIPassword=off&logServerPort=off&regtest=off'
        openUri(finalUri)
        return true     
    }
    return false
}

function openUri(uri) {
    //handle page running in an iframe (blur must be registered with top level window)
    var target = window;
    while (target != target.parent) {
        target = target.parent;
    }
    window.location = uri;
}


module.exports = function(uri, failCb, successCb, unsupportedCb) {
    function failCallback() {
        failCb && failCb();
    }

    function successCallback() {
        successCb && successCb();
    }

    function unsupportedCallback() {
        if (unsupportedCb)
          unsupportedCb();
        else
          failCallback();
    }

    if (navigator.msLaunchUri) { //for IE and Edge in Win 8 and Win 10
        console.log('openUriWithMsLaunchUri')
        openUriWithMsLaunchUri(uri, failCb, successCb);
    } else {
        var browser = checkBrowser();

        if (browser.isFirefox) {
            console.log('openUriUsingFirefox')
            openUriUsingFirefox(uri, failCallback, successCallback);
        } else if (browser.isChrome) {
            // Check for ChromeOS
            if (/\bCrOS\b/.test(navigator.appVersion)) {
                console.log('unsupported OS')
                unsupportedCallback()
            } else {
                if (OpenWithHack(uri)) {    
                    return
                }
                console.log('openUriWithTimeoutHack')
                openUriWithTimeoutHack(uri, failCallback, successCallback);
            }
        } else if (browser.isIE) {
            console.log('openUriUsingIEInOlderWindows')
            openUriUsingIEInOlderWindows(uri, failCallback, successCallback);
        } else {
            if (OpenWithHack(uri)) {    
                return
            }
            console.log('unsupported browser')
            unsupportedCallback()
        }
    }
}
