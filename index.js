
//var madohomu_root = ''
//madohomu_root = 'https://ipv6.haojiezhe12345.top:82/madohomu/'

// settings
//
const Settings = {
    elements: {
        showKami: document.getElementById('showKami'),
    },

    init() {
        this.load()

        this.elements.showKami.onchange = e => this.showKami = e.target.checked
    },

    load() {
        if (getConfig('showKami') == 'true') this.showKami = true
    },

    get pageScale() {
        let x = parseFloat(document.documentElement.style.fontSize) / 16
        return x ? x : 1
    },
    set pageScale(scale) {
        document.documentElement.style.fontSize = `${16 * scale}px`
    },

    get showKami() {
        return this.elements.showKami.checked
    },
    set showKami(value) {
        this.elements.showKami.checked = value
        setConfig('showKami', value)
        setTimeout(() => {
            if (Comments.hasItem()) {
                clearComments()
                loadComments()
            }
        }, 0);
    },
}

try {
    Settings.init()
} catch (error) {
    logErr(error, 'failed to init settings')
}


function loadComments(queryObj = {}, keepPosEl = undefined, noKami = false) {
    //if (from == null && time == null) setTodayCommentCount()

    var isCommentsNewer = queryObj.db == 'kami'
        ? (queryObj.from > getMaxKamiID())
        : (queryObj.from > getMaxCommentID())
    var isCommentsOlder = queryObj.db == 'kami'
        ? (queryObj.from < getMinKamiID())
        : (queryObj.from < getMinCommentID())

    const xhr = new XMLHttpRequest();

    xhr.open("GET", "https://haojiezhe12345.top:82/madohomu/api/comments" + obj2queryString(queryObj));

    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.status == 200) {
            //console.log(xhr.response);
            isLoadCommentErrorShowed = false

            if (debug) console.log(queryObj)
            if (debug) console.log('isNewer:', isCommentsNewer, ' isOlder:', isCommentsOlder, ' length:', xhr.response.length)

            // handle empty response
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

            // update timeline & today comment count
            if (xhr.response[0].time > maxTimelineTime) {
                maxTimelineTime = xhr.response[0].time
                loadTimeline(maxTimelineTime)
                setTodayCommentCount()
            }

            // save old comment position before inserting new comments
            var keepPos = (xhr.response[0].time > getMaxCommentTime() || keepPosEl != undefined)
            if (debug) console.log('KeepPos:', keepPos)
            if (keepPosEl == undefined) {
                keepPosEl = document.getElementById('loadingIndicatorBefore').nextElementSibling
            }
            var prevCommentTop = keepPosEl.getBoundingClientRect().top
            var prevCommentLeft = keepPosEl.getBoundingClientRect().left

            // save prev Max/MinCommentTime for loading kami SxS
            var prevMaxCommentTime = getMaxCommentTime()
            var prevMinCommentTime = getMinCommentTime()

            // insert comments
            for (let comment of xhr.response) {

                // skip hidden
                if (comment.hidden == 1 && !document.getElementById('showHidden').checked) {
                    console.log('skipping hidden comment #' + comment.id + ' ' + comment.comment)
                    continue
                }
                // skip 2024 kami msgs when loading 2023.05
                if (queryObj.db == 'kami' && comment.id >= 35668 && getMaxCommentTime() <= 1684651800) {
                    continue
                }

                insertComment(comment, queryObj.db == 'kami' ? true : false)

            }

            // restore the postition after inserting comments
            if (keepPos && document.getElementById('topComment') == null) {
                if (debug) console.log(keepPosEl)
                if (isFullscreen) {
                    var newCommentTop = keepPosEl.getBoundingClientRect().top
                    commentDiv.scrollTop += newCommentTop - prevCommentTop
                } else {
                    var newCommentLeft = keepPosEl.getBoundingClientRect().left
                    commentDiv.scrollLeft += newCommentLeft - prevCommentLeft
                }
            }

            // load kami SxS
            if (Settings.showKami && queryObj.db == null && noKami == false) {
                if (isCommentsOlder) {
                    loadComments({
                        'timeMin': xhr.response[xhr.response.length - 1].time,
                        'timeMax': prevMinCommentTime,
                        'db': 'kami'
                    })
                } else if (isCommentsNewer) {
                    loadComments({
                        'timeMin': prevMaxCommentTime,
                        'timeMax': xhr.response[0].time,
                        'db': 'kami'
                    }, keepPosEl)
                } else if (queryObj.time != null || queryObj.from != null) {
                    loadComments({
                        'timeMin': xhr.response[xhr.response.length - 1].time,
                        'timeMax': xhr.response[0].time,
                        'db': 'kami'
                    })
                } else if (queryObj.timeMin == null && queryObj.timeMax == null) {
                    loadComments({
                        'timeMin': xhr.response[xhr.response.length - 1].time,
                        'timeMax': parseInt(Date.now() / 1000),
                        'db': 'kami'
                    })
                }
            }

            setTimelineActiveMonth(true)

            if (debug) console.log('maxID:', getMaxCommentID(), ' minID:', getMinCommentID())

        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.onerror = () => {
        if (isLoadCommentErrorShowed == false && false) {
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
        return compareArr(
            [comment.time, comment.id],
            [parseInt(commentList[i].dataset.timestamp),
            commentList[i].id == ''
                ? parseInt(commentList[i].dataset.kamiid.replace('#', ''))
                : parseInt(commentList[i].id.replace('#', ''))
            ])
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

    if (isKami == true) {
        comment.comment = comment.comment.replace('This message is sent using a proxy. If it is dirty, please click here to delete it.', '')
    }

    var imgsDOM = '<br><br>'
    try {
        if (comment.image != '') {
            for (var i of comment.image.split(',')) {
                imgsDOM += /*html*/`<img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/api/data/images/posts/${i}.jpg" onclick="viewImg(this.src); document.getElementById('lowerPanel').classList.add('lowerPanelUp')">`
            }
        }
    } catch (error) { }

    commentDiv.insertBefore(html2elmnt(/*html*/`
        <div class="commentBox commentItem" ${isKami == true ? `data-kamiid="#${comment.id}` : `id="#${comment.id}`}" data-timestamp="${comment.time}">
            <img class="bg" loading="lazy" src="https://haojiezhe12345.top:82/madohomu/bg/msgbg${randBG}.jpg" ${(comment.hidden == 1) ? 'style="display: none;"' : ''}>
            <div class="bgcover"></div>
            <img class="avatar" loading="lazy" src="${isKami == true ? `https://kami.im/getavatar.php?uid=${comment.uid}` : `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${comment.sender}.jpg`}"
                onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'"
                onclick="
                    showUserComment('${comment.sender.replace(/\'/g, "\\'")}'${isKami == true ? `, ${comment.uid}` : ''});
                    document.getElementById('lowerPanel').classList.add('lowerPanelUp')
                ">
            <div class="sender" onclick="
                showUserComment('${comment.sender.replace(/\'/g, "\\'")}'${isKami == true ? `, ${comment.uid}` : ''});
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

    Comments.scrollPaused = false
    commentsUpToDate = false
    clearTimeout(window.clearCommentsUpToDateTimeout)

    newCommentDisabled = false
    document.body.classList.remove('touchKeyboardShowing')
}

function loadOlderComments() {
    if (getMinCommentID() == null || getMinCommentID() <= 1) {
        // no madohomu, or reached end
        if (getMinKamiID() == null) {
            // madohomu reached end, need to load kami
            loadComments({ 'from': 35662, 'db': 'kami' })
        } else {
            // load older kami
            loadComments({ 'from': getMinKamiID() - 1, 'db': 'kami' })
        }
    } else {
        // load older madohomu
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
        // no kami, or >2023.05
        if (getMaxCommentID() == null) {
            // jumped to a kami msg >2023.05 and need to load madohomu
            // load newer madohomu by maxKamiTime (can be omitted, it will load on next commentScroll)
            if (getMaxKamiID() == 35662) loadComments({ 'time': getMaxCommentTime() }, document.getElementById('loadingIndicatorBefore').nextElementSibling)
            // load madohomu between minKamiTime and maxKamiTime, no need if kami <2023.05
            if (getMaxKamiID() != 35662) loadComments({ 'timeMin': getMinCommentTime(), 'timeMax': getMaxCommentTime() }, document.getElementById('loadingIndicatorBefore').nextElementSibling, true)
        } else {
            // load newer madohomu
            loadComments({ 'from': getMaxCommentID() + count, 'count': count })
        }
    } else {
        // load kami <2023.05
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
    var commentList = document.querySelectorAll('.commentItem')
    if (commentList.length > 0) return parseInt(commentList[0].dataset.timestamp)
}

function getMinCommentTime() {
    var commentList = document.querySelectorAll('.commentItem')
    if (commentList.length > 0) return parseInt(commentList[commentList.length - 1].dataset.timestamp)
}

// new message box
//
function newComment() {
    commentDiv.scrollLeft = 0
    commentDiv.scrollTop = 0

    prevWindowWidth = window.innerWidth
    prevWindowHeight = window.innerHeight
    if (debug) console.log(`${prevWindowWidth}x${prevWindowHeight}`)

    if (newCommentDisabled) {
        document.getElementById('msgText').focus({ preventScroll: true })
        return
    }

    commentDiv.insertBefore(html2elmnt(/*html*/`
        <div class="commentBox" id="newCommentBox">
            <div class="bgcover"></div>
            <img class="avatar" id="msgPopupAvatar" src="https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getConfig('username')}.jpg" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'" onclick="showPopup('setNamePopup')">
            <div class="sender" id="senderText" onclick="showPopup('setNamePopup')">${getConfig('username')}</div>
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

    for (let i = 0; i < imgUploadInput.files.length; i++) {
        const imgfile = imgUploadInput.files[i]

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
                var width = image.width;
                var height = image.height;

                const max_pixels = 2.1 * 1000 * 1000;
                if (width * height > max_pixels) {
                    let zoom = Math.sqrt(max_pixels / (width * height))
                    width = Math.round(width * zoom)
                    height = Math.round(height * zoom)
                }

                var canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0, width, height);

                var imgDataURL = canvas.toDataURL("image/jpeg")

                document.getElementById('uploadImgList').appendChild(html2elmnt(/*html*/`
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
    var sender = getConfig('username')
    var msg = document.getElementById('msgText').value

    var imgList = []
    var uploadImgClass = document.getElementsByClassName('uploadImg')
    if (uploadImgClass.length > 0) {
        for (let i = 0; i < uploadImgClass.length; i++) {
            const imgElmnt = uploadImgClass[i]
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

// popup
//
const Popup = {
    elements: {
        popupContainer: document.getElementById('popupContainer'),
        popupItems: document.getElementsByClassName('popupItem'),
    },

    hideAllPopupItems() {
        for (let i = 0; i < this.elements.popupItems.length; i++) {
            this.elements.popupItems[i].style.display = 'none';
        }
    },

    show(popupID) {
        if (location.hash.slice(0, 7) != '#popup-') {
            location.hash = 'popup'
        }

        this.hideAllPopupItems()
        this.elements.popupContainer.style.removeProperty('display');
        document.getElementById(popupID).style.removeProperty('display');

        switch (popupID) {
            case 'setNamePopup':
                document.getElementById('setNameInput').value = getConfig('username')
                break;

            case 'setAvatarPopup':
                avatarInput.value = ''
                setAvatarImg.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getConfig('username')}.jpg?${new Date().getTime()}`
                setAvatarImg.onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
                break

            case 'getImgPopup':
                document.getElementById('getImgPopup').firstElementChild.lastElementChild.innerHTML = ''
                for (var key in Theme.themes) {
                    var themeName = Theme.themes[key]
                    try {
                        for (let j = 0; j < document.getElementsByClassName(`${themeName}bg`).length; j++) {
                            document.getElementById('getImgPopup').firstElementChild.lastElementChild.appendChild(html2elmnt(/*html*/`
                                <img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/bg/${themeName != 'default' ? themeName : ''}/mainbg${j + 1}.jpg" style="min-height: 40vh;" onload="this.style.removeProperty('min-height')">
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
                    document.getElementById('getImgPopup').firstElementChild.lastElementChild.appendChild(html2elmnt(/*html*/`
                        <img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/bg/msgbg${i + 1}.jpg" style="min-height: 40vh;" onload="this.style.removeProperty('min-height')">
                        <p>
                            ${msgBgInfo[i].description != null
                            ? msgBgInfo[i].description
                            : `Artwork by ${msgBgInfo[i].illustrator} <a href="https://www.pixiv.net/artworks/${msgBgInfo[i].pixivid}" target="_blank">Pixiv↗</a>`}
                        </p>
                        <br>
                    `))
                }
                break

            case 'displaySettings':
                let mode = getConfig('graphicsMode')
                document.getElementById('graphicsMode').value = mode ? mode : 'high'
                document.getElementById('pageZoomController').value = Math.round(Settings.pageScale * 100)
                break

            default:
                break;
        }
    },

    close() {
        if (location.hash == '#popup') {
            history.back()
            return
        }

        this.elements.popupContainer.style.display = 'none';
        this.hideAllPopupItems()
    },

    isOpen() {
        return this.elements.popupContainer.style.display != 'none' ? true : false
    },

    init() {
        this.elements.popupContainer.onclick = e => {
            if (e.target.classList.contains('closeBtn') || e.target.id == 'popupBG') {
                this.close()
            }
        }
    },
}

const showPopup = id => Popup.show(id)
const closePopup = () => Popup.close()
try {
    Popup.init()
} catch (error) {
    logErr(error, 'failed to init popup')
}

// user related
//
function setUserName() {
    var inputName = document.getElementById('setNameInput').value;

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

    if (['', '匿名用户'].includes(inputName)) {
        closePopup()
        return
    }

    setConfig('username', inputName)

    if (getConfig('username') == '10.3') {
        //location.reload()
        closePopup()
    } else {
        showPopup('setAvatarPopup')
    }

    loadUserInfo()
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

            fetch(canvas.toDataURL("image/jpeg")).then(res => res.blob()).then((blob) => {

                var xhr = new XMLHttpRequest();
                xhr.open("POST", "https://haojiezhe12345.top:82/madohomu/api/upload");
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        console.log(xhr.responseText);
                        setAvatarImg.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getConfig('username')}.jpg?${new Date().getTime()}`
                        loadUserInfo()
                    }
                };
                var formData = new FormData();
                formData.append(`${getConfig('username')}.jpg`, blob)
                xhr.send(formData);

            })
        }
        image.src = fileReader.result;
    };
    fileReader.readAsDataURL(avatarInput.files[0]);
}

function loadUserInfo() {
    var userInfo = document.getElementById('userInfo')
    var avatar = document.getElementById('userInfoAvatar')
    var name = document.getElementById('userInfoName')

    avatar.onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
    avatar.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getConfig('username')}.jpg?${new Date().getTime()}`

    if (getConfig('username') == '') {
        name.innerHTML = '<span class="ui zh">访客</span><span class="ui en">Anonymous</span>'
        userInfo.onclick = () => { showPopup('setNamePopup') }
        userInfo.classList.add('nologin')
    } else {
        name.innerText = getConfig('username')
        userInfo.onclick = undefined
        userInfo.classList.remove('nologin')
    }

    try {
        document.getElementById('senderText').innerHTML = getConfig('username')
        document.getElementById('msgPopupAvatar').src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getConfig('username')}.jpg?${new Date().getTime()}`
        document.getElementById('msgPopupAvatar').onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
    } catch (error) { }
}

function showUserComment(user, useKamiAvatar = false) {
    if (debug) console.log(user)
    if ((user == null && userCommentUser == '') || user == '') {
        if (debug) console.log('empty user!')
        return
    };

    userCommentEl.removeEventListener('scroll', userCommentScroll)

    if (user != null) {
        userCommentEl.innerHTML = /*html*/`
        <h2>
            <img src="${useKamiAvatar != false ? `https://kami.im/getavatar.php?uid=${useKamiAvatar}` : `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${user}.jpg`}" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'">
            <span>${user == '匿名用户' ? '<span class="ui zh">匿名用户</span><span class="ui en">Anonymous</span>' : user}${useKamiAvatar != false ? `<span class='kamiuid'>${useKamiAvatar}</span>` : ''}</span>
        </h2>
        `
        showPopup('showUserCommentPopup')
        //userCommentEl.scrollTop = 0
        userCommentUser = user
        userCommentOffset = 0
        userCommentIsKami = false
    }

    const xhr = new XMLHttpRequest();

    if (user != null) {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?user=${user}&count=50`);
    } else {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?user=${userCommentUser}&from=${userCommentOffset}&count=50${userCommentIsKami == true ? '&db=kami' : ''}`);
        if (debug) console.log(userCommentUser, userCommentOffset)
    }

    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.status == 200) {

            for (var comment of xhr.response) {

                var time = new Date(comment.time * 1000)
                date = time.toLocaleDateString()
                hour = time.toLocaleTimeString()

                var imgsDOM = '<i></i>'
                try {
                    if (comment.image != '') {
                        for (var i of comment.image.split(',')) {
                            imgsDOM += /*html*/`<img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/api/data/images/posts/${i}.jpg" onclick="viewImg(this.src)">`
                        }
                    }
                } catch (error) { }

                userCommentEl.appendChild(html2elmnt(/*html*/`
                    <div>
                        <p>${date + ' ' + hour}<span>#${comment.id}</span></p>
                        <p>
                            <span onclick="clearComments(1); loadComments({ 'from': ${comment.id}${userCommentIsKami == true ? ", 'db': 'kami'" : ""} }); closePopup()">
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
                userCommentEl.appendChild(html2elmnt(/*html*/`
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
    if (toBottom < 100 && Popup.isOpen()) {
        showUserComment()
    }
}

// themes
//
const Theme = {
    elements: {
        bgs: document.getElementsByClassName('mainbg'),
        captionContainer: document.getElementById('mainCaptions'),
        captions: document.getElementById('mainCaptions').children,
        themeIndicators: document.getElementById('currentTheme').children,
        listSelectors: document.querySelectorAll('#themeList>div[data-theme]'),
        lowerPanel: document.getElementById('lowerPanel'),
    },

    timers: {
        timeouts: [],
        intervals: [],

        setTimeout(f, timeout) {
            while (this.timeouts.length >= 100) this.timeouts.shift()  // limit max length to 100
            this.timeouts.push(setTimeout(() => f(), timeout))
        },
        setInterval(f, timeout) {
            this.intervals.push(setInterval(() => f(), timeout))
        },

        reset() {
            this.timeouts.forEach(i => {
                clearTimeout(i)
            })
            this.intervals.forEach(i => {
                clearInterval(i)
            })
            this.timeouts = []
            this.intervals = []
        },
    },

    themes: {
        '#default-theme': 'default',
        '#birthday': 'birthday',
        '#christmas': 'christmas',
        '#lunarNewYear': 'lunarNewYear',
        '#night': 'night',
        '#kami': 'kami',
    },

    theme: '',
    bgPaused: false,
    currentBG: -1,
    currentCaption: -1,

    init() {
        this.setTheme(this.themes[location.hash])

        setInterval(() => {
            if (!this.lastAutoTheme) this.lastAutoTheme = this.getAutoTheme()
            let newAutoTheme = this.getAutoTheme()
            //console.log(this.lastAutoTheme, newAutoTheme)
            if (this.lastAutoTheme != newAutoTheme) this.setTheme()
            this.lastAutoTheme = newAutoTheme
        }, 1000)

        Array.from(this.elements.listSelectors).forEach(e => {
            e.onclick = () => {
                this.setTheme(e.dataset.theme)
                Popup.close()
            }
        })
    },

    getAutoTheme() {
        let d = new Date()
        if (d.getMonth() + 1 == 10 && d.getDate() == 3) {
            return 'birthday'
        }
        else if ((d.getMonth() + 1 == 12 && d.getDate() == 25) || (d.getMonth() + 1 == 12 && d.getDate() == 26 && d.getHours() < 6)) {
            return 'christmas'
        }
        else if ((d.getMonth() + 1 == 2 && 10 <= d.getDate() && d.getDate() <= 15) || (d.getMonth() + 1 == 2 && d.getDate() == 9 && d.getHours() >= 6)) {
            return 'lunarNewYear'
        }
        else if (d.getHours() >= 23 || d.getHours() <= 5) {
            return 'night'
        }
        else {
            return 'default'
        }
    },

    setTheme(theme) {
        if (!theme) theme = this.getAutoTheme()
        console.log(`setting theme to "${theme}"`)

        Array.from(this.elements.bgs).forEach(el => {
            el.classList.remove('ready', 'animating', 'visible')
        })
        Array.from(this.elements.captions).forEach(el => {
            el.classList.remove('visible')
        })
        Array.from(this.elements.themeIndicators).forEach(el => {
            el.classList.remove('visible')
        })

        try {
            document.getElementById(`themeTxt-${theme}`).classList.add('visible')
        } catch (error) {
            logErr(error, 'theme indicator text not defined')
        }

        // theme-specific options
        try {
            if (theme == 'birthday') {
                let d = new Date()
                let yearsOld = d.getFullYear() - 2011
                document.getElementById('birthdayDate').innerHTML = `10/3/${d.getFullYear()} - Madoka's ${yearsOld}th birthday`
            }
            if (theme == 'lunarNewYear') {
                document.getElementsByClassName('fireworks')[0].classList.add('visible')
            } else {
                document.getElementsByClassName('fireworks')[0].classList.remove('visible')
            }
            if (theme == 'kami') {
                printParaCharOneByOne(document.getElementsByClassName('kamiCaption')[0], 750)
                if (!Settings.showKami) {
                    Settings.elements.showKami.checked = true
                    setTimeout(() => {
                        if (Comments.hasItem()) {
                            clearComments()
                            loadComments()
                        }
                    }, 0);
                }
            }
        } catch (error) {
            logErr(error, 'failed to init theme-specific options')
        }

        this.timers.reset()

        this.theme = theme
        this.bgPaused = false
        this.currentBG = this.getCurrentBgCount() - 1
        this.currentCaption = -1

        this.getCurrentBgs()[0].classList.add('bgzoom')
        this.timers.setTimeout(() => this.getCurrentBgs()[0].classList.remove('bgzoom'), 10500)

        this.nextImg()
        this.nextCaption()
        this.timers.setInterval(() => this.nextImg(), 8000)
        this.timers.setInterval(() => this.nextCaption(), 8000)

        this.elements.lowerPanel.classList.add('animating')
        this.timers.setTimeout(() => this.elements.lowerPanel.classList.remove('animating'), 1700)
        try {
            MusicPlayer.setActiveSong(this.getThemeMusic())
            if (!MusicPlayer.userPaused) MusicPlayer.play()
        } catch (error) { }
    },

    getThemeMusic() {
        let music = {
            birthday: 'また あした - 悠木碧',
            night: 'Scaena felix - オルゴール ミドリ',
            kami: 'never leave you alone - 梶浦由記',
        }
        return music[this.theme] ||
            (Math.random() > 0.5
                ? 'Sagitta luminis - オルゴール ミドリ'
                : '君の銀の庭 - オルゴール ミドリ')
    },

    getCurrentBgs() {
        return document.querySelectorAll(`.mainbg.${this.theme}bg`)
    },

    getCurrentBgCount() {
        return document.getElementsByClassName(`${this.theme}bg`).length
    },

    nextImg() {
        if (this.bgPaused) return

        let prev = this.currentBG
        this.currentBG = prev + 1 < this.getCurrentBgCount() ? prev + 1 : 0
        let next = this.currentBG + 1 < this.getCurrentBgCount() ? this.currentBG + 1 : 0

        let bgs = document.getElementsByClassName(`${this.theme}bg`)
        let bgurl = this.theme == 'default' ? 'https://haojiezhe12345.top:82/madohomu/bg/' : `https://haojiezhe12345.top:82/madohomu/bg/${this.theme}/`

        try {
            bgs[prev].classList.remove('visible')
            bgs[this.currentBG].classList.add('ready', 'animating', 'visible')
            bgs[this.currentBG].firstElementChild.style.backgroundImage = `url("${bgurl}mainbg${this.currentBG + 1}.jpg?2")`
            // for single-image theme, show only the first image and disable slideshow
            if (prev == this.currentBG) {
                this.timers.setTimeout(() => {
                    this.bgPaused = true
                }, 1000);
                return
            }
            this.timers.setTimeout(() => {
                bgs[prev].classList.remove('ready', 'animating')
                bgs[next].classList.add('ready')
                bgs[next].firstElementChild.style.backgroundImage = `url("${bgurl}mainbg${next + 1}.jpg?2")`
            }, 2500);
        } catch (error) {
            logErr(error, 'failed to show next image')
        }
    },

    nextCaption() {
        if (this.bgPaused) return

        try {
            var themeCaptions = document.getElementsByClassName(`${this.theme}Caption`);
        } catch (error) {
            console.log(error)
            return
        }

        if (themeCaptions.length == 1) {
            setOneTimeCSS(this.elements.captionContainer, { transition: 'none' })
            this.elements.captionContainer.style.opacity = 0
            this.timers.setTimeout(() => {
                themeCaptions[0].classList.add('visible');
                this.elements.captionContainer.style.opacity = 1
            }, 500);
            return
        }

        this.elements.captionContainer.style.opacity = 0
        this.timers.setTimeout(() => {
            for (var i = 0; i < themeCaptions.length; i++) {
                themeCaptions[i].classList.remove('visible');
            }
            if (this.currentCaption < themeCaptions.length - 1) {
                this.currentCaption++
            } else {
                this.currentCaption = 0
            }
            themeCaptions[this.currentCaption].classList.add('visible');
            this.elements.captionContainer.style.opacity = 1
        }, 1500);
    },
}

try {
    Theme.init()
    var theme = Theme.theme
} catch (error) {
    logErr(error, 'failed to init theme')
}

function printParaCharOneByOne(divEl, delay = 0) {
    const paras = []
    for (let i = 0; i < divEl.children.length; i++) {
        const paraEl = divEl.children[i]
        paras.push(paraEl.innerHTML)
        paraEl.innerHTML = ''
    }
    let paraIndex = 0
    let charIndex = 0
    const pauseChars = [',', '.']
    const pauseMultiplier = 6
    let pauseCount = 0
    setTimeout(() => {
        let printInterval = setInterval(() => {
            if (paraIndex < paras.length) {
                if (charIndex < paras[paraIndex].length) {
                    const char = paras[paraIndex][charIndex]
                    if (pauseChars.includes(char)) {
                        if (pauseCount == 0) {
                            divEl.children[paraIndex].innerHTML += char
                        }
                        if (pauseCount < pauseMultiplier) {
                            pauseCount++
                            return
                        } else {
                            pauseCount = 0
                        }
                    } else {
                        divEl.children[paraIndex].innerHTML += char
                    }
                    charIndex++
                } else {
                    charIndex = 0
                    paraIndex++
                }
            } else {
                clearInterval(printInterval)
            }
        }, 50);
    }, delay);
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
    if (!targetLang) {
        if (navigator.language.slice(0, 2) == 'zh' || navigator.language.slice(0, 3) == 'yue') {
            targetLang = 'zh'
        } else {
            targetLang = 'en'
        }
    }
    if (!['zh', 'en'].includes(targetLang)) {
        console.log(`invalid lang "${targetLang}"`)
        return
    }
    document.getElementById('langCSS').innerHTML = /*css*/`
    .ui {
        display: none !important;
    }
    .ui.${targetLang} {
        display: inline !important;
    }
    `
    console.log(`changed lang to ${targetLang}`)
}

function changeGraphicsMode(mode) {
    if (mode == 'high') {
        document.body.classList.remove('lowend')
        document.body.classList.remove('midend')
    } else if (mode == 'mid') {
        document.body.classList.remove('lowend')
        document.body.classList.add('midend')
    } else if (mode == 'low') {
        document.body.classList.add('lowend')
        document.body.classList.remove('midend')
    } else return
    setConfig('graphicsMode', mode)
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

function setTimelineActiveMonth(scroll = false) {
    try {
        var timeStamp = parseInt(getCurrentComment().dataset.timestamp) * 1000
        var date = new Date(timeStamp)
        var year = date.getFullYear()
        var month = date.getMonth() + 1
        //if (debug) console.log(id, timeStamp, year, month)
        const yearEls = document.getElementById('timeline').children
        for (let i = 0; i < yearEls.length; i++) {
            const yearEl = yearEls[i]
            if (yearEl.firstElementChild.innerHTML == year) {
                yearEl.firstElementChild.classList.add('month-active')
                if (scroll) yearEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
            } else {
                yearEl.firstElementChild.classList.remove('month-active')
            }
            for (let i = 0; i < yearEl.children.length; i++) {
                const monthEl = yearEl.children[i]
                if (monthEl.nodeName == 'SPAN') {
                    if (yearEl.firstElementChild.innerHTML == year && monthEl.innerHTML == month) {
                        monthEl.classList.add('month-active')
                        //if (scroll) monthEl.scrollIntoView(false)
                    } else {
                        monthEl.classList.remove('month-active')
                    }
                }
            }
        }
        setHoverCalendarActiveDay()
    } catch (error) {
        if (debug) console.log(error)
    }
}

function setHoverCalendarActiveDay() {
    try {
        var timeStamp = parseInt(getCurrentComment().dataset.timestamp) * 1000
        var date = new Date(timeStamp)
        const dayEls = hoverCalendarEl.querySelectorAll('div[data-time]')
        for (let i = 0; i < dayEls.length; i++) {
            const dayEl = dayEls[i]
            var date1 = new Date(dayEl.dataset.time)
            if (date.getFullYear() == date1.getFullYear() && date.getMonth() == date1.getMonth() && date.getDate() == date1.getDate()) {
                dayEl.classList.add('day-active')
            } else {
                dayEl.classList.remove('day-active')
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

// toggles
//
function toggleFullscreen() {
    if (!isFullscreen) {
        var scrollPercent = commentDiv.scrollLeft / (commentDiv.scrollWidth - commentDiv.clientWidth)
        setTimeout(() => {
            commentDiv.scrollTop = (commentDiv.scrollHeight - commentDiv.clientHeight) * scrollPercent
            setTimelineActiveMonth(true)
        }, 50);
        document.body.classList.add('fullscreen')
        document.getElementById('fullscreenBtn').innerHTML = '<span class="ui zh">退出全屏 ↙</span><span class="ui en">Collapse ↙</span>'
        isFullscreen = true
    } else {
        var scrollPercent = commentDiv.scrollTop / (commentDiv.scrollHeight - commentDiv.clientHeight)
        setTimeout(() => {
            commentDiv.scrollLeft = (commentDiv.scrollWidth - commentDiv.clientWidth) * scrollPercent
            setTimelineActiveMonth(true)
        }, 50);
        document.body.classList.remove('fullscreen')
        document.getElementById('fullscreenBtn').innerHTML = '<span class="ui zh">全屏 ↗</span><span class="ui en">Expand ↗</span>'
        isFullscreen = false
    }
    Comments.pauseScroll(500)
}

function toggleTopComment() {
    setConfig('hideTopComment', hideTopCommentElmnt.checked)
    if (hideTopCommentElmnt.checked) {
        document.getElementById('topComment').style.display = 'none'
        topComment = document.getElementById('topComment').outerHTML
    } else {
        document.getElementById('topComment').style.removeProperty('display')
        topComment = document.getElementById('topComment').outerHTML
    }
}

function toggleTimeline() {
    setConfig('showTimeline', showTimelineElmnt.checked)
    if (showTimelineElmnt.checked) {
        document.getElementById('timelineContainer').style.display = 'block'
        commentDiv.classList.add('noscrollbar')
    } else {
        document.getElementById('timelineContainer').style.display = 'none'
        commentDiv.classList.remove('noscrollbar')
    }
}

// utilities
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

function getConfig(key) {
    if (localStorage.getItem(key) == null) {
        if (getCookie(key) != '') {
            setConfig(key, getCookie(key))
            document.cookie = `${key}=;expires=${new Date(0).toUTCString()};path=/`;
        } else {
            return ''
        }
    }
    return localStorage.getItem(key)
}

function setConfig(key, value) {
    if (value === '') {
        localStorage.removeItem(key)
    } else {
        localStorage.setItem(key, value)
    }
}

function html2elmnt(html) {
    html = html.trim()
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content;
}

function htmlEscape(txt) {
    return txt
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>")
        .replace(/\s/g, "&nbsp;")
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

function getFileListAsync(url) {
    return new Promise((resolve, reject) => {
        fetch(url).then(res => Promise.all([res.url, res.text()])).then(([url, text]) => {
            const doc = document.createElement('template')
            doc.innerHTML = text
            //console.log(url, doc)
            const filelist = []
            const alist = doc.content.querySelectorAll('a')
            for (let i = 0; i < alist.length; i++) {
                let a = alist[i]
                if (a.previousSibling && !a.previousSibling.textContent.includes('<dir>')) {
                    filelist.push(url + encodeURIComponent(a.textContent))
                }
            }
            resolve(filelist)
        })
    })
}

function getFileNameWithoutExt(path, decodeuri = false) {
    if (decodeuri) {
        return decodeURIComponent(path.match(/[^\\/]+(?=\.\w+$)/)[0])
    }
    else {
        return path.match(/[^\\/]+(?=\.\w+$)/)[0]
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getArrayNextItem(arr, item) {
    let x = arr[arr.indexOf(item) + 1]
    return x != null ? x : arr[0]
}

function getArrayPrevItem(arr, item) {
    let x = arr[arr.indexOf(item) - 1]
    return x != null ? x : arr[arr.length - 1]
}

function logErr(err, msg) {
    console.warn(err)
    console.error(msg)
}

function setOneTimeCSS(el, styles) {
    for (let style in styles) {
        el.style[style] = styles[style]
    }
    setTimeout(() => {
        for (let style in styles) {
            el.style.removeProperty(style)
        }
    }, 0);
}


// common vars
//
var commentsUpToDate = false
var maxTimelineTime = 0

var userCommentUser = ''
var userCommentOffset = 0
var userCommentIsKami = false

// document elmnts
var commentDiv = document.getElementById('comments')
var userCommentEl = document.getElementById('userComment')

var setAvatarImg = document.getElementById('setAvatarImg')
var avatarInput = document.getElementById('setAvatarInput')

var hoverCalendarEl = document.getElementById('hoverCalendar')

// toggle checkboxes
var hideTopCommentElmnt = document.getElementById('hideTopComment')
var showTimelineElmnt = document.getElementById('showTimeline')

// raw htmls
var topComment = document.getElementById('topComment').outerHTML
var loadingIndicator = document.getElementById('loadingIndicator').outerHTML
var loadingIndicatorBefore = document.getElementById('loadingIndicatorBefore').outerHTML
document.getElementById('loadingIndicatorBefore').style.display = 'none'

// ui states
var isFullscreen = false
var newCommentDisabled = false
var isLoadCommentErrorShowed = false


// set title link href
document.querySelector('#mainTitle>a').href = location.origin + location.pathname

// set language
changeLang(getConfig('lang'))

var debug = false
if (location.hash == '#debug') {
    debug = true
    document.getElementById('lowerPanel').classList.add('lowerPanelUp')
}


// show popup by hash
if (location.hash.slice(0, 7) == '#popup-') {
    try {
        showPopup(location.hash.slice(7))
    } catch (error) {
        closePopup()
        location.hash = ''
    }
}


// cookies toggles
//
if (getConfig('graphicsMode') != '') {
    changeGraphicsMode(getConfig('graphicsMode'))
}

if (getConfig('hideTopComment') == 'true') {
    hideTopCommentElmnt.checked = true
    document.getElementById('topComment').style.display = 'none'
    topComment = document.getElementById('topComment').outerHTML
}

if (getConfig('hiddenBanner') != document.getElementById('banner').classList[0]) {
    //document.getElementById('banner').style.display = 'block'
}

if (getConfig('showTimeline') == 'false') {
    showTimelineElmnt.checked = false
    toggleTimeline()
}


// background images
//
function playBG() {
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
const Comments = {
    elements: {
        container: document.getElementById('comments'),
        seekArrows: document.getElementsByClassName('commentSeekArrow'),
    },

    seekLeft: 0,
    seekDone: true,
    scrollPaused: false,

    hasItem() {
        return Boolean(document.querySelector('.commentItem'))
    },

    seek(delta) {
        if (!this.hasItem()) return

        const commentWidth = document.querySelector('.commentItem').getBoundingClientRect().width + 20 * Settings.pageScale
        if (this.seekDone) {
            this.seekLeft = (Math.round((this.elements.container.scrollLeft) / commentWidth) + delta) * commentWidth
            window.requestAnimationFrame(t1 => this.seekAnimate(t1, this.elements.container.scrollWidth))
        } else {
            this.seekLeft += (delta * commentWidth)
        }

        if (this.seekLeft < 0)
            this.seekLeft = 0
        if (this.seekLeft > (this.elements.container.scrollWidth - this.elements.container.clientWidth))
            this.seekLeft = (this.elements.container.scrollWidth - this.elements.container.clientWidth)
    },

    seekAnimate(t, scrollWidth) {
        if (this.seekDone == true) {
            this.seekDone = false
            this.t0 = t
            window.requestAnimationFrame(t1 => this.seekAnimate(t1, scrollWidth))
            return
        }
        let fps = 1000 / (t - this.t0)
        this.t0 = t
        //console.log(t, fps)

        const distance_delta = this.seekLeft - this.elements.container.scrollLeft
        //console.log(this.elements.container.scrollLeft, this.seekLeft)
        let prevScrollLeft = this.elements.container.scrollLeft
        if (Math.abs(distance_delta) > 1 && this.elements.container.scrollWidth == scrollWidth) {
            this.elements.container.scrollLeft += distance_delta / (5 * fps / 60)
        }

        if (prevScrollLeft == this.elements.container.scrollLeft) {
            this.seekDone = true
        } else {
            window.requestAnimationFrame(t1 => this.seekAnimate(t1, scrollWidth))
        }
    },

    scroll() {
        if (this.scrollPaused || !this.hasItem()) return

        setTimelineActiveMonth()

        if (!isFullscreen) {
            var toStart = commentDiv.scrollLeft
            var toEnd = commentDiv.scrollWidth - commentDiv.clientWidth - commentDiv.scrollLeft
            var threshold = document.getElementById('loadingIndicator').offsetWidth
        } else {
            var toStart = commentDiv.scrollTop
            var toEnd = commentDiv.scrollHeight - commentDiv.clientHeight - commentDiv.scrollTop
            var threshold = document.getElementById('loadingIndicator').offsetHeight
        }
        //console.log(toStart, toEnd)

        if (toStart < threshold && commentsUpToDate == false) {
            loadNewerComments()
            this.pauseScroll(500)
        }
        if (toEnd < threshold) {
            loadOlderComments()
            this.pauseScroll(500)
        }

        if (!isFullscreen) {
            toStart < threshold
                ? this.elements.seekArrows[0].style.display = 'none'
                : this.elements.seekArrows[0].style.removeProperty('display')
        }
    },

    pauseScroll(time) {
        this.scrollPaused = true
        setTimeout(() => {
            this.scrollPaused = false
        }, time);
    },

    init() {
        loadComments()

        this.elements.container.onwheel = e => {
            if (isFullscreen) {

            } else {
                e.deltaY > 0 ? this.seek(1) : this.seek(-1)
            }
        }
        this.elements.container.onscroll = () => this.scroll()
        setInterval(() => this.scroll(), 1000)
    },
}

const seekComment = delta => Comments.seek(delta)
try {
    Comments.init()
} catch (error) {
    logErr(error, 'failed to init comments')
}

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
    var timestamp = date.getTime() / 1000
    //console.log(timestamp)
    clearComments(1)
    if (timestamp <= 1684651800) {
        loadComments({ 'time': timestamp, 'db': 'kami' })
    } else {
        loadComments({ 'time': timestamp })
    }
})

document.getElementById('timelineContainer').addEventListener('wheel', (event) => {
    if (!isFullscreen)
        document.getElementById('timeline').scrollLeft += event.deltaY / 2
})

document.getElementById('timelineContainer').addEventListener('mouseover', (event) => {
    if (event.target.nodeName == 'SPAN') {
        if (!isFullscreen) {
            var left = event.target.getBoundingClientRect().left + event.target.getBoundingClientRect().width / 2
            var width = 113
            if (left + width > window.innerWidth) left = window.innerWidth - width
            if (left < width) left = width
            hoverCalendarEl.style.left = left + 'px'
            hoverCalendarEl.style.bottom = document.getElementById('timelineContainer').getBoundingClientRect().height + 'px'
            hoverCalendarEl.style.removeProperty('top')
            hoverCalendarEl.style.removeProperty('right')
        }
        else {
            hoverCalendarEl.style.top = event.target.getBoundingClientRect().top + event.target.getBoundingClientRect().height / 2 + 'px'
            hoverCalendarEl.style.right = document.getElementById('timelineContainer').getBoundingClientRect().width + 'px'
            hoverCalendarEl.style.removeProperty('left')
            hoverCalendarEl.style.removeProperty('bottom')
        }
        hoverCalendarEl.style.removeProperty('display')

        hoverCalendarEl.innerHTML = ''
        var year = parseInt(event.target.parentNode.firstElementChild.innerHTML)
        var month = parseInt(event.target.innerHTML)
        hoverCalendarEl.appendChild(html2elmnt(`<div>${year}-${('0' + month).slice(-2)}${(year <= 2022 || (year == 2023 && month <= 5)) ? ' (kami.im)' : ''}</div>`))
        for (let i = 1; i <= new Date(year, month, 0).getDate(); i++) {
            if (new Date(year, month - 1, i).getTime() / 1000 < maxTimelineTime)
                hoverCalendarEl.appendChild(html2elmnt(`<div data-time="${new Date(year, month - 1, i).toDateString()}">${i}</div>`))
        }
        setHoverCalendarActiveDay()
    } else if (event.target.nodeName == 'STRONG') {
        hoverCalendarEl.style.display = 'none'
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
const ImgViewer = {
    elements: {
        container: document.getElementById('imgViewerBox'),
        viewer: document.getElementById('imgViewer'),
        viewport: document.getElementById('viewport1'),
    },

    viewportContent: '',
    imgViewerOffsetX: 0,
    imgViewerOffsetY: 0,
    imgViewerScale: 1,
    imgViewerMouseMoved: false,

    view(src) {
        this.elements.viewer.src = src
        this.elements.container.style.removeProperty('display')
        this.elements.viewport.setAttribute('content', this.viewportContent.replace(', maximum-scale=1.0', ''))
        window.location.hash = 'view-img'

        this.imgViewerOffsetX = 0
        this.imgViewerOffsetY = 0
        this.imgViewerScale = 1
        this.elements.viewer.style.transform = 'translateX(0px) translateY(0px) scale(1)'
        this.elements.viewer.style.removeProperty('image-rendering')
    },

    close() {
        if (location.hash == '#view-img') {
            history.back()
            return
        }

        this.elements.container.style.display = 'none';
        this.elements.viewport.setAttribute('content', this.viewportContent);
    },

    isOpen() {
        return this.elements.container.style.display != 'none' ? true : false
    },

    init() {
        this.viewportContent = this.elements.viewport.getAttribute('content')

        this.elements.container.onmousedown = e => {
            if (e.button == 0) {
                this.imgViewerMouseMoved = false
                this.elements.viewer.style.transition = 'none'
            }
        }
        this.elements.container.onmouseup = e => {
            if (e.button == 0) {
                if (!this.imgViewerMouseMoved) {
                    this.close()
                }
                this.elements.viewer.style.removeProperty('transition')
            }
        }
        this.elements.container.onmousemove = e => {
            if (e.buttons == 1) {
                this.imgViewerOffsetX += e.movementX
                this.imgViewerOffsetY += e.movementY
                if (e.movementX != 0 || e.movementY != 0) {
                    this.imgViewerMouseMoved = true
                }
                //console.log(this.imgViewerOffsetX, this.imgViewerOffsetY)
                this.elements.viewer.style.transform = `translateX(${this.imgViewerOffsetX}px) translateY(${this.imgViewerOffsetY}px) scale(${this.imgViewerScale})`
            }
        }
        this.elements.container.onwheel = e => {
            e.preventDefault()
            let scaleMultiplier = 1
            if (e.deltaY < 0) {
                scaleMultiplier = (1000 - e.deltaY) / 1000
                //this.imgViewerScale *= 11 / 10
            } else {
                scaleMultiplier = 1000 / (1000 + e.deltaY)
                //this.imgViewerScale *= 10 / 11
            }
            this.imgViewerScale *= scaleMultiplier

            var mouseOffsetX = e.clientX - (document.documentElement.clientWidth / 2)
            var mouseOffsetY = e.clientY - (document.documentElement.clientHeight / 2)
            if (debug) console.log(mouseOffsetX, mouseOffsetY)

            this.imgViewerOffsetX += (scaleMultiplier - 1) * (this.imgViewerOffsetX - mouseOffsetX)
            this.imgViewerOffsetY += (scaleMultiplier - 1) * (this.imgViewerOffsetY - mouseOffsetY)

            if (this.imgViewerScale < 1) {
                this.imgViewerScale = 1
                this.imgViewerOffsetX = 0
                this.imgViewerOffsetY = 0
            }
            if (debug) console.log(this.imgViewerScale)

            this.elements.viewer.style.transform = `translateX(${this.imgViewerOffsetX}px) translateY(${this.imgViewerOffsetY}px) scale(${this.imgViewerScale})`
            if (this.imgViewerScale > 3) {
                this.elements.viewer.style.imageRendering = 'pixelated'
            } else {
                this.elements.viewer.style.removeProperty('image-rendering')
            }
        }
    },
}

const viewImg = src => ImgViewer.view(src)
const closeImgViewer = () => ImgViewer.close()
try {
    ImgViewer.init()
} catch (error) {
    logErr(error, 'Failed to init image viewer')
}


// music player
//
const MusicPlayer = {
    elements: {
        player: document.getElementById('musicAudio'),
        playerImg: document.getElementById('musicImg'),
        playBtn: document.getElementById('musicPlayBtn'),
        playingIndicators: document.getElementsByClassName('musicPlayingIndicator'),
        titles: document.getElementsByClassName('currentSong'),
        progress: document.getElementById('nowPlayingProgress').firstElementChild,
        list: document.getElementById('songList'),
        shuffleBtn: document.getElementById('musicShuffleBtn'),
    },

    playList: [],
    playOrder: [],
    userPaused: true,

    loadPlayList(dir) {
        this.elements.list.innerHTML = ''
        getFileListAsync(dir).then(list => {
            this.playList = list.filter(item => !(item.endsWith('.jpg') || item.endsWith('.disabled')))
            this.playOrder = []
            this.showPlayList(this.playList)
            try {
                this.setActiveSong(Theme.getThemeMusic())
            } catch (error) {
                this.setActiveSong(0)
            }
        })
    },

    showPlayList(list) {
        for (let url of list) {
            this.elements.list.appendChild(html2elmnt(`
                <li>${getFileNameWithoutExt(url, true)}</li>
            `))
        }
    },

    setActiveSong(index) {
        if (typeof index != typeof 0) {
            for (let i = 0; i < this.playList.length; i++) {
                if (decodeURIComponent(this.playList[i]).includes(index)) {
                    index = i
                    break
                }
            }
        }
        if (this.playList[index] == null) return

        this.elements.player.src = this.playList[index]
        this.elements.playerImg.src = this.playList[index] + '.jpg'
        this.elements.playerImg.onclick = function () { viewImg(this.src) }
        this.elements.playerImg.onerror = function () {
            this.onerror = null
            this.onclick = null
            this.src = 'https://haojiezhe12345.top:82/madohomu/res/music_note.svg'
        }
        for (let i = 0; i < this.elements.titles.length; i++) {
            this.elements.titles[i].textContent = getFileNameWithoutExt(this.playList[index], true)
        }
        for (let i = 0; i < this.elements.list.children.length; i++) {
            this.elements.list.children[i].classList.remove('playing')
        }
        this.elements.list.children[index].classList.add('playing')

        if (navigator.mediaSession) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: getFileNameWithoutExt(this.playList[index], true),
                artist: 'MadoHomu.love',
                artwork: [{ src: this.playList[index] + '.jpg' }]
            })
        }
    },

    getPlayingIndex() {
        for (let i = 0; i < this.elements.list.children.length; i++) {
            if (this.elements.list.children[i].classList.contains('playing')) {
                return i
            }
        }
        return 0
    },

    checkPlayOrder() {
        if (this.playOrder.length != this.playList.length) {
            this.playOrder = [...Array(this.playList.length).keys()]
            if (this.elements.shuffleBtn.checked) {
                shuffleArray(this.playOrder)
            }
        }
    },

    play(index = null) {
        if (index == null && !this.elements.player.src) index = 0
        this.setActiveSong(index)
        this.elements.player.play()
        this.userPaused = false
        setConfig('mutebgm', false)
    },

    playNext() {
        this.checkPlayOrder()
        this.play(getArrayNextItem(this.playOrder, this.getPlayingIndex()))
    },

    playPrev() {
        this.checkPlayOrder()
        this.play(getArrayPrevItem(this.playOrder, this.getPlayingIndex()))
    },

    pause() {
        this.userPaused = true
        setConfig('mutebgm', true)
        this.elements.player.pause()
    },

    setVolume(vol) {
        this.elements.player.volume = vol
    },

    initPlayer(dir) {
        this.loadPlayList(dir)
        if (getConfig('mutebgm') == 'true') {
            this.userPaused = true
        } else {
            this.play()
        }

        this.elements.playBtn.onclick = () => {
            if (this.elements.player.paused) {
                this.play()
            } else {
                this.pause()
            }
        }
        this.elements.list.onclick = e => {
            if (Array.from(this.elements.list.children).includes(e.target)) {
                this.play(Array.from(this.elements.list.children).indexOf(e.target))
            }
        }
        this.elements.progress.parentNode.onclick = e => {
            let percent = e.offsetX / this.elements.progress.parentNode.offsetWidth
            this.elements.player.currentTime = this.elements.player.duration * percent
            this.elements.progress.style.width = `${percent * 100}%`
        }
        this.elements.shuffleBtn.onchange = () => {
            this.playOrder = []
        }
        this.elements.list.parentNode.parentNode.querySelector('button').onmouseenter = () => {
            this.elements.list.querySelector('.playing').scrollIntoView({ block: "center" })
        }

        this.elements.player.onplay = () => {
            for (let i = 0; i < this.elements.playingIndicators.length; i++) {
                this.elements.playingIndicators[i].classList.add('playing');
            }
        }
        this.elements.player.onpause = () => {
            for (let i = 0; i < this.elements.playingIndicators.length; i++) {
                this.elements.playingIndicators[i].classList.remove('playing');
            }
        }
        this.elements.player.onended = () => {
            this.playNext()
        }
        document.body.addEventListener('click', () => {
            if (!this.userPaused && this.elements.player.paused) this.play()
        })

        setInterval(() => {
            this.elements.progress.style.width = `${this.elements.player.currentTime / this.elements.player.duration * 100}%`
        }, 500);

        if (navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('play', () => this.play())
            navigator.mediaSession.setActionHandler('pause', () => this.pause())
            navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrev())
            navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext())
        }
    },
}

try {
    MusicPlayer.initPlayer('https://haojiezhe12345.top:82/madohomu/media/bgm/')
} catch (error) {
    logErr(error, 'failed to init music player')
}


// global Esc key handler
//
document.onkeydown = function (e) {
    //console.log(e.key)
    if (e.key == 'Escape' || e.keyCode == 27) {
        if (ImgViewer.isOpen()) {
            closeImgViewer()
        } else if (Popup.isOpen()) {
            closePopup()
        } else if (isFullscreen) {
            toggleFullscreen()
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


// detect touch keyboard
// NEED IMPROVEMENT: MI Browser changes viewport dynamically, and when keyboard is closing, 
//                   the viewport goes: 500x700 -> 500x1100 -> 500x1000, which may accidentally trigger this layout.
//
var prevWindowWidth = null
var prevWindowHeight = null

window.onresize = () => {
    var newWindowWidth = window.innerWidth
    var newWindowHeight = window.innerHeight
    //if (debug) console.log(`${prevWindowWidth}x${prevWindowHeight} -> ${newWindowWidth}x${newWindowHeight}`)

    var newCommentBoxEl = document.getElementById('newCommentBox')
    if (newCommentBoxEl != null && document.activeElement == document.getElementById('msgText') && newWindowHeight < prevWindowHeight) {
        if (!document.body.classList.contains('touchKeyboardShowing') && (newCommentBoxEl.offsetHeight < 380)) {
            console.log('detected editing newComment with touch keyboard')
            document.body.classList.add('touchKeyboardShowing')
        }
    } else {
        //if (debug) console.log('leaving editing newComment with touch keyboard')
        document.body.classList.remove('touchKeyboardShowing')
    }
    prevWindowWidth = newWindowWidth
    prevWindowHeight = newWindowHeight
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


// wallpaper engine
//
window.wallpaperPropertyListener = {
    applyUserProperties(properties) {
        if (properties.ui_scale) {
            Settings.pageScale = properties.ui_scale.value / 100
        }
        if (properties.ui_bottom) {
            document.getElementById('wallpaperEngineCSS').innerHTML = /*css*/`
                #lowerPanel {
                    padding-bottom: 0rem;
                    transition: transform 0.5s, padding-bottom 0.5s;
                }

                #lowerPanel:hover, #lowerPanel.lowerPanelUp {
                    padding-bottom: ${properties.ui_bottom.value / 48 * 3}rem;
                }
            `
        }
        if (properties.ui_volume) {
            MusicPlayer.setVolume(properties.ui_volume.value / 100)
        }
    },
};


// everything is now initiated
//
jsLoaded = true
