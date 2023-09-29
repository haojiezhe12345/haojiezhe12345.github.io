
//var madohomu_root = ''
//madohomu_root = 'https://ipv6.haojiezhe12345.top:82/madohomu/'

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

                var imgsDOM = '<br><br>'
                try {
                    if (comment.image != '') {
                        for (var i of comment.image.split(',')) {
                            imgsDOM += `<img src="https://haojiezhe12345.top:82/madohomu/api/data/images/posts/${i}.jpg" onclick="viewImg(this)">`
                        }
                    }
                } catch (error) {

                }

                /*
                var newCommentElmnt = document.createElement('div')
                newCommentElmnt.classList.add('commentBox')
                newCommentElmnt.innerHTML = `
                    <img class="bg" src="https://haojiezhe12345.top:82/madohomu/bg/msgbg${randBG}.jpg">
                    <div class="bgcover"></div>
                    <img class="avatar" src="https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${comment.sender}.jpg" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'">
                    <div class="sender">${comment.sender}</div>
                    <div class="id">#${comment.id}</div>
                    <div class="comment">
                        ${comment.comment.replace(/\n/g, "<br/>")}
                        ${imgsDOM}
                    </div>
                    <div class="time">${date + ' ' + hour}</div>
                `
                */
                commentDiv.appendChild(html2elmnt(`
                    <div class="commentBox">
                        <img class="bg" src="https://haojiezhe12345.top:82/madohomu/bg/msgbg${randBG}.jpg">
                        <div class="bgcover"></div>
                        <img class="avatar" src="https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${comment.sender}.jpg" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'">
                        <div class="sender">${comment.sender}</div>
                        <div class="id">#${comment.id}</div>
                        <div class="comment" onwheel="if (!isFullscreen) event.preventDefault()">
                            ${comment.comment.replace(/\n/g, "<br/>")}
                            ${imgsDOM}
                        </div>
                        <div class="time">${date + ' ' + hour}</div>
                    </div>
                `))

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
    var sender = getCookie('username')
    var msg = document.getElementById('msgText').value

    var imgList = []
    var uploadImgClass = document.getElementsByClassName('uploadImg')
    for (var imgElmnt of uploadImgClass) {
        imgList.push(imgElmnt.src.split(';base64,')[1])
    }

    if (msg.replace(/\s/g, '') == '') {
        window.alert('请输入留言内容!')
        return
    }
    if (sender.replace(/\s/g, '') == '') {
        sender = '匿名用户'
    }

    document.getElementById('sendBtn').disabled = true;
    document.getElementById('sendBtn').innerHTML = '正在发送…'

    var xhr = new XMLHttpRequest();
    var url = "https://haojiezhe12345.top:82/madohomu/api/post";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log(xhr.responseText);
            document.getElementById('sendBtn').innerHTML = '发送成功!'
            setTimeout(() => {
                clearComments()
                loadComments()
            }, 1000);
        }
    };
    var data = JSON.stringify({
        "sender": sender,
        "comment": msg,
        'images': imgList
    });
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

    newCommentDisabled = false
    commentHorizontalScrolled = 0
}

function commentScroll() {
    if (!isFullscreen) {
        //var scrolled = commentDiv.scrollLeft / (commentDiv.scrollWidth - commentDiv.clientWidth)
        var toRight = commentDiv.scrollWidth - commentDiv.clientWidth - commentDiv.scrollLeft
        var toLeft = commentDiv.scrollLeft
        //console.log(toRight)
        //console.log(scrolled)
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

function newComment() {
    commentDiv.scrollLeft = 0
    commentDiv.scrollTop = 0

    if (newCommentDisabled) {
        document.getElementById('msgText').focus({preventScroll:true})
        return
    }

    var newCommentBox = document.createElement('div')
    newCommentBox.classList.add('commentBox')
    newCommentBox.id = 'newCommentBox'
    newCommentBox.innerHTML = `
        <div class="bgcover"></div>
        <img class="avatar" id="msgPopupAvatar" src="https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'" onclick="showPopup('setNamePopup')">
        <div class="sender" id="senderText" onclick="showPopup('setNamePopup')">${getCookie('username')}</div>
        <div class="id" onclick="showPopup('setNamePopup')">设置昵称/头像</div>
        <div class="comment">
            <textarea id="msgText" placeholder="圆神保佑~" style="height: 100%"></textarea>
            <div id="uploadImgList" style="display: none"></div>
        </div>
        <label>
            <input id="uploadImgPicker" type="file" onchange="previewLocalImgs()" multiple style="display: none;" />
            <span>+ 添加图片</span>
        </label>
        <button id="sendBtn" onclick="sendMessage()">发送 ✔</button>
    `

    commentDiv.insertBefore(newCommentBox, commentDiv.firstChild)

    document.getElementById('msgText').addEventListener('focusin', () => {
        //console.log('msgText focused')
        document.getElementById('lowerPanel').classList.add('lowerPanelUp')
    })
    document.getElementById('msgText').addEventListener('focusout', () => {
        //console.log('msgText lost focus')
        document.getElementById('lowerPanel').classList.remove('lowerPanelUp')
    })
    
    document.getElementById('msgText').focus({preventScroll:true})

    newCommentDisabled = true
}

function previewLocalImgs() {
    var imgUploadInput = document.getElementById('uploadImgPicker')

    if (imgUploadInput.files.length === 0) {
        console.log('No file chosen')
        return;
    }

    for (let imgfile of imgUploadInput.files) {

        //console.log(imgfile)
        if (!imgfile.type.match(/image.*/)) {
            console.log(`Invalid image file ${imgfile.name}`)
            continue;
        }

        let fileReader = new FileReader();
        fileReader.readAsDataURL(imgfile);
        fileReader.onload = () => {

            //console.log(fileReader.result)
            let image = new Image();
            image.src = fileReader.result;
            image.onload = () => {

                //console.log(image)
                var MAX_WIDTH = 1200;
                var MAX_HEIGHT = 1200;
                var width = image.width;
                var height = image.height;
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                var canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0, width, height);

                imgDataURL = canvas.toDataURL("image/jpeg")

                //uploadImgList.push(imgDataURL.split(';base64,')[1])

                newUploadImgPreviewElmnt = document.createElement('div')
                newUploadImgPreviewElmnt.innerHTML = `
                    <img src="${imgDataURL}" class="uploadImg" onclick="viewImg(this)">
                    <button onclick="this.parentNode.remove()">❌</button>
                `
                document.getElementById('uploadImgList').appendChild(newUploadImgPreviewElmnt)
                document.getElementById('msgText').style = ''
                document.getElementById('uploadImgList').style = ''
            }
        };
    }

    imgUploadInput.value = ''
}

function viewImg(elmnt) {
    //window.open(elmnt.src, '_blank').focus()
    document.getElementById('imgViewer').src = elmnt.src
    document.getElementById('imgViewerBox').style.display = 'block'
    document.getElementById('viewport1').setAttribute('content', 'width=device-width, initial-scale=1.0')
    window.location.hash = 'view-img'

    imgViewerMouseActive = false
    imgViewerOffsetX = 0
    imgViewerOffsetY = 0
    imgViewerScale = 1
    document.getElementById('imgViewer').style.transform = 'translateX(0px) translateY(0px) scale(1)'
}

function closeImgViewer() {
    document.getElementById('imgViewerBox').style.display = 'none';
    document.getElementById('viewport1').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

function showPopup(popupID) {
    var popupContainer = document.getElementById('popupContainer');
    popupContainer.style.display = 'flex';

    var popup = document.getElementById(popupID);
    popup.style.display = 'block';

    document.getElementById('setNameInput').value = getCookie('username')
    avatarInput.value = ''
    setAvatarImg.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg?${new Date().getTime()}`
    setAvatarImg.onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }

    if (popupID == 'getImgPopup') {
        for (let i = 0; i < 6; i++) {
            document.getElementsByClassName('getImgList')[i].src = `https://haojiezhe12345.top:82/madohomu/bg/mainbg${i + 1}.jpg`
        }
        for (let i = 0; i < msgBgCount; i++) {
            document.getElementsByClassName('getImgList')[i + 6].src = `https://haojiezhe12345.top:82/madohomu/bg/msgbg${i + 1}.jpg`
        }
    }
}

function closePopup() {
    var popupContainer = document.getElementById('popupContainer');
    popupContainer.style.display = 'none';

    var elements = document.getElementsByClassName('popupItem');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = 'none';
    }
    loadUserInfo()

    try {
        document.getElementById('senderText').innerHTML = getCookie('username')
        document.getElementById('msgPopupAvatar').src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg?${new Date().getTime()}`
        document.getElementById('msgPopupAvatar').onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
    } catch (error) {

    }
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

    try {
        var invalidFileChars = "\\/:*?\"<>|;";
        var validFileChars = "＼／：＊？＂＜＞｜；";
        for (i = 0; i < invalidFileChars.length; i++) {
            //var re = new RegExp(invalidFileChars[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            //inputName = inputName.replace(re, validFileChars[i]);
            inputName = inputName.split(invalidFileChars[i]).join(validFileChars[i])
        }
    } catch (error) {
        console.log(error)
    }

    setCookie('username', inputName)
    closePopup()
    if (getCookie('username') == '' || getCookie('username') == '匿名用户') {
        //showPopup('msgPopup')
    } else if (getCookie('username') == '10.3') {
        location.reload()
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
    if (bgPaused) return

    /*
    var bg1 = document.getElementById('mainbg1')
    var bg2 = document.getElementById('mainbg2')

    if (currentBGOld < bgCount) {
        currentBGOld += 1
    } else {
        currentBGOld = 1
    }

    bg1.style.opacity = 0
    bg2.style.opacity = 1
    bg2.style.removeProperty('animation-name')
    setTimeout(() => {
        bg1.style.animationName = 'none'
        if (isBirthday) {
            bg1.style.backgroundImage = `url(https://haojiezhe12345.top:82/madohomu/bg/birthday/mainbg${currentBGOld}.jpg)`
        } else {
            bg1.style.backgroundImage = `url(https://haojiezhe12345.top:82/madohomu/bg/mainbg${currentBGOld}.jpg)`
        }
        bg1.id = 'mainbg2'
        bg2.id = 'mainbg1'
    }, 2500);
    */

    var prevBG = currentBG
    if (currentBG + 1 < bgCount) {
        currentBG += 1
    } else {
        currentBG = 0
    }
    var nextBG
    if (currentBG + 1 < bgCount) {
        nextBG = currentBG + 1
    } else {
        nextBG = 0
    }

    if (isBirthday) {
        bgs = document.getElementsByClassName('birthdaybg')
    } else {
        bgs = document.getElementsByClassName('defaultbg')
    }

    bgs[prevBG].style.opacity = 0
    bgs[currentBG].style.display = 'block'
    bgs[currentBG].style.opacity = 1
    bgs[currentBG].firstChild.style.removeProperty('animation-name')
    setTimeout(() => {
        bgs[prevBG].firstChild.style.animationName = 'none'
        bgs[nextBG].style.display = 'block'
        bgs[nextBG].firstChild.style.animationName = 'none'
    }, 2500);

}

function nextCaption() {
    if (bgPaused) return

    if (isBirthday) {
        var elements = document.getElementsByClassName('mainCaption');
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.display = 'none';
        }

        captionDiv.style.opacity = 1
        document.getElementById('birthdayCaption').style.display = 'block'
        return
    }

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

function playWalpurgis() {
    document.getElementById('videoBgBox').style.display = 'block'
    document.getElementById('mainVideo').src = 'https://haojiezhe12345.top:82/madohomu/media/Walpurgis.mp4'
    document.getElementById('mainVideoBg').src = 'https://haojiezhe12345.top:82/madohomu/media/Walpurgis.mp4'
    document.getElementById('mainVideo').play()
    document.getElementById('mainVideoBg').play()
    setTimeout(() => {
        document.getElementById('videoBgBox').style.display = 'none'
    }, 28000);
}

function checkBirthday() {
    var d = new Date()
    if ((d.getMonth() + 1 == 10 && d.getDate() == 3) || getCookie('username') == '10.3') {

        var yearsOld = d.getFullYear() - 2011
        document.getElementById('birthdayDate').innerHTML = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} - Madoka's ${yearsOld}th birthday`

        isBirthday = true
    }
}

function goFullscreen() {
    if (!isFullscreen) {
        var scrollPercent = commentDiv.scrollLeft / (commentDiv.scrollWidth - commentDiv.clientWidth)
        //document.head.appendChild(html2elmnt('<link rel="stylesheet" href="index_fullscreen.css" type="text/css" id="fullscreenCSS">'))
        document.getElementById('fullscreenCSS').disabled = false
        setTimeout(() => {
            commentDiv.scrollTop = (commentDiv.scrollHeight - commentDiv.clientHeight) * scrollPercent
        }, 200);
        isFullscreen = true
    } else {
        var scrollPercent = commentDiv.scrollTop / (commentDiv.scrollHeight - commentDiv.clientHeight)
        document.getElementById('fullscreenCSS').disabled = true
        setTimeout(() => {
            commentDiv.scrollLeft = (commentDiv.scrollWidth - commentDiv.clientWidth) * scrollPercent
        }, 200);
        isFullscreen = false
    }
}

function toggleLowend() {
    if (isLowendElmnt.checked) {
        //document.head.appendChild(html2elmnt('<link rel="stylesheet" href="index_lowend.css" type="text/css" id="lowendCSS">'))
        document.getElementById('lowendCSS').disabled = false
    } else {
        document.getElementById('lowendCSS').disabled = true
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

function html2elmnt(html) {
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content;
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


var isBirthday = false
checkBirthday()

if (isBirthday) {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/mataashita.mp3'
} else if (Math.random() > 0.5) {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/bgm_16k.mp3'
} else {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/bgm1_16k.mp3'
}

if (getCookie('mutebgm') == 'false' || getCookie('mutebgm') == '') {
    document.getElementById('bgm').play()
} else {
    isMutedElmnt.checked = true
}

if (getCookie('isLowend') == 'true') {
    isLowendElmnt.checked = true
    //document.head.appendChild(html2elmnt('<link rel="stylesheet" href="index_lowend.css" type="text/css" id="lowendCSS">'))
    document.getElementById('lowendCSS').disabled = false
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

var commentHorizontalScrolled = 0

commentDiv.addEventListener("wheel", (event) => {
    //console.info(event.deltaY)
    //console.info(commentDiv.scrollLeft)
    commentDiv.scrollLeft += event.deltaY
    /*
    commentHorizontalScrolled += event.deltaY
    if (commentHorizontalScrolled < 0) commentHorizontalScrolled = 0
    if (commentHorizontalScrolled > (commentDiv.scrollWidth - commentDiv.clientWidth)) commentHorizontalScrolled = commentDiv.scrollWidth - commentDiv.clientWidth
    console.log(commentHorizontalScrolled)
    commentDiv.scrollLeft = commentHorizontalScrolled
    */
});


var bgCount
if (isBirthday) {
    bgCount = document.getElementsByClassName('birthdaybg').length
} else {
    bgCount = document.getElementsByClassName('defaultbg').length
}

//var currentBGOld = 2
var currentBG = bgCount - 1
nextImg()
setInterval(nextImg, 8000)
setTimeout(() => {
    //document.getElementById('mainbg1').classList.remove('bgzoom')
    document.getElementsByClassName('defaultbg')[0].classList.remove('bgzoom')
    document.getElementsByClassName('birthdaybg')[0].classList.remove('bgzoom')
}, 10000);

var currentCaption = -1
var captionCount = document.getElementsByClassName('mainCaption').length
nextCaption()
setInterval(nextCaption, 8000)

var bgPaused = false

var msgBgCount = 11
var lastBgImgs = []

var isFullscreen = false

document.getElementById('goto').addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        clearComments(1);
        loadComments(document.getElementById('goto').value)
    }
})

newCommentDisabled = false

var imgViewerMouseActive = false
var imgViewerOffsetX = 0
var imgViewerOffsetY = 0
var imgViewerScale = 1
var imgViewerMouseMoved = false

document.onkeydown = function (e) {
    //console.log(e.key)
    if (e.key == 'Escape') {
        imgvwr = document.getElementById('imgViewerBox')
        if (imgvwr.style.display == 'block') {
            history.back()
        }
    }
}

if (window.location.hash != '') {
    window.location.hash = ''
}

window.onhashchange = function (e) {
    //console.log(e.oldURL.split('#')[1], e.newURL.split('#')[1])
    if (e.oldURL.split('#')[1] == 'view-img') {
        closeImgViewer()
    }
}

var installPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    //console.log(`'beforeinstallprompt' event was fired.`);
});

var isInStandaloneMode = false
isInStandaloneMode = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');


//var uploadImgList = []

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
