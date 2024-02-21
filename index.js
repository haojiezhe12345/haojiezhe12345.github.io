
//var madohomu_root = ''
//madohomu_root = 'https://ipv6.haojiezhe12345.top:82/madohomu/'

function loadComments(queryObj = {}, isLoadedWithPrevious = false) {
    //if (from == null && time == null) setTodayCommentCount()

    if (queryObj.time && queryObj.time <= 1684651800) {
        Object.assign(queryObj, { 'db': 'kami' })
    }

    var isCommentsNewer = queryObj.db == 'kami'
        ? (getMaxKamiID() != null && queryObj.from > getMaxKamiID())
        : (getMaxCommentID() != null && queryObj.from > getMaxCommentID())
    var isCommentsOlder = queryObj.db == 'kami'
        ? (getMinKamiID() != null && queryObj.from < getMinKamiID())
        : (getMinCommentID() != null && queryObj.from < getMinCommentID())

    const xhr = new XMLHttpRequest();

    xhr.open("GET", "https://haojiezhe12345.top:82/madohomu/api/comments" + obj2queryString(queryObj));

    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.status == 200) {
            //console.log(xhr.response);
            isLoadCommentErrorShowed = false

            if (debug) console.log('isNewer', isCommentsNewer, ' isOlder', isCommentsOlder)

            if (xhr.response.length == 0) {
                if (isCommentsNewer) {
                    console.log('comments are up to date')
                    document.getElementById('loadingIndicatorBefore').style.display = 'none'
                    commentsUpToDate = true
                    window.clearCommentsUpToDateTimeout = setTimeout(() => {
                        commentsUpToDate = false
                    }, 10000);
                    return
                }
                if (isCommentsOlder && queryObj.db == 'kami') {
                    console.log('reached the oldest comment')
                    document.getElementById('loadingIndicator').style.display = 'none'
                    return
                }

                if (queryObj.from && document.getElementsByClassName('commentItem').length == 0) {
                    document.getElementById('loadingIndicatorBefore').style.display = 'none'
                    //document.getElementById('loadingIndicator').style.display = 'none'
                    //pauseCommentScroll = true

                    // NEED MORE ...
                    //
                }
                return
            }

            if (xhr.response[0].time > maxTimelineTime) {
                maxTimelineTime = xhr.response[0].time
                loadTimeline(maxTimelineTime)
                setTodayCommentCount()
            }

            if (isLoadedWithPrevious == false) {
                window.prevLatestCommentEl = document.getElementById('loadingIndicatorBefore').nextElementSibling
                window.prevCommentTop = prevLatestCommentEl.getBoundingClientRect().top
                window.prevCommentLeft = prevLatestCommentEl.getBoundingClientRect().left
            }

            for (let comment of xhr.response) {

                if (comment.hidden == 1 && !document.getElementById('showHidden').checked) {
                    console.log('skipping hidden comment #' + comment.id + ' ' + comment.comment)
                    continue
                }
                // DELETE if new backend deployed
                if (comment.id == -999999 && isCommentsNewer) {
                    console.log('comments are up to date')
                    document.getElementById('loadingIndicatorBefore').style.display = 'none'
                    commentsUpToDate = true
                    window.clearCommentsUpToDateTimeout = setTimeout(() => {
                        commentsUpToDate = false
                    }, 10000);
                    return
                }
                if (comment.id == -999999 && isCommentsOlder) {
                    console.log('reached the oldest comment')
                    document.getElementById('loadingIndicator').style.display = 'none'
                    return
                }

                if (queryObj.from && queryObj.from < 35668 && comment.id >= 35668) {
                    continue
                }

                insertComment(comment, queryObj.db == 'kami' ? true : false)

            }

            if (document.getElementById('topComment') == null) {
                if (isFullscreen) {
                    var newCommentTop = prevLatestCommentEl.getBoundingClientRect().top
                    commentDiv.scrollTop += newCommentTop - prevCommentTop
                } else {
                    var newCommentLeft = prevLatestCommentEl.getBoundingClientRect().left
                    commentDiv.scrollLeft += newCommentLeft - prevCommentLeft
                }
            }

            if (debug) console.log('maxID:', getMaxCommentID(), ' minID:', getMinCommentID())

            // DELETE if new backend deployed
            if (getMinCommentID() == -999999 && getMaxCommentID() == -999999) {
                document.getElementById('loadingIndicatorBefore').style.display = 'none'
                document.getElementById('loadingIndicator').style.display = 'none'
                pauseCommentScroll = true
            }

        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.onerror = () => {
        if (isLoadCommentErrorShowed == false && kami == false) {
            window.alert([
                '加载留言失败',
                '请尝试刷新页面, 清除DNS缓存, 切换网络, 或者10分钟后重试',
                '如数小时内仍未解决, 请发邮件到 3112611479@qq.com (或加此QQ)',
                '',
                'Failed to load messages',
                'Try refreshing this page, flush DNS cache, switch to mobile data, or try again in 10 minutes',
                'Please contact 3112611479@qq.com if it\'s not fixed for hours',
            ].join('\n'))
            isLoadCommentErrorShowed = true
        }
    }
    xhr.send();
}

function insertComment(comment, isKami = false) {
    //if (debug) console.log('Inserting comment', comment.id)
    var insertBeforeEl = null

    // compare comments by time, then ID
    function compareCommentAt(i) {
        return compareArr([comment.time, comment.id], [parseInt(commentList[i].dataset.timestamp), parseInt(commentList[i].id.replace('#', ''))])
    }
    var commentList = document.getElementsByClassName('commentItem')
    // insert into []
    // this matches all lists of length 0
    if (commentList.length == 0) {
        insertBeforeEl = document.getElementById('loadingIndicator')
    } else {
        // insert into the leftmost or rightmost of [0], [0, 1, 2 ...]
        // this matches all lists of length 1, and some of those >= 2
        if (compareCommentAt(0) > 0) {
            insertBeforeEl = commentList[0]
        } else if (compareCommentAt(commentList.length - 1) < 0) {
            insertBeforeEl = document.getElementById('loadingIndicator')
        } else {
            // insert into the middle of [0, 1, ...]
            // this matches all lists with length >= 2
            for (let i = 0; i < commentList.length - 1; i++) {
                if (compareCommentAt(i) < 0 && compareCommentAt(i + 1) > 0) {
                    insertBeforeEl = commentList[i + 1]
                    break
                }
            }
        }
    }
    // if insert fails, there must be two same comments
    if (insertBeforeEl == null) {
        console.log('Duplicate comment detected:', comment.id)
        return
    }
    //if (debug) console.log('Insert before:', insertBeforeEl)

    var time = new Date(comment.time * 1000)
    date = time.toLocaleDateString()
    hour = time.toLocaleTimeString()

    var randBG
    while (true) {
        randBG = getRandomIntInclusive(1, msgBgCount)
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
                imgsDOM += `<img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/api/data/images/posts/${i}.jpg" onclick="viewImg(this.src); document.getElementById('lowerPanel').classList.add('lowerPanelUp')">`
            }
        }
    } catch (error) { }

    commentDiv.insertBefore(html2elmnt(`
        <div class="commentBox commentItem" ${isKami == true ? `data-kamiid="#${comment.id}` : `id="#${comment.id}`}" data-timestamp="${comment.time}">
            <img class="bg" loading="lazy" src="https://haojiezhe12345.top:82/madohomu/bg/msgbg${randBG}.jpg" ${(comment.hidden == 1) ? 'style="display: none;"' : ''}>
            <div class="bgcover"></div>
            <img class="avatar" loading="lazy" src="${isKami == true ? `https://kami.im/getavatar.php?uid=${comment.uid}` : `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${comment.sender}.jpg`}"
                onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'"
                onclick="
                    showUserComment('${comment.sender.replace(/\'/g, "\\'")}');
                    document.getElementById('lowerPanel').classList.add('lowerPanelUp')
                ">
            <div class="sender" onclick="
                showUserComment('${comment.sender.replace(/\'/g, "\\'")}');
                document.getElementById('lowerPanel').classList.add('lowerPanelUp')
                ">
                ${comment.sender == '匿名用户' ? '<span class="ui zh">匿名用户</span><span class="ui en">Anonymous</span>' : comment.sender}
            </div>
            <div class="id">#${comment.id}${isKami == true ? ' (kami.im)' : ''}</div>
            <div class="comment" onwheel="if (!isFullscreen) event.preventDefault()">
                ${htmlEscape(comment.comment)}
                ${imgsDOM}
            </div>
            <div class="time">${date + ' ' + hour}${(comment.hidden == 1) ? ' (hidden)' : ''}</div>
        </div>
    `), insertBeforeEl)
}

function clearComments(clearTop) {
    //commentDiv.removeEventListener("scroll", commentScroll)
    if (clearTop == 1) {
        commentDiv.innerHTML = loadingIndicatorBefore + loadingIndicator
    } else {
        commentDiv.innerHTML = topComment + loadingIndicatorBefore + loadingIndicator
        document.getElementById('loadingIndicatorBefore').style.display = 'none'
    }

    pauseCommentScroll = false
    commentsUpToDate = false
    clearTimeout(window.clearCommentsUpToDateTimeout)

    newCommentDisabled = false
    commentHorizontalScrolled = 0
}

function commentScroll() {
    if (pauseCommentScroll || document.getElementsByClassName('commentItem').length == 0) return

    setTimelineActiveMonth()

    if (!isFullscreen) {
        var toRight = commentDiv.scrollWidth - commentDiv.clientWidth - commentDiv.scrollLeft
        var toLeft = commentDiv.scrollLeft
        //console.log(toLeft, toRight)
        if (toLeft < 40) { document.getElementsByClassName('commentSeekArrow')[0].style.display = 'none' }
        else { document.getElementsByClassName('commentSeekArrow')[0].style.removeProperty('display') }

        if (toRight <= 40) { loadOlderComments() }
        else if (toLeft <= 40 && commentsUpToDate == false) { loadNewerComments() }
        else return

    } else {
        var toBottom = commentDiv.scrollHeight - commentDiv.clientHeight - commentDiv.scrollTop
        var toTop = commentDiv.scrollTop
        //console.log(toTop, toBottom)
        if (toBottom <= 40) { loadOlderComments() }
        else if (toTop <= 40 && commentsUpToDate == false) { loadNewerComments() }
        else return
    }
    //commentDiv.removeEventListener("scroll", commentScroll)
    pauseCommentScroll = true
    setTimeout(() => {
        //commentDiv.addEventListener("scroll", commentScroll)
        pauseCommentScroll = false
    }, 500);
}

function loadOlderComments() {
    if (getMinCommentID() == null || getMinCommentID() <= 1) {
        if (getMinKamiID() == null) {
            loadComments({ 'from': 35662, 'db': 'kami' })
        } else {
            loadComments({ 'from': getMinKamiID() - 1, 'db': 'kami' })
        }
    } else {
        loadComments({ 'from': getMinCommentID() - 1 })
    }
}

function loadNewerComments() {
    if (document.getElementById('newCommentBox') != null && document.getElementById('topComment') == null) {
        console.log('newCommentBox is active, and you are viewing older comments\nskipping upper comments')
        document.getElementById('loadingIndicatorBefore').style.display = 'none'
        return
    }

    var count = 10
    if (isFullscreen) {
        count = getFullscreenHorizonalCommentCount() * 2
        while (count < 9) {
            count += getFullscreenHorizonalCommentCount()
        }
        commentDiv.scrollTop = 0
    }

    if (getMaxKamiID() == null || getMaxKamiID() >= 35662) {
        if (getMaxCommentID() == null) {
            loadComments({ 'from': count, 'count': count })
        } else {
            loadComments({ 'from': getMaxCommentID() + count, 'count': count })
        }
    } else {
        loadComments({ 'from': getMaxKamiID() + count, 'count': count, 'db': 'kami' })
    }
}

function getMaxCommentID() {
    var commentList = document.querySelectorAll('.commentItem[id^="#"]')
    if (commentList.length > 0) return parseInt(commentList[0].id.replace('#', ''))
}

function getMinCommentID() {
    var commentList = document.querySelectorAll('.commentItem[id^="#"]')
    if (commentList.length > 0) return parseInt(commentList[commentList.length - 1].id.replace('#', ''))
}

function getMaxKamiID() {
    var commentList = document.querySelectorAll('.commentItem[data-kamiid^="#"]')
    if (commentList.length > 0) return parseInt(commentList[0].dataset.kamiid.replace('#', ''))
}

function getMinKamiID() {
    var commentList = document.querySelectorAll('.commentItem[data-kamiid^="#"]')
    if (commentList.length > 0) return parseInt(commentList[commentList.length - 1].dataset.kamiid.replace('#', ''))
}

function getMaxCommentTime() {
    var commentList = document.querySelectorAll('.commentItem[id^="#"]')
    if (commentList.length > 0) return parseInt(commentList[0].dataset.timestamp)
}

function getMinCommentTime() {
    var commentList = document.querySelectorAll('.commentItem[id^="#"]')
    if (commentList.length > 0) return parseInt(commentList[commentList.length - 1].dataset.timestamp)
}

// new message box
//
function newComment() {
    commentDiv.scrollLeft = 0
    commentDiv.scrollTop = 0

    if (newCommentDisabled) {
        document.getElementById('msgText').focus({ preventScroll: true })
        return
    }

    commentDiv.insertBefore(html2elmnt(`
        <div class="commentBox" id="newCommentBox">
            <div class="bgcover"></div>
            <img class="avatar" id="msgPopupAvatar" src="https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'" onclick="showPopup('setNamePopup')">
            <div class="sender" id="senderText" onclick="showPopup('setNamePopup')">${getCookie('username')}</div>
            <div class="id" onclick="showPopup('setNamePopup')"><span class="ui zh">设置昵称/头像</span><span class="ui en">Change profile</span></div>
            <div class="comment">
                <textarea id="msgText" placeholder="圆神保佑~" style="height: 100%"></textarea>
                <div id="uploadImgList" style="display: none"></div>
            </div>
            <label>
                <input id="uploadImgPicker" type="file" accept="image/*" onchange="previewLocalImgs()" multiple style="display: none;" />
                <span><span class="ui zh">+ 添加图片</span><span class="ui en">+ Add images</span></span>
            </label>
            <button id="sendBtn" onclick="sendMessage()"><span class="ui zh">发送 ✔</span><span class="ui en">Send ✔</span></button>
        </div>
    `), commentDiv.firstElementChild)

    document.getElementById('msgText').addEventListener('focusin', () => {
        //console.log('msgText focused')
        document.getElementById('lowerPanel').classList.add('lowerPanelUp')
    })
    document.getElementById('msgText').addEventListener('focusout', () => {
        //console.log('msgText lost focus')
        //document.getElementById('lowerPanel').classList.remove('lowerPanelUp')
    })

    document.getElementById('msgText').focus({ preventScroll: true })

    newCommentDisabled = true

    /*
    if (location.hostname != 'haojiezhe12345.top') {
        document.getElementById('banner').style.display = 'block'
    }
    */
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

                document.getElementById('uploadImgList').appendChild(html2elmnt(`
                    <div>
                        <img src="${imgDataURL}" class="uploadImg" onclick="viewImg(this.src)">
                        <button onclick="this.parentNode.remove()">❌</button>
                    </div>
                `))
                document.getElementById('msgText').style = ''
                document.getElementById('uploadImgList').style = ''
            }
        };
    }

    imgUploadInput.value = ''
}

function sendMessage() {
    var sender = getCookie('username')
    var msg = document.getElementById('msgText').value

    var imgList = []
    var uploadImgClass = document.getElementsByClassName('uploadImg')
    if (uploadImgClass.length > 0) {
        for (var imgElmnt of uploadImgClass) {
            imgList.push(imgElmnt.src.split(';base64,')[1])
        }
    }

    if (msg.replace(/\s/g, '') == '') {
        window.alert('请输入留言内容!\nDo not leave the message empty!')
        return
    }
    if (sender.replace(/\s/g, '') == '') {
        sender = '匿名用户'
    }

    document.getElementById('sendBtn').disabled = true;
    document.getElementById('sendBtn').innerHTML = '<span class="ui zh">正在发送…</span><span class="ui en">Sending…</span>'

    var xhr = new XMLHttpRequest();
    var url = "https://haojiezhe12345.top:82/madohomu/api/post";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            document.getElementById('sendBtn').innerHTML = '<span class="ui zh">发送成功!</span><span class="ui en">Sent!</span>'
            setTimeout(() => {
                clearComments()
                loadComments()
            }, 1000);
        }
    };
    xhr.onerror = () => {
        window.alert('发送留言失败\n如果问题持续, 请发邮件到 3112611479@qq.com (或加此QQ)\n\nFailed to send message, if problem persists, please contact 3112611479@qq.com')
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('sendBtn').innerHTML = '<span class="ui zh">发送 ✔</span><span class="ui en">Send ✔</span>'
    }
    var data = JSON.stringify({
        "sender": sender,
        "comment": msg,
        'images': imgList
    });
    xhr.send(data);
}

// img viewer
//
function viewImg(src) {
    //window.open(elmnt.src, '_blank').focus()
    document.getElementById('imgViewer').src = src
    document.getElementById('imgViewerBox').style.display = 'block'
    document.getElementById('viewport1').setAttribute('content', 'width=device-width, initial-scale=1.0')
    window.location.hash = 'view-img'

    imgViewerMouseActive = false
    imgViewerOffsetX = 0
    imgViewerOffsetY = 0
    imgViewerScale = 1
    document.getElementById('imgViewer').style.transform = 'translateX(0px) translateY(0px) scale(1)'
    document.getElementById('imgViewer').style.removeProperty('image-rendering')
}

function closeImgViewer() {
    if (location.hash == '#view-img') {
        history.back()
        return
    }

    document.getElementById('imgViewerBox').style.display = 'none';
    document.getElementById('viewport1').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
}

// popup
//
function showPopup(popupID) {
    location.hash = 'popup'

    var elements = document.getElementsByClassName('popupItem');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = 'none';
    }

    var popupContainer = document.getElementById('popupContainer');
    popupContainer.style.display = 'flex';

    var popup = document.getElementById(popupID);
    popup.style.display = 'block';

    if (popupID == 'setNamePopup') {
        document.getElementById('setNameInput').value = getCookie('username')
    }

    if (popupID == 'setAvatarPopup') {
        avatarInput.value = ''
        setAvatarImg.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg?${new Date().getTime()}`
        setAvatarImg.onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
    }

    if (popupID == 'getImgPopup') {
        document.getElementById('getImgPopup').firstElementChild.lastElementChild.innerHTML = ''
        for (var key in themes) {
            var themeName = themes[key]
            try {
                for (let j = 0; j < document.getElementsByClassName(`${themeName}bg`).length; j++) {
                    document.getElementById('getImgPopup').firstElementChild.lastElementChild.appendChild(html2elmnt(`
                        <img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/bg/${themeName != 'default' ? themeName : ''}/mainbg${j + 1}.jpg">
                        <p>
                            ${document.getElementsByClassName(`${themeName}bg`)[j].children[1].innerHTML}
                            ${document.getElementsByClassName(`${themeName}bg`)[j].dataset.pixivid != null ? `
                                <a href="https://www.pixiv.net/artworks/${document.getElementsByClassName(`${themeName}bg`)[j].dataset.pixivid}" target="_blank">Pixiv↗</a>
                            ` : ''}
                        </p>
                        <br>
                    `))
                }
            } catch (error) {
                console.log(error)
            }
        }
        for (let i = 0; i < msgBgCount; i++) {
            document.getElementById('getImgPopup').firstElementChild.lastElementChild.appendChild(html2elmnt(`
            <img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/bg/msgbg${i + 1}.jpg">
            <p>
                ${msgBgInfo[i].description != null
                    ? msgBgInfo[i].description
                    : `Artwork by ${msgBgInfo[i].illustrator} <a href="https://www.pixiv.net/artworks/${msgBgInfo[i].pixivid}" target="_blank">Pixiv↗</a>`}
            </p>
            <br>
        `))
        }
    }
}

function closePopup() {
    if (location.hash == '#popup') {
        history.back()
        return
    }

    var popupContainer = document.getElementById('popupContainer');
    popupContainer.style.display = 'none';

    var elements = document.getElementsByClassName('popupItem');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = 'none';
    }

    loadUserInfo()
}

// user related
//
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
    //closePopup()
    if (getCookie('username') == '' || getCookie('username') == '匿名用户') {
        closePopup()
    } else if (getCookie('username') == '10.3') {
        //location.reload()
        closePopup()
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
        window.alert("图片无效\nInvalid image");
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
                xhr.onload = function () {
                    if (xhr.status === 200) {
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
        name.innerHTML = '<span class="ui zh">访客</span><span class="ui en">Anonymous</span>'
    } else {
        name.innerText = getCookie('username')
    }

    try {
        document.getElementById('senderText').innerHTML = getCookie('username')
        document.getElementById('msgPopupAvatar').src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg?${new Date().getTime()}`
        document.getElementById('msgPopupAvatar').onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
    } catch (error) {

    }
}

function showUserComment(user) {
    if (debug) console.log(user)
    if ((user == null && userCommentUser == '') || user == '') {
        if (debug) console.log('empty user!')
        return
    };

    userCommentEl.removeEventListener('scroll', userCommentScroll)

    if (user != null) {
        userCommentEl.innerHTML = `
        <h2>
            <img src="https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${user}.jpg" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'">
            <span>${user == '匿名用户' ? '<span class="ui zh">匿名用户</span><span class="ui en">Anonymous</span>' : user}</span>
        </h2>
        `
        //closePopup()
        showPopup('showUserCommentPopup')
        //userCommentEl.scrollTop = 0
        userCommentUser = user
        userCommentOffset = 0
        userCommentIsKami = false
        //userCommentEl.addEventListener('scroll', userCommentScroll)

        //setTimeout(showUserComment)
    }

    const xhr = new XMLHttpRequest();

    if (user != null) {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?user=${user}&count=20`);
    } else {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?user=${userCommentUser}&from=${userCommentOffset}&count=20${userCommentIsKami == true ? '&db=kami' : ''}`);
        if (debug) console.log(userCommentUser, userCommentOffset)
    }

    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.status == 200) {

            for (var comment of xhr.response) {

                // DELETE if new backend deployed
                if (comment.id == -999999) {
                    userCommentUser = ''
                    userCommentEl.appendChild(html2elmnt(`<h4 style="text-align: center">- <span class="ui zh">共 ${userCommentOffset} 条留言</span><span class="ui en">Total ${userCommentOffset} messages</span> -</h4>`))
                    break
                }

                var time = new Date(comment.time * 1000)
                date = time.toLocaleDateString()
                hour = time.toLocaleTimeString()

                var imgsDOM = '<i></i>'
                try {
                    if (comment.image != '') {
                        for (var i of comment.image.split(',')) {
                            imgsDOM += `<img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/api/data/images/posts/${i}.jpg" onclick="viewImg(this.src)">`
                        }
                    }
                } catch (error) { }

                userCommentEl.appendChild(html2elmnt(`
                    <div>
                        <p>${date + ' ' + hour}<span>#${comment.id}</span></p>
                        <p>
                            <span onclick="clearComments(1); loadComments({ 'from': this.parentNode.parentNode.querySelector('span').innerText.replace('#', '') }); closePopup()">
                                ${htmlEscape(comment.comment)}
                            </span>
                            ${imgsDOM}
                        </p>
                    </div>
                `))

                userCommentOffset++
            }

            if (userCommentIsKami == true && xhr.response.length < 10) {
                userCommentUser = ''
                userCommentEl.appendChild(html2elmnt(`
                    <h4>
                        <span class="ui zh">- 共 ${document.getElementById('userComment').getElementsByTagName("div").length} 条留言 -</span>
                        <span class="ui en">- Total ${document.getElementById('userComment').getElementsByTagName("div").length} messages -</span>
                    </h4>
                `))
            }
            if (userCommentIsKami == false && xhr.response.length < 10) {
                userCommentOffset = 0
                userCommentIsKami = true
                setTimeout(showUserComment)
            }

            userCommentEl.addEventListener('scroll', userCommentScroll)
        }
    }
    xhr.onerror = () => {
        setTimeout(() => {
            userCommentEl.addEventListener('scroll', userCommentScroll);
            userCommentScroll();
        }, 1000);
    }
    xhr.send();
}

function userCommentScroll() {
    var toBottom = userCommentEl.scrollHeight - userCommentEl.clientHeight - userCommentEl.scrollTop
    if (toBottom < 100 && document.getElementById('popupContainer').style.display == 'flex') {
        showUserComment()
    }
}

// themes
//
function nextImg() {
    if (bgPaused) return

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

    //if (isBirthday) {
    if (theme != 'default') {
        var bgs = document.getElementsByClassName(`${theme}bg`)
        var bgurl = `https://haojiezhe12345.top:82/madohomu/bg/${theme}/`
    } else {
        var bgs = document.getElementsByClassName('defaultbg')
        var bgurl = 'https://haojiezhe12345.top:82/madohomu/bg/'
    }

    try {
        //bgs[prevBG].style.opacity = 0
        bgs[prevBG].style.removeProperty('opacity')
        bgs[currentBG].style.display = 'block'
        bgs[currentBG].style.opacity = 1
        bgs[currentBG].firstElementChild.style.backgroundImage = `url("${bgurl}mainbg${currentBG + 1}.jpg?2")`
        bgs[currentBG].firstElementChild.style.removeProperty('animation-name')
        setTimeout(() => {
            //bgs[prevBG].firstElementChild.style.animationName = 'none'
            bgs[prevBG].style.removeProperty('display')
            bgs[nextBG].style.display = 'block'
            bgs[nextBG].firstElementChild.style.backgroundImage = `url("${bgurl}mainbg${nextBG + 1}.jpg?2")`
            bgs[nextBG].firstElementChild.style.animationName = 'none'
        }, 2500);
    } catch (error) {
        console.log(error)
    }
}

function nextCaption() {
    if (bgPaused) return

    try {
        var themeCaptions = document.getElementsByClassName(`${theme}Caption`);
    } catch (error) {
        console.log(error)
        return
    }

    if (themeCaptions.length == 1) {
        themeCaptions[0].style.display = 'block';
        setTimeout(() => {
            captionDiv.style.opacity = 1
        }, 500);
        return
    }

    captionDiv.style.opacity = 0
    setTimeout(() => {
        for (var i = 0; i < themeCaptions.length; i++) {
            themeCaptions[i].style.display = 'none';
        }
        if (currentCaption < themeCaptions.length - 1) {
            currentCaption++
        } else {
            currentCaption = 0
        }
        themeCaptions[currentCaption].style.display = 'block';
        captionDiv.style.opacity = 1
    }, 1500);
}

function playWalpurgis(time_ms) {
    document.getElementById('videoBgBox').style.opacity = 1
    document.getElementById('videoBgBox').style.display = 'block'
    document.getElementById('mainVideo').src = 'https://haojiezhe12345.top:82/madohomu/media/walpurgis1.1.mp4'
    document.getElementById('mainVideo').play()
    //document.getElementById('mainVideoBg').src = 'https://haojiezhe12345.top:82/madohomu/media/walpurgis1.1.mp4'
    //document.getElementById('mainVideoBg').play()
    setTimeout(() => {
        document.getElementById('videoBgBox').style.opacity = 0
        setTimeout(() => {
            document.getElementById('videoBgBox').style.display = 'none'
        }, 1000);
    }, time_ms);
}

function changeLang(targetLang) {
    if (targetLang != 'zh' && targetLang != 'en') {
        console.log(`invalid lang "${targetLang}"`)
        return
    }
    document.getElementById('langCSS').innerHTML = `
    .ui {
        display: none !important;
    }
    .ui.${targetLang} {
        display: inline !important;
    }
    `
    currentLang = targetLang
    console.log(`changed lang to ${targetLang}`)
}

function changeGraphicsMode(mode) {
    if (mode == 'high') {
        document.getElementById('lowendCSS').disabled = true
    } else if (mode == 'mid') {
        document.getElementById('lowendCSS').href = 'index_midend.css'
        document.getElementById('lowendCSS').disabled = false
    } else if (mode == 'low') {
        document.getElementById('lowendCSS').href = 'index_lowend.css'
        document.getElementById('lowendCSS').disabled = false
    } else return
    setCookie('graphicsMode', mode)
}

function getFullscreenHorizonalCommentCount() {
    if (!isFullscreen) return null
    var latestCommentEl = document.getElementById('loadingIndicatorBefore').nextElementSibling
    var top = latestCommentEl.getBoundingClientRect().top
    latestCommentEl = latestCommentEl.nextElementSibling
    var count = 1
    while (top == latestCommentEl.getBoundingClientRect().top) {
        count++
        latestCommentEl = latestCommentEl.nextElementSibling
    }
    return count
}

function loadTimeline(timeStamp) {
    console.log('loading timeline from', timeStamp)

    var timelineEl = document.getElementById('timeline')
    timelineEl.innerHTML = ''
    var date = new Date(timeStamp * 1000)
    date.setDate(1)

    while (date.getFullYear() >= 2019) {

        var yearEl = document.createElement('p')
        yearEl.appendChild(html2elmnt(`<strong>${date.getFullYear()}</strong>`))

        while (true) {
            yearEl.appendChild(html2elmnt(`<span>${date.getMonth() + 1}</span>`))

            if (date.getFullYear() == 2019 && date.getMonth() + 1 == 2) {
                date.setFullYear(2011)
                break
            } else if (date.getMonth() == 0) {
                break
            } else {
                date.setMonth(date.getMonth() - 1)
            }
        }
        timelineEl.appendChild(yearEl)

        date.setMonth(date.getMonth() - 1)
    }
}

function getCurrentComment() {
    var scrolled = 0
    if (!isFullscreen) {
        scrolled = commentDiv.scrollLeft / (commentDiv.scrollWidth)// - commentDiv.clientWidth)
    } else {
        scrolled = commentDiv.scrollTop / (commentDiv.scrollHeight)// - commentDiv.clientHeight)
    }
    var commentList = document.getElementsByClassName('commentItem')
    return commentList[Math.round(commentList.length * scrolled)]
}

function setTimelineActiveMonth() {
    try {
        var timeStamp = parseInt(getCurrentComment().dataset.timestamp) * 1000
        var date = new Date(timeStamp)
        var year = date.getFullYear()
        var month = date.getMonth() + 1
        //if (debug) console.log(id, timeStamp, year, month)
        for (var yearEl of document.getElementById('timeline').children) {
            if (yearEl.firstElementChild.innerHTML == year) {
                yearEl.firstElementChild.classList.add('month-active')
            } else {
                yearEl.firstElementChild.classList.remove('month-active')
            }
            for (var monthEl of yearEl.children) {
                if (monthEl.nodeName == 'SPAN') {
                    if (yearEl.firstElementChild.innerHTML == year && monthEl.innerHTML == month) {
                        monthEl.classList.add('month-active')
                    } else {
                        monthEl.classList.remove('month-active')
                    }
                }
            }
        }
    } catch (error) {
        if (debug) console.log(error)
    }
}

function setTodayCommentCount() {
    var utc = parseInt(0 - new Date().getTimezoneOffset() / 60)
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments/count?utc=${utc}`);
    xhr.onload = () => {
        if (xhr.status == 200) {
            document.getElementById('todayCommentCount').innerHTML = xhr.responseText
            console.log('today comment count:', xhr.responseText)
        }
    }
    xhr.send();
}

function seekComment(seekCount) {
    commentDiv.style.scrollBehavior = 'smooth'
    var scrollpx = 200
    try {
        scrollpx = document.getElementById('loadingIndicatorBefore').nextElementSibling.getBoundingClientRect().width + 20
    } catch (error) {
        if (debug) console.log(error)
    }
    commentDiv.scrollLeft = (Math.round((commentDiv.scrollLeft) / scrollpx) + seekCount) * scrollpx
    setTimeout(() => {
        commentDiv.style.removeProperty('scroll-behavior')
    }, 500);
}

// toggles
//
function goFullscreen() {
    if (!isFullscreen) {
        var scrollPercent = commentDiv.scrollLeft / (commentDiv.scrollWidth - commentDiv.clientWidth)
        document.getElementById('fullscreenCSS').disabled = false
        setTimeout(() => {
            commentDiv.scrollTop = (commentDiv.scrollHeight - commentDiv.clientHeight) * scrollPercent
        }, 200);
        document.getElementById('fullscreenBtn').innerHTML = '<span class="ui zh">退出全屏 ↙</span><span class="ui en">Collapse ↙</span>'
        isFullscreen = true
    } else {
        var scrollPercent = commentDiv.scrollTop / (commentDiv.scrollHeight - commentDiv.clientHeight)
        document.getElementById('fullscreenCSS').disabled = true
        setTimeout(() => {
            commentDiv.scrollLeft = (commentDiv.scrollWidth - commentDiv.clientWidth) * scrollPercent
        }, 200);
        document.getElementById('fullscreenBtn').innerHTML = '<span class="ui zh">全屏 ↗</span><span class="ui en">Expand ↗</span>'
        isFullscreen = false
    }
    pauseCommentScroll = true
    setTimeout(() => {
        pauseCommentScroll = false
    }, 500);
}

function toggleBGM() {
    setCookie('mutebgm', isMutedElmnt.checked)
    if (isMutedElmnt.checked) {
        bgmElmnt.muted = true
        bgmElmnt.pause()
    } else {
        bgmElmnt.muted = false
        bgmElmnt.play()
    }
}

function toggleTopComment() {
    setCookie('hideTopComment', hideTopCommentElmnt.checked)
    if (hideTopCommentElmnt.checked) {
        document.getElementById('topComment').style.display = 'none'
        topComment = document.getElementById('topComment').outerHTML
    } else {
        document.getElementById('topComment').style.removeProperty('display')
        topComment = document.getElementById('topComment').outerHTML
    }
}

function toggleTimeline() {
    setCookie('showTimeline', showTimelineElmnt.checked)
    if (showTimelineElmnt.checked) {
        document.getElementById('timelineContainer').style.display = 'block'
        commentDiv.classList.add('noscrollbar')
    } else {
        document.getElementById('timelineContainer').style.display = 'none'
        commentDiv.classList.remove('noscrollbar')
    }
}

// functional funcs
//
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
    html = html.trim()
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content;
}

function htmlEscape(txt) {
    var el = document.createElement('p')
    el.innerText = txt
    return el.innerHTML
}

function compareArr(a1, a2) {
    //if (debug) console.log(a1, a2)
    for (let i = 0; i < a1.length; i++) {
        if (a1[i] != a2[i]) {
            return a1[i] - a2[i]
        } else {
            continue
        }
    }
    return 0
}

function obj2queryString(obj) {
    if (obj.length == 0) return ''
    var arr = []
    for (key in obj) {
        arr.push(`${key}=${obj[key]}`)
    }
    return '?' + arr.join('&')
}


// common vars
//
var pauseCommentScroll = false
var commentsUpToDate = false
var maxTimelineTime = 0

var userCommentUser = ''
var userCommentOffset = 0
var userCommentIsKami = false

// document elmnts
var commentDiv = document.getElementById('comments')
var captionDiv = document.getElementById('mainCaptions')
var userCommentEl = document.getElementById('userComment')

var setAvatarImg = document.getElementById('setAvatarImg')
var avatarInput = document.getElementById('setAvatarInput')

var bgmElmnt = document.getElementById('bgm')
var bgmRotateElmnt = document.getElementById('bgmRotate')

// toggle checkboxes
var isMutedElmnt = document.getElementById('isMuted')
var hideTopCommentElmnt = document.getElementById('hideTopComment')
var showTimelineElmnt = document.getElementById('showTimeline')

// raw htmls
var topComment = document.getElementById('topComment').outerHTML
var loadingIndicator = document.getElementById('loadingIndicator').outerHTML
var loadingIndicatorBefore = document.getElementById('loadingIndicatorBefore').outerHTML
document.getElementById('loadingIndicatorBefore').style.display = 'none'

// ui states
var bgPaused = false
var isFullscreen = false
var newCommentDisabled = false
var isLoadCommentErrorShowed = false

var currentLang = 'zh'
if (getCookie('lang') != '') {
    currentLang = getCookie('lang')
} else if (navigator.language.slice(0, 2) != 'zh' && navigator.language.slice(0, 3) != 'yue') {
    currentLang = 'en'
}
if (currentLang == 'en') changeLang('en')

var debug = false
if (location.hash == '#debug') {
    debug = true
    document.getElementById('lowerPanel').classList.add('lowerPanelUp')
}


// theme
//
var theme = 'default'

var d = new Date()
if (d.getMonth() + 1 == 10 && d.getDate() == 3) {
    theme = 'birthday'
}
else if ((d.getMonth() + 1 == 12 && d.getDate() == 25) || (d.getMonth() + 1 == 12 && d.getDate() == 26 && d.getHours() < 6)) {
    theme = 'christmas'
}
else if ((d.getMonth() + 1 == 2 && 10 <= d.getDate() && d.getDate() <= 15) || (d.getMonth() + 1 == 2 && d.getDate() == 9 && d.getHours() >= 6)) {
    theme = 'lunarNewYear'
}
else if (d.getHours() >= 23 || d.getHours() <= 5) {
    theme = 'night'
}

var themes = {
    '#default-theme': 'default',
    '#birthday': 'birthday',
    '#christmas': 'christmas',
    '#lunarNewYear': 'lunarNewYear',
    '#night': 'night',
    '#kami': 'kami',
}

for (var key in themes) {
    if (location.hash == key) {
        theme = themes[key]
    }
}

try {
    document.getElementById(`themeTxt-${theme}`).style.display = 'inline'
} catch (error) {
    console.log('theme indicator text not defined')
}

// theme-specific options
if (theme == 'birthday') {
    var yearsOld = d.getFullYear() - 2011
    document.getElementById('birthdayDate').innerHTML = `10/3/${d.getFullYear()} - Madoka's ${yearsOld}th birthday`
} else if (theme == 'lunarNewYear') {
    document.getElementsByClassName('fireworks')[0].style.display = 'block'
} else if (theme == 'kami') {
    try {
        printParaCharOneByOne(document.getElementsByClassName('kamiCaption')[0], 750)
    } catch (error) {
        console.log(error)
    }
}

// play theme-specific BGMs
if (theme == 'birthday') {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/mataashita.mp3'
} else if (theme == 'night') {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/night_16k.mp3'
} else if (theme == 'kami') {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/never_leave_you_alone.webm'
} else if (Math.random() > 0.5) {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/bgm_16k.mp3'
} else {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/bgm1_16k.mp3'
}


// cookies toggles
//
if (getCookie('mutebgm') == 'false' || getCookie('mutebgm') == '') {
    document.getElementById('bgm').play()
} else {
    isMutedElmnt.checked = true
}

if (getCookie('graphicsMode') != '') {
    changeGraphicsMode(getCookie('graphicsMode'))
}

if (getCookie('hideTopComment') == 'true') {
    hideTopCommentElmnt.checked = true
    document.getElementById('topComment').style.display = 'none'
    topComment = document.getElementById('topComment').outerHTML
}

if (getCookie('hiddenBanner') != document.getElementById('banner').classList[0]) {
    //document.getElementById('banner').style.display = 'block'
}

if (getCookie('showTimeline') == 'false') {
    showTimelineElmnt.checked = false
    toggleTimeline()
}


// background images
//
var bgCount
bgCount = document.getElementsByClassName(`${theme}bg`).length

// for single-image theme, show only the first image and disable slideshow
if (bgCount == 1) {
    document.getElementsByClassName(`${theme}bg`)[0].style.opacity = 1
    document.getElementsByClassName(`${theme}bg`)[0].style.display = 'block'
    document.getElementsByClassName(`${theme}bg`)[0].firstElementChild.style.backgroundImage = `url("https://haojiezhe12345.top:82/madohomu/bg/${theme}/mainbg1.jpg")`

    document.getElementsByClassName(`${theme}Caption`)[0].style.display = 'block'
    setTimeout(() => {
        captionDiv.style.opacity = 1
    }, 500);

    bgPaused = true
}

var currentBG = bgCount - 1
var currentCaption = -1

function playBG() {
    document.getElementsByClassName(`${theme}bg`)[0].classList.add('bgzoom')
    nextImg()
    setInterval(nextImg, 8000)
    setTimeout(() => {
        document.getElementsByClassName(`${theme}bg`)[0].classList.remove('bgzoom')
    }, 10000);

    nextCaption()
    setInterval(nextCaption, 8000)
}
if (location.hash == '#video') {
    time_ms = 5000
    playWalpurgis(time_ms)

    document.getElementsByClassName('walpurgisbg')[0].style.opacity = 1
    document.getElementsByClassName('walpurgisbg')[0].style.display = 'block'
    document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.backgroundImage = `url("https://haojiezhe12345.top:82/madohomu/bg/walpurgis/mainbg1.jpg")`
    document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.animationName = 'bgzoom'
    document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.animationDuration = '1.5s'

    var unmuteBGM = false
    if (bgmElmnt.muted == false) {
        bgmElmnt.muted = true
        unmuteBGM = true
    }
    setTimeout(() => {
        document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.removeProperty('animation-name')
        document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.removeProperty('animation-duration')
        setTimeout(() => {
            document.getElementsByClassName('walpurgisbg')[0].style.opacity = 0
            playBG()
            setTimeout(() => {
                if (unmuteBGM) {
                    bgmElmnt.muted = false
                }
            }, 2000);
        }, 8000);
    }, time_ms);

} else {
    playBG()
}


// user (login not implemented)
//
loadUserInfo()


// comments
//
loadComments()
setTimeout(() => {
    commentDiv.addEventListener("scroll", commentScroll)
}, 500);
setInterval(commentScroll, 1000)

var commentHorizontalScrolled = 0
var altScrollmode = false

commentDiv.addEventListener("wheel", (event) => {
    if (!isFullscreen) {
        if (altScrollmode == 1) {
            console.info(event.deltaY)
            console.info(commentDiv.scrollLeft)
            commentHorizontalScrolled += event.deltaY * 1
            if (commentHorizontalScrolled < 0)
                commentHorizontalScrolled = 0
            if (commentHorizontalScrolled > (commentDiv.scrollWidth - commentDiv.clientWidth))
                commentHorizontalScrolled = commentDiv.scrollWidth - commentDiv.clientWidth
            console.log(commentHorizontalScrolled)
            commentDiv.scrollLeft = commentHorizontalScrolled
        } else if (altScrollmode == 2 && event.deltaX == 0) {
            console.info(event)
            const e1 = new WheelEvent("wheel", {
                deltaX: event.deltaY,
                deltaMode: 0,
            });
            console.info(e1)
            commentDiv.dispatchEvent(e1)
        } else if (altScrollmode == 3) {
            (event.deltaY > 0) ? seekComment(1) : seekComment(-1)
        } else {
            commentDiv.scrollLeft += event.deltaY
        }
    }
});

const msgBgInfo = [
    {
        'description': 'Official Guidebook "You Are Not Alone"',
    },
    {
        'illustrator': 'Nine',
        'pixivid': '57114653',
    },
    {
        'illustrator': '曼曼',
        'pixivid': '91471007',
    },
    {
        'illustrator': 'カラスBTK',
        'pixivid': '99591809',
    },
    {
        'illustrator': 'さんしょう',
        'pixivid': '18530512',
    },
    {
        'illustrator': 'STAR影法師',
        'pixivid': '60649948',
    },
    {
        'illustrator': 'Nardack',
        'pixivid': '88198018',
    },
    {
        'illustrator': 'Rella',
        'pixivid': '29076044',
    },
    {
        'illustrator': 'おれつ',
        'pixivid': '57636925',
    },
    {
        'illustrator': 'ChrisTy☆クリスティ',
        'pixivid': '65489049',
    },
    {
        'illustrator': 'ChrisTy☆クリスティ',
        'pixivid': '63582832',
    },
]
const msgBgCount = msgBgInfo.length
var lastBgImgs = []


// timeline
//
document.getElementById('timelineContainer').addEventListener('click', (event) => {
    //if (debug) console.log(event.target)
    if (event.target.nodeName == 'STRONG') {
        var year = parseInt(event.target.innerHTML)
        if (event.target == document.getElementById('timeline').firstElementChild.firstElementChild) {
            clearComments()
            loadComments()
            return
        }
        var date = new Date(year + 1, 0, 0)
    } else if (event.target.nodeName == 'SPAN') {
        if (event.target.classList[0] == 'month-active') return
        var year = parseInt(event.target.parentNode.firstElementChild.innerHTML)
        var month = parseInt(event.target.innerHTML)
        var date = new Date(year, month - 1)
    } else if (event.target.hasAttribute('data-time')) {
        var date = new Date(event.target.dataset.time)
    } else return
    timestamp = date.getTime() / 1000
    //console.log(timestamp)
    clearComments(1)
    loadComments({ 'time': timestamp })
})

document.getElementById('timelineContainer').addEventListener('wheel', (event) => {
    if (!isFullscreen)
        document.getElementById('timeline').scrollLeft += event.deltaY / 2
})

document.getElementById('timelineContainer').addEventListener('mouseover', (event) => {
    if (event.target.nodeName == 'SPAN') {
        if (!isFullscreen) {
            document.getElementById('hoverCalendar').style.left = event.target.getBoundingClientRect().left + event.target.getBoundingClientRect().width / 2 + 'px'
            document.getElementById('hoverCalendar').style.bottom = document.getElementById('timelineContainer').getBoundingClientRect().height + 'px'
            document.getElementById('hoverCalendar').style.removeProperty('top')
            document.getElementById('hoverCalendar').style.removeProperty('right')
        }
        else {
            document.getElementById('hoverCalendar').style.top = event.target.getBoundingClientRect().top + event.target.getBoundingClientRect().height / 2 + 'px'
            document.getElementById('hoverCalendar').style.right = document.getElementById('timelineContainer').getBoundingClientRect().width + 'px'
            document.getElementById('hoverCalendar').style.removeProperty('left')
            document.getElementById('hoverCalendar').style.removeProperty('bottom')
        }
        document.getElementById('hoverCalendar').style.removeProperty('display')

        document.getElementById('hoverCalendar').innerHTML = ''
        var year = parseInt(event.target.parentNode.firstElementChild.innerHTML)
        var month = parseInt(event.target.innerHTML)
        document.getElementById('hoverCalendar').appendChild(html2elmnt(`<div>${year}-${('0' + month).slice(-2)}${(year <= 2022) ? ' (kami.im)' : ''}</div>`))
        for (let i = 1; i <= new Date(year, month, 0).getDate(); i++) {
            if (new Date(year, month - 1, i).getTime() / 1000 < maxTimelineTime)
                document.getElementById('hoverCalendar').appendChild(html2elmnt(`<div data-time="${new Date(year, month - 1, i).toDateString()}">${i}</div>`))
        }
    } else if (event.target.nodeName == 'STRONG') {
        document.getElementById('hoverCalendar').style.display = 'none'
    }
})

document.getElementById('goto').addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        clearComments(1);
        loadComments({ 'from': document.getElementById('goto').value })
    }
})


// image viewer
//
var imgViewerMouseActive = false
var imgViewerOffsetX = 0
var imgViewerOffsetY = 0
var imgViewerScale = 1
var imgViewerMouseMoved = false


// global Esc key handler
//
document.onkeydown = function (e) {
    //console.log(e.key)
    if (e.key == 'Escape') {
        if (document.getElementById('imgViewerBox').style.display == 'block') {
            closeImgViewer()
        } else if (document.getElementById('popupContainer').style.display == 'flex') {
            closePopup()
        } else {
            document.getElementById('lowerPanel').classList.remove('lowerPanelUp')
        }
    }
}


// hash change handler
//
if (window.location.hash == '#view-img' || window.location.hash == '#popup') {
    window.location.hash = ''
}

window.onhashchange = function (e) {
    //console.log(e.oldURL.split('#')[1], e.newURL.split('#')[1])
    if (e.oldURL.split('#')[1] == 'view-img') {
        closeImgViewer()
    }
    if (e.oldURL.split('#')[1] == 'popup' && e.newURL.split('#')[1] != 'view-img') {
        closePopup()
    }
}


// PWA init
//
var installPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    //console.log(`'beforeinstallprompt' event was fired.`);
});

var isInStandaloneMode = false
isInStandaloneMode = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');


// everything is now initiated
//
jsLoaded = true
