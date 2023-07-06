
function loadComments(from, count) {
    const xhr = new XMLHttpRequest();

    if (from == null && count == null) {
        xhr.open("GET", "https://haojiezhe12345.top:82/madohomu/api/comments");
    }
    if (from != null && count == null) {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?from=${from}`);
    }
    /*
    if (from == null && count != null) {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?count=${count}`);
    }
    */
    if (from != null && count != null) {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?from=${from}&count=${count}`);
    }

    xhr.send();
    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            //console.log(xhr.response);

            for (var comment of xhr.response) {
                //console.log(comment)

                if (comment.id >= minCommentID && minCommentID != null) {
                    //console.log('skipping load of comment ID ' + comment.id)
                    continue
                }
                if (comment.hidden == 1 && !document.getElementById('showHidden').checked) {
                    console.log('skipping hidden comment #' + comment.id + ' ' + comment.comment)
                    continue
                }

                var time = new Date(comment.time * 1000)
                date = time.toLocaleDateString("zh-CN")
                hour = time.toLocaleTimeString("zh-CN")

                var randBG
                while (true) {
                    randBG = getRandomIntInclusive(1, msgBgCount)
                    //console.log(lastBgImgs)
                    if (!lastBgImgs.includes(randBG)) {
                        break
                    }
                }
                lastBgImgs.push(randBG)
                if (lastBgImgs.length > 5) {
                    lastBgImgs.splice(0, 1)
                }

                commentDiv.innerHTML += `
                <div class="commentBox">
                    <img class="bg" src="bg/msgbg${randBG}.jpg">
                    <div class="bgcover"></div>
                    <img class="avatar" src="https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${comment.sender}.jpg" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'">
                    <div class="sender">${comment.sender}</div>
                    <div class="id">#${comment.id}</div>
                    <div class="comment">
                        ${comment.comment.replace(/\n/g, "<br/>")}
                    </div>
                    <div class="time">${date + ' ' + hour}</div>
                </div>
                `
                if (minCommentID == null) {
                    minCommentID = comment.id
                }
                if (maxCommentID == null) {
                    maxCommentID = comment.id
                }
                if (comment.id < minCommentID) {
                    minCommentID = comment.id
                }
                if (comment.id > maxCommentID) {
                    maxCommentID = comment.id
                }
                //console.log('min: ' + minCommentID + '  max: ' + maxCommentID)
            }

        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
}

function sendMessage() {
    var sender = document.getElementById('senderText').value
    var msg = document.getElementById('msgText').value

    if (msg.replace(/\s/g, '') == '') {
        window.alert('请输入留言内容!')
        return
    }
    if (sender.replace(/\s/g, '') == '') {
        sender = '匿名用户'
    }

    document.getElementById('sendBtn').disabled = true;

    var xhr = new XMLHttpRequest();
    var url = "https://haojiezhe12345.top:82/madohomu/api/post";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log(xhr.responseText);
            setTimeout(() => {
                location.reload();
            }, 500);
        }
    };
    var data = JSON.stringify({ "sender": sender, "comment": msg });
    xhr.send(data);
}

function clearComments(clearTop) {
    commentDiv.removeEventListener("scroll", commentScroll)
    if (clearTop == 1) {
        commentDiv.innerHTML = ''
    } else {
        commentDiv.innerHTML = topComment
    }
    minCommentID = null
    maxCommentID = null
}

function commentScroll() {
    if (!isFullscreen) {
        //var scrolled = commentDiv.scrollLeft / (commentDiv.scrollWidth - commentDiv.clientWidth)
        var toRight = commentDiv.scrollWidth - commentDiv.clientWidth - commentDiv.scrollLeft
        var toLeft = commentDiv.scrollLeft
        //console.log(toRight)
        if (toRight < 40 && minCommentID != null && maxCommentID != null) {
            loadComments(minCommentID - 1)
            commentDiv.removeEventListener("scroll", commentScroll)
            setTimeout(() => {
                commentDiv.addEventListener("scroll", commentScroll)
            }, 500);
        }
    } else {
        var toBottom = commentDiv.scrollHeight - commentDiv.clientHeight - commentDiv.scrollTop
        var toTop = commentDiv.scrollTop
        //console.log(toBottom)
        if (toBottom < 40 && minCommentID != null && maxCommentID != null) {
            loadComments(minCommentID - 1)
            commentDiv.removeEventListener("scroll", commentScroll)
            setTimeout(() => {
                commentDiv.addEventListener("scroll", commentScroll)
            }, 500);
        }
    }
}

function showPopup(popupID) {
    var popupContainer = document.getElementById('popupContainer');
    popupContainer.style.display = 'flex';

    var popup = document.getElementById(popupID);
    popup.style.display = 'block';

    document.getElementById('senderText').value = getCookie('username')
    document.getElementById('setNameInput').value = getCookie('username')
    document.getElementById('msgPopupAvatar').src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg`
    document.getElementById('msgPopupAvatar').onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
    avatarInput.value = ''
    setAvatarImg.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg`
    setAvatarImg.onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
}

function closePopup() {
    var popupContainer = document.getElementById('popupContainer');
    popupContainer.style.display = 'none';

    var elements = document.getElementsByClassName('popupItem');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = 'none';
    }
    loadUserInfo()
}

function showMsgWindow() {
    if (getCookie('username') == '') {
        showPopup('setNamePopup')
    } else {
        showPopup('msgPopup')
    }
}

function setUserName() {
    inputName = document.getElementById('setNameInput').value;
    setCookie('username', inputName)
    closePopup()
    if (getCookie('username') == '') {
        showPopup('msgPopup')
    } else {
        showPopup('setAvatarPopup')
    }
}

function uploadAvatar() {

    if (avatarInput.files.length === 0) {
        console.log('No file chosen')
        return;
    }
    if (!avatarInput.files[0].type.match(/image.*/)) {
        window.alert("图片无效");
        return;
    }

    var fileReader = new FileReader();
    fileReader.onload = () => {
        var image = new Image();
        image.onload = () => {

            var MIN_WIDTH = 200;
            var MIN_HEIGHT = 200;
            var width = image.width;
            var height = image.height;
            if (width > height) {
                if (height > MIN_HEIGHT) {
                    width *= MIN_HEIGHT / height;
                    height = MIN_HEIGHT;
                }
            } else {
                if (width > MIN_WIDTH) {
                    height *= MIN_WIDTH / width;
                    width = MIN_WIDTH;
                }
            }

            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            var ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, width, height);

            canvas.toBlob((blob) => {

                var xhr = new XMLHttpRequest();
                xhr.open("POST", "https://haojiezhe12345.top:82/madohomu/api/upload");
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        console.log(xhr.responseText);
                        setAvatarImg.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg?${new Date().getTime()}`
                    }
                };
                var formData = new FormData();
                formData.append(`${getCookie('username')}.jpg`, blob)
                xhr.send(formData);

            }, "image/jpeg")
        }
        image.src = fileReader.result;
    };
    fileReader.readAsDataURL(avatarInput.files[0]);
}

function loadUserInfo() {
    var avatar = document.getElementById('userInfoAvatar')
    var name = document.getElementById('userInfoName')

    avatar.onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
    avatar.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg?${new Date().getTime()}`

    if (getCookie('username') == '') {
        name.innerText = '访客'
    } else {
        name.innerText = getCookie('username')
    }
}

function nextImg() {
    var bg1 = document.getElementById('mainbg1')
    var bg2 = document.getElementById('mainbg2')

    if (currentBG < bgCount) {
        currentBG += 1
    } else {
        currentBG = 1
    }

    bg1.style.opacity = 0
    bg2.style.opacity = 1
    setTimeout(() => {
        bg1.style.backgroundImage = `url(bg/mainbg${currentBG}.jpg)`
        bg1.id = 'mainbg2'
        bg2.id = 'mainbg1'
    }, 2500);
}

function nextCaption() {
    captionDiv.style.opacity = 0
    setTimeout(() => {
        var elements = document.getElementsByClassName('mainCaption');
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.display = 'none';
        }
        if (currentCaption < captionCount - 1) {
            currentCaption++
        } else {
            currentCaption = 0
        }
        elements[currentCaption].style.display = 'block';
        if (currentCaption % 2 == 0) {
            captionDiv.style.textAlign = 'left'
            elements[currentCaption].style.color = 'rgb(255, 189, 210)'
        } else {
            captionDiv.style.textAlign = 'right'
            elements[currentCaption].style.color = 'rgb(209, 133, 255)'
        }
        captionDiv.style.opacity = 1
    }, 1500);
}

function goFullscreen() {
    if (!isFullscreen) {
        document.head.innerHTML += '<link rel="stylesheet" href="index_fullscreen.css" type="text/css" id="fullscreenCSS">'
        isFullscreen = true
    } else {
        document.getElementById('fullscreenCSS').remove()
        isFullscreen = false
    }
}

function toggleLowend() {
    if (isLowendElmnt.checked) {
        document.head.innerHTML += '<link rel="stylesheet" href="index_lowend.css" type="text/css" id="lowendCSS">'
    } else {
        document.getElementById('lowendCSS').remove()
    }
    setCookie('isLowend', isLowendElmnt.checked)
}

function toggleBGM() {
    setCookie('mutebgm', isMutedElmnt.checked)
    bgmElmnt.muted = isMutedElmnt.checked
}

function toggleTopComment() {
    setCookie('hideTopComment', hideTopCommentElmnt.checked)
    if (hideTopCommentElmnt.checked) {
        topComment = `
        <div class="commentBox" id="topComment" style="display: none;">
            ${document.getElementById('topComment').innerHTML}
        </div>
        `
        document.getElementById('topComment').style.display = 'none'
    } else {
        topComment = `
        <div class="commentBox" id="topComment">
            ${document.getElementById('topComment').innerHTML}
        </div>
        `
        document.getElementById('topComment').style.display = ''
    }
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

function setCookie(cname, cvalue, exdays = 999) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

var minCommentID = null
var maxCommentID = null

var commentDiv = document.getElementById('comments')
var captionDiv = document.getElementById('mainCaptions')

var setAvatarImg = document.getElementById('setAvatarImg')
var avatarInput = document.getElementById('setAvatarInput')

var bgmElmnt = document.getElementById('bgm')
var isMutedElmnt = document.getElementById('isMuted')

var isLowendElmnt = document.getElementById('isLowend')

var hideTopCommentElmnt = document.getElementById('hideTopComment')

var topComment = `
<div class="commentBox" id="topComment">
    ${document.getElementById('topComment').innerHTML}
</div>
`

if (Math.random() > 0.5) {
    bgmElmnt.src = 'bgm_16k.mp3'
} else {
    bgmElmnt.src = 'bgm1_16k.mp3'
}
if (getCookie('mutebgm') == 'false' || getCookie('mutebgm') == '') {
    document.getElementById('bgm').play()
} else {
    isMutedElmnt.checked = true
}

if (getCookie('isLowend') == 'true') {
    isLowendElmnt.checked = true
    document.head.innerHTML += '<link rel="stylesheet" href="index_lowend.css" type="text/css" id="lowendCSS">'
}
if (getCookie('hideTopComment') == 'true') {
    hideTopCommentElmnt.checked = true
    document.getElementById('topComment').style.display = 'none'
    topComment = `
    <div class="commentBox" id="topComment" style="display: none;">
        ${document.getElementById('topComment').innerHTML}
    </div>
    `
}

loadUserInfo()

loadComments()
setTimeout(() => {
    commentDiv.addEventListener("scroll", commentScroll)
}, 500);
setInterval(commentScroll, 1000)

commentDiv.addEventListener("wheel", (event) => {
    //console.info(event.deltaY)
    commentDiv.scrollLeft += event.deltaY
});

var bgCount = 6
var currentBG = 2
setInterval(nextImg, 5000)

var msgBgCount = 11
var lastBgImgs = []

var currentCaption = -1
var captionCount = document.getElementsByClassName('mainCaption').length
nextCaption()
setInterval(nextCaption, 10000)

var isFullscreen = false

document.getElementById('goto').addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        clearComments(1);
        loadComments(document.getElementById('goto').value)
    }
})

/*
var isBGMPlaying = false
setTimeout(() => {
    document.body.innerHTML += `
    <audio id="bgm" src="bgm.mp3" muted loop controls></audio>
    `
    var audio = document.getElementById('bgm')
    audio.play()
}, 1000);
//document.addEventListener('ontouchstart', audio.play())
//document.addEventListener('onmousemove', audio.play())
//audio.play()
*/
