
//var madohomu_root = ''
//madohomu_root = 'https://ipv6.haojiezhe12345.top:82/madohomu/'


// requests
//
const XHR = {
    baseUrl: 'https://haojiezhe12345.top:82/madohomu/api/',
    token: '',

    send(method, url, payload) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open(method, this.baseUrl + url)

            if (this.token) xhr.setRequestHeader('token', this.token)

            if (typeof payload == typeof {}) {
                xhr.setRequestHeader("Content-Type", "application/json")
                xhr.send(JSON.stringify(payload))
            } else {
                xhr.send(payload)
            }

            xhr.onload = () => {
                if (xhr.status == 200) {
                    try {
                        let r = JSON.parse(xhr.responseText)
                        r.code && r.code != 1 && FloatMsgs.show({ type: 'warn', msg: `${r.message} (${r.code})` })
                        resolve(r)
                    } catch (error) {
                        resolve(xhr.responseText)
                    }
                } else {
                    if (xhr.status == 401) this.token = ''
                    FloatMsgs.show({ type: 'error', msg: `${xhr.responseText} (${xhr.status})` })
                    try {
                        reject(JSON.parse(xhr.responseText))
                    } catch (error) {
                        reject(xhr.responseText)
                    }
                }
            }

            xhr.onerror = () => {
                FloatMsgs.show({ type: 'error', msg: 'Network error' })
                reject()
            }
            xhr.ontimeout = () => {
                FloatMsgs.show({ type: 'error', msg: 'Request timed out' })
                reject()
            }
        });
    },

    get(url, payload) {
        return this.send('GET', url + obj2queryString(payload))
    },

    post(url, payload) {
        return this.send('POST', url, payload)
    },

    put(url, payload) {
        return this.send('PUT', url, payload)
    },
}


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

    get showHidden() {
        let el = document.getElementById('showHiddenCSS')
        return el ? Boolean(el.innerHTML) : false
    },

    set showHidden(value) {
        let el = document.getElementById('showHiddenCSS')
        if (!el) {
            document.head.appendChild(html2elmnt('<style id="showHiddenCSS"></style>'))
            el = document.getElementById('showHiddenCSS')
        }
        el.innerHTML = value ? `
            #comments .commentBox.hidden {
                display: block;
            }
        ` : ''
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
                keepPosEl = getFirstVisibleComment()
            }
            var prevCommentTop = keepPosEl.getBoundingClientRect().top
            var prevCommentLeft = keepPosEl.getBoundingClientRect().left

            // save prev Max/MinCommentTime for loading kami SxS
            var prevMaxCommentTime = getMaxCommentTime()
            var prevMinCommentTime = getMinCommentTime()

            // insert comments
            for (let comment of xhr.response) {

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
    var date = time.toLocaleDateString()
    var hour = time.toLocaleTimeString()

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

    var imgsDOM = ''
    try {
        if (comment.image != '') {
            for (var i of comment.image.split(',')) {
                imgsDOM += /*html*/`<img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/api/data/images/posts/${i}.jpg" onclick="viewImg(this.src); Comments.forceLowerPanelUp()">`
            }
        }
    } catch (error) { }
    if (imgsDOM) imgsDOM = '<br><br>' + imgsDOM

    commentDiv.insertBefore(html2elmnt(/*html*/`
        <div class="commentBox commentItem${comment.hidden ? ' hidden' : ''}" ${isKami == true ? `data-kamiid="#${comment.id}"` : `id="#${comment.id}"`} data-timestamp="${comment.time}">
            <img class="bg" loading="lazy" src="https://haojiezhe12345.top:82/madohomu/bg/msgbg${randBG}.jpg" ${(comment.hidden == 1) ? 'style="display: none;"' : ''}>
            <div class="bgcover"></div>
            <img class="avatar" loading="lazy" src="${isKami == true ? `https://kami.im/getavatar.php?uid=${comment.uid}` : User.convertAvatarPath(comment.avatar)}"
                onclick="
                    showUserComment(&quot;${comment.sender.replace(/\\/g, '\\\\').replace(/\x22/g, '\\&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}&quot;, this.src, ${isKami == true ? comment.uid : undefined});
                    Comments.forceLowerPanelUp()
                ">
            <div class="sender" onclick="this.previousElementSibling.click()">
                ${comment.sender == '匿名用户' ? '<span class="ui zh">匿名用户</span><span class="ui en">Anonymous</span>' : comment.sender}
            </div>
            <div class="id">#${comment.id}${isKami == true ? ' (kami.im)' : ''}</div>
            <div class="comment">${htmlEscape(comment.comment)}${imgsDOM}</div>
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
            if (getMaxKamiID() == 35662) loadComments({ 'time': getMaxCommentTime() }, getFirstVisibleComment())
            // load madohomu between minKamiTime and maxKamiTime, no need if kami <2023.05
            if (getMaxKamiID() != 35662) loadComments({ 'timeMin': getMinCommentTime(), 'timeMax': getMaxCommentTime() }, getFirstVisibleComment(), true)
        } else {
            // load newer madohomu
            loadComments({ 'from': getMaxCommentID() + 1, 'count': 0 - count })
        }
    } else {
        // load kami <2023.05
        loadComments({ 'from': getMaxKamiID() + 1, 'count': 0 - count, 'db': 'kami' })
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

function getFirstVisibleComment() {
    return document.querySelector('.commentItem:not(.hidden)') || document.getElementById('loadingIndicatorBefore').nextElementSibling
}

// new message box
//
function newComment() {
    commentDiv.scrollLeft = 0
    commentDiv.scrollTop = 0

    if (document.getElementById('newCommentBox')) {
        document.getElementById('msgText').focus({ preventScroll: true })
        return
    }

    commentDiv.insertBefore(html2elmnt(/*html*/`
        <div class="commentBox" id="newCommentBox">
            <div class="bgcover"></div>
            <img class="avatar" id="msgPopupAvatar" onclick="XHR.token && User.changeAvatar()">
            <div class="sender" id="senderText" onclick="XHR.token && User.changeName()"></div>
            <div class="id" onclick="Popup.show('loginPopup')"><span class="ui zh">注册/登录</span><span class="ui en">Login / Register</span></div>
            <div class="comment">
                <textarea id="msgText" placeholder="圆神保佑~" onfocus="Comments.forceLowerPanelUp(); TouchKeyboardDetector.detect()" onblur="TouchKeyboardDetector.detect()"></textarea>
                <div id="uploadImgList"></div>
            </div>
            <label>
                <input id="uploadImgPicker" type="file" accept="image/*" onchange="previewLocalImgs()" multiple style="display: none;" />
                <span><span class="ui zh">+ 添加图片</span><span class="ui en">+ Add images</span></span>
            </label>
            <button id="sendBtn" onclick="sendMessage()"><span class="ui zh">发送 ✔</span><span class="ui en">Send ✔</span></button>
        </div>
    `), commentDiv.firstElementChild)

    loadUserInfo()

    document.getElementById('msgText').focus({ preventScroll: true })

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
        resizeImg(imgUploadInput.files[i], null, 2.1 * 1000 * 1000).then(i => {
            document.getElementById('uploadImgList').appendChild(html2elmnt(/*html*/`
                <div>
                    <img src="${i}" class="uploadImg" onclick="viewImg(this.src)">
                    <button onclick="this.parentNode.remove()">❌</button>
                </div>
            `))
        })
    }

    imgUploadInput.value = ''
}

function sendMessage() {
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
        FloatMsgs.show({ type: 'warn', msg: '<span class="ui zh">留言不能为空!</span><span class="ui en">Do not leave the message empty!</span>' })
        return
    }

    document.getElementById('sendBtn').disabled = true;
    document.getElementById('sendBtn').innerHTML = '<span class="ui zh">正在发送…</span><span class="ui en">Sending…</span>'

    XHR.post('comments/post', {
        "sender": XHR.token ? undefined : '匿名用户',
        "comment": msg,
        'images': imgList
    }).then(r => {
        console.log(r);
        document.getElementById('sendBtn').innerHTML = '<span class="ui zh">发送成功!</span><span class="ui en">Sent!</span>'
        setTimeout(() => {
            clearComments()
            loadComments()
        }, 1000);
    }).catch(r => {
        window.alert('发送留言失败\n如果问题持续, 请发邮件到 3112611479@qq.com (或加此QQ)\n\nFailed to send message, if problem persists, please contact 3112611479@qq.com')
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('sendBtn').innerHTML = '<span class="ui zh">发送 ✔</span><span class="ui en">Send ✔</span>'
    })
}

// popup
//
const Popup = {
    elements: {
        popupContainer: document.getElementById('popupContainer'),
        popupItems: Array.from(document.querySelectorAll('#popupContainer .popupItem')),
    },

    VuePopups: null,

    hideAllPopupItems() {
        this.elements.popupItems.forEach(el => {
            el.style.display = 'none'
        })
    },

    show(popupID, props) {
        setTimeout(() => {
            if (location.hash.slice(0, 7) != '#popup-') {
                location.hash = 'popup'
            }

            document.documentElement.style.setProperty('--popupFromTranslateX', `${lastClickEvent ? lastClickEvent.pageX - window.innerWidth / 2 : 0}px`);
            document.documentElement.style.setProperty('--popupFromTranslateY', `${lastClickEvent ? lastClickEvent.pageY - window.innerHeight / 2 : 0}px`);

            let popup = document.getElementById(popupID)

            if (popup.nodeName == 'TEMPLATE') {
                this.VuePopups.show(popupID, props)
                return
            }

            this.hideAllPopupItems()
            this.elements.popupContainer.style.removeProperty('display');
            popup.style.removeProperty('display')

            switch (popupID) {
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
        }, 35);
    },

    close() {
        if (location.hash == '#popup') {
            history.back()
            return
        }

        this.elements.popupContainer.style.display = 'none';
        this.hideAllPopupItems()

        this.VuePopups.close()
    },

    isOpen() {
        return this.elements.popupContainer.style.display != 'none' || this.VuePopups.popups.length > 0
    },

    init() {
        this.elements.popupContainer.onclick = e => {
            if (e.target.classList.contains('closeBtn') || e.target.id == 'popupBG') {
                this.close()
            }
        }

        this.VuePopups = new Vue({
            el: '#popups',

            data: () => ({
                popups: [],
            }),

            methods: {
                show(component, props) {
                    this.popups.push({ component, props })
                },

                close(index) {
                    index != null ? this.popups.splice(index, 1) : this.popups = []
                },
            },
        })

        Vue.component('promptInputPopup', {
            template: '#promptInputPopup',

            props: ['title', 'subtitle', 'text', 'action'],

            data: () => ({
                value: '',
                disabled: false,
            }),

            methods: {
                submit() {
                    this.submitAction(this.value)
                },

                submitAction(value) {
                    console.log(value)
                    this.$emit('close')
                },
            },

            mounted() {
                if (this.text) this.value = this.text
                if (this.action) this.submitAction = this.action
            },
        })
    },
}

window.showPopup = (id, props) => Popup.show(id, props)
window.closePopup = () => Popup.close()
try {
    Popup.init()
} catch (error) {
    logErr(error, 'failed to init popup')
}

// user related
//
const User = {
    init() {
        XHR.token = getConfig('token')

        if (getConfig('username')) {
            if (XHR.token) {
                setConfig('username', '')
            } else {
                setTimeout(() => {
                    XHR.post('user/login', {
                        name: getConfig('username')
                    }).then(r => {
                        if (r.code == 1) {
                            XHR.token = r.data
                            setConfig('token', r.data)
                            setConfig('username', '')
                            loadUserInfo()
                            FloatMsgs.show({
                                type: 'info', persist: true,
                                msg: /*html*/`
                                <span class="ui zh">账号系统已升级, 您现在可以设置邮箱/密码了</span>
                                <span class="ui en">Account system has been upgraded, you can set email/password now.</span>
                            `})
                        }
                    })
                }, 0);
            }
        }

        Vue.component('loginPopup', {
            template: '#loginPopup',

            data: () => ({
                screen: 'usernameLogin',

                loginUsername: '',
                loginEmail: '',
                loginPassword: '',

                userFindResult: [],
                loginUser: null,

                regName: '',
                regEmail: '',
                regPassword: '',
                regPasswordConfirm: '',
                regUseEmail: false,
                regRequireEmail: false,
            }),

            methods: {
                convertAvatarPath: User.convertAvatarPath,

                searchUser() {
                    XHR.get('user/find', {
                        name: this.loginUsername,
                        email: isEmail(this.loginUsername) ? this.loginUsername : undefined,
                    }).then(r => {
                        this.userFindResult = r
                        if (r.length > 0) {
                            this.screen = 'userFind'
                        } else {
                            this.gotoRegister()
                        }
                    })
                },

                gotoRegister() {
                    this.screen = 'register'

                    if (isEmail(this.loginUsername)) {
                        this.regEmail = this.loginUsername
                        this.regUseEmail = true
                    } else {
                        this.regName = this.loginUsername
                        this.regUseEmail = false
                    }

                    this.regRequireEmail = false
                    this.userFindResult.forEach(user => {
                        if (user.hasEmail == false) {
                            this.regUseEmail = true
                            this.regRequireEmail = true
                        }
                    })
                },

                previewAvatar() {
                    resizeImg(this.$refs.avatarInput.files[0], 1, 200 * 200).then(i => this.$refs.avatarPreview.src = i)
                },

                register() {
                    XHR.post('user/register', {
                        avatar: this.$refs.avatarPreview.src.split(';base64,')[1],
                        name: this.regName,
                        email: this.regUseEmail ? this.regEmail || undefined : undefined,
                        password: this.regUseEmail ? this.regPassword || undefined : undefined,
                    }).then(r => {
                        if (r.code == 1) {
                            XHR.token = r.data
                            setConfig('token', r.data)
                            this.$emit('close')
                            loadUserInfo()
                            FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">注册成功!</span><span class="ui en">Registration successful!</span>' })
                        }
                    })
                },

                userFindLogin(index) {
                    this.loginUser = this.userFindResult.length == 1 ? this.userFindResult[0] : this.userFindResult[index]
                    if (this.loginUser.hasEmail || this.loginUser.hasPassword) {
                        this.screen = 'emailLogin'
                        this.loginEmail = isEmail(this.loginUsername) && this.loginUsername != this.loginUser.name ? this.loginUsername : ''
                        this.loginPassword = ''
                    } else {
                        this.login({ name: this.loginUser.name })
                    }
                },

                emailLogin() {
                    this.login({
                        name: this.loginUser && !this.loginUser.hasEmail ? this.loginUser.name : undefined,
                        email: this.loginEmail || undefined,
                        password: this.loginPassword || undefined,
                    })
                },

                login(payload) {
                    XHR.post('user/login', payload).then(r => {
                        if (r.code == 1) {
                            XHR.token = r.data
                            setConfig('token', r.data)
                            this.$emit('close')
                            loadUserInfo()
                            FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">登录成功!</span><span class="ui en">Login successful!</span>' })
                        }
                    })
                },

                gotoForgotPassword() {
                    if (this.loginUser && !this.loginUser.hasEmail) {
                        FloatMsgs.show({
                            type: 'warn', persist: true, msg: /*html*/`
                            <span class="ui zh">该账号未绑定邮箱, 无法重置密码<br>请联系站长: 3112611479@qq.com</span>
                            <span class="ui en">This account doesn't have an email, for password resets, you must contact: 3112611479@qq.com</span>`
                        })
                        return
                    }
                    Popup.show("promptInputPopup", {
                        title: '<span class="ui zh">忘记密码</span><span class="ui en">Forgot password</span>',
                        subtitle: /*html*/`
                            <span class="ui zh">输入你想要找回密码的邮箱<br>我们将发送一份重置密码的邮件, 然后您可以设置新密码</span>
                            <span class="ui en">Enter the email you wish to recover password.<br>We will then send you a password reset link via email.</span>
                            `,
                        text: this.loginEmail,
                        action(email) {
                            this.disabled = true
                            XHR.post('user/resetpassword' + obj2queryString({ email })).then(r => {
                                if (r.code == 1) {
                                    this.$emit('close')
                                    FloatMsgs.show({
                                        type: 'success', persist: true, msg: /*html*/`
                                        <span class="ui zh">密码重置邮件已发送! 请检查收件箱</span>
                                        <span class="ui en">A password reset link was sent to your email, check your inbox</span>`
                                    })
                                }
                                this.disabled = false
                            }).catch(() => {
                                this.disabled = false
                            })
                        }
                    })
                },
            },
        })

        Vue.component('setAvatarPopup', {
            template: '#setAvatarPopup',

            methods: {
                previewAvatar() {
                    resizeImg(this.$refs.input.files[0], 1, 200 * 200).then(i => this.$refs.preview.src = i)
                },

                uploadAvatar() {
                    let avatar = this.$refs.preview.src.split(';base64,')[1]
                    if (avatar) {
                        XHR.put('user/update', { avatar }).then(r => {
                            if (r.code == 1) {
                                this.$emit('close')
                                FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">上传成功</span><span class="ui en">Uploaded successfully</span>' })
                                loadUserInfo()
                            }
                        })
                    } else {
                        this.$emit('close')
                    }
                },
            },

            mounted() {
                User.getMe().then(r => this.$refs.preview.src = User.convertAvatarPath(r.avatar))
            },
        })

        Vue.component('setPasswordPopup', {
            template: '#setPasswordPopup',

            props: ['passwordResetToken'],

            data: () => ({
                password: '',
                passwordConfirm: '',
                showPassword: false,
                userHasEmail: true,
            }),

            methods: {
                submit() {
                    if (this.passwordResetToken) {
                        XHR.post('action', {
                            id: this.passwordResetToken,
                            data: this.password
                        }).then(r => {
                            if (r.code == 1) {
                                this.$emit('close')
                                FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">密码重置成功! 请重新登录</span><span class="ui en">Password reset successfully! Try log in again</span>' })
                                location.hash = ''
                            }
                        })
                    } else {
                        XHR.put('user/update', { password: this.password }).then(r => {
                            if (r.code == 1) {
                                this.$emit('close')
                                FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">密码修改成功</span><span class="ui en">Password updated successfully</span>' })
                            }
                        })
                    }
                },
            },

            mounted() {
                if (!this.passwordResetToken) {
                    User.getMe().then(r => this.userHasEmail = r.hasEmail)
                }
            },
        })

        Vue.component('userHome', {
            template: '#userHome',

            props: ['id', 'name', 'avatar'],

            data: () => ({
                user: {},
                comments: [],
                scrollPaused: false,
                toEnd: false,
            }),

            methods: {
                convertAvatarPath: User.convertAvatarPath,

                getUser() {
                    XHR.get(this.id ? 'user/find' : 'user/me', {
                        id: this.id
                    }).then(r => {
                        let user = Array.isArray(r) ? r[0] : r
                        if (user) {
                            this.user = user
                            this.getComments()
                        } else {
                            FloatMsgs.show({ type: 'warn', msg: `<span class="ui zh">找不到用户</span><span class="ui en">User not found</span> (ID: ${this.id})` })
                        }
                    })
                },

                getComments() {
                    this.scrollPaused = true

                    XHR.get('comments', {
                        uid: this.user.id,
                        from: this.comments.length,
                        count: 50,
                    }).then(r => {

                        r.forEach(comment => {
                            let time = new Date(comment.time * 1000)
                            comment.timeStr = time.toLocaleDateString() + ' ' + time.toLocaleTimeString()
                            if (typeof comment.image == typeof '' && comment.image) {
                                comment.image = comment.image.split(',')
                            } else {
                                comment.image = []
                            }
                            this.comments.push(comment)
                        })

                        if (r.length < 10) {
                            this.toEnd = true
                        } else {
                            this.scrollPaused = false
                        }
                    }).catch(() => {
                        this.scrollPaused = false
                    })
                },

                scroll(e) {
                    if (!this.scrollPaused) {
                        let toBottom = e.target.scrollHeight - e.target.clientHeight - e.target.scrollTop
                        if (toBottom < 100) this.getComments()
                    }
                },

                gotoComment(i) {
                    clearComments(1);
                    loadComments({ from: this.comments[i].id });
                    closePopup()
                },
            },

            mounted() {
                this.user = {
                    id: this.id,
                    name: this.name,
                    avatar: this.avatar,
                }
                this.getUser()
            },
        })
    },

    changeName() {
        this.getMe().then(r => Popup.show("promptInputPopup",
            {
                title: '<span class="ui zh">修改昵称</span><span class="ui en">Change nickname</span>',
                subtitle: /*html*/`
                    <span class="ui zh">${r.hasEmail ? '' : '更改后, <b>将无法使用旧昵称登录</b><br>请确保这是您的账号, 再进行修改, 否则, 请先创建一个自己的账号<br><br>'}输入新昵称</span>
                    <span class="ui en">${r.hasEmail ? '' : 'After changing, <b>you won&rsquo;t be able to log in with the old name.</b><br>Make sure this is your account, if not, create a new one.<br><br>'}Enter your new nickname</span>
                    `,
                text: r.name,
                action(name) {
                    XHR.put('user/update', { name }).then(r => {
                        if (r.code == 1) {
                            this.$emit('close')
                            FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">修改成功</span><span class="ui en">Successfully changed</span>' })
                            loadUserInfo()
                        }
                    })
                }
            }
        ))
    },

    changeEmail() {
        this.getMe().then(r => Popup.show("promptInputPopup",
            {
                title: '<span class="ui zh">修改邮箱</span><span class="ui en">Change email</span>',
                subtitle: /*html*/`
                    <span class="ui zh">设置邮箱后, <b>该账号仅能通过邮箱登录</b><br>如果这不是你的账号, 请不要修改, 请先创建一个自己的账号<br><br>输入新邮箱</span>
                    <span class="ui en">
                        <b>You can only log in with your email after setting it, </b>people who don't know your email won't be able to log in.<br>
                        If this is not your account, please do not change anything. Log out and register your own one.<br><br>
                        Enter your email
                    </span>
                    `,
                text: r.email,
                action(email) {
                    this.disabled = true
                    XHR.put('user/update', { email }).then(r => {
                        if (r.code == 1) {
                            this.$emit('close')
                            FloatMsgs.show({
                                type: 'success', persist: true, msg: /*html*/`
                                <span class="ui zh">邮件发送成功! 请打开邮件中的链接, 以确认修改</span>
                                <span class="ui en">Confirmation email sent, please check your inbox</span>`
                            })
                        }
                        this.disabled = false
                    }).catch(() => {
                        this.disabled = false
                    })
                }
            }
        ))
    },

    changePassword() {
        Popup.show('setPasswordPopup')
    },

    changeAvatar() {
        Popup.show('setAvatarPopup')
    },

    getMe() {
        return XHR.get('user/me')
    },

    showMe() {
        Popup.show('userHome')
    },

    convertAvatarPath(avatar) {
        return avatar ? 'https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/' + encodeURIComponent(avatar) : ''
    },

    loadUserInfo() {
        var userInfo = document.getElementById('userInfo')
        var avatar = document.getElementById('userInfoAvatar')
        var name = document.getElementById('userInfoName')

        if (XHR.token) {
            User.getMe().then(r => {
                avatar.src = User.convertAvatarPath(r.avatar)
                name.textContent = r.name
                try {
                    document.getElementById('msgPopupAvatar').src = User.convertAvatarPath(r.avatar)
                    document.getElementById('senderText').textContent = r.name
                } catch (error) { }
                Popup.VuePopups.$children.forEach(v => {
                    if (v.$options.name == 'userHome') {
                        v.getUser()
                    }
                })
            })
            userInfo.onclick = () => this.showMe()
            userInfo.classList.remove('nologin')

        } else {
            avatar.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'
            name.innerHTML = '<span class="ui zh">访客</span><span class="ui en">Anonymous</span>'
            try {
                document.getElementById('msgPopupAvatar').src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'
                document.getElementById('senderText').innerHTML = '<span class="ui zh">匿名用户</span><span class="ui en">Anonymous</span>'
            } catch (error) { }
            userInfo.onclick = () => Popup.show('loginPopup')
            userInfo.classList.add('nologin')
        }
    },

    logout() {
        setConfig('token', '')
        XHR.token = ''
        closePopup()
        setTimeout(loadUserInfo, 0)
    },
}

window.loadUserInfo = () => User.loadUserInfo()
try {
    User.init()
} catch (error) {
    logErr(error, 'failed to init user')
}

function showUserComment(user, avatar, uid) {
    if (debug) console.log(user)
    if ((user == null && userCommentUser == '') || user == '') {
        if (debug) console.log('empty user!')
        return
    };

    userCommentEl.removeEventListener('scroll', userCommentScroll)

    if (user != null) {
        userCommentEl.innerHTML = /*html*/`
        <h2>
            <img src="${avatar}" onclick="viewImg(this.src)">
            <span>${user == '匿名用户' ? '<span class="ui zh">匿名用户</span><span class="ui en">Anonymous</span>' : user}${uid ? `<span class='kamiuid'>${uid}</span>` : ''}</span>
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
        xhr.open("GET", 'https://haojiezhe12345.top:82/madohomu/api/comments' + obj2queryString({ user, count: 50 }));
    } else {
        xhr.open("GET", 'https://haojiezhe12345.top:82/madohomu/api/comments' + obj2queryString({ user: userCommentUser, from: userCommentOffset, count: 50, db: userCommentIsKami == true ? 'kami' : null }));
        if (debug) console.log(userCommentUser, userCommentOffset)
    }

    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.status == 200) {

            for (var comment of xhr.response) {

                var time = new Date(comment.time * 1000)
                var date = time.toLocaleDateString()
                var hour = time.toLocaleTimeString()

                var imgsDOM = '<i></i>'
                try {
                    if (comment.image != '') {
                        for (var i of comment.image.split(',')) {
                            imgsDOM += /*html*/`<img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/api/data/images/posts/${i}.jpg" onclick="viewImg(this.src)">`
                        }
                    }
                } catch (error) { }

                userCommentEl.appendChild(html2elmnt(/*html*/`
                    <div class="userCommentItem">
                        <p>${date + ' ' + hour}<span>#${comment.id}</span></p>
                        <p>
                            <span onclick='clearComments(1); loadComments({ from: ${comment.id}${userCommentIsKami == true ? `, db: "kami"` : ``} }); closePopup()'
                                >${htmlEscape(comment.comment)}</span>
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

        clear() {
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
        '#qixi': 'qixi',
        '#night': 'night',
        '#kami': 'kami',
    },

    theme: '',
    currentBG: -1,
    currentCaption: -1,

    init() {
        this.setTheme(this.themes[location.hash])

        setInterval(() => {
            let newAutoTheme = this.getAutoTheme()
            //console.log(this.lastAutoTheme, newAutoTheme)
            if (this.lastAutoTheme && this.lastAutoTheme != newAutoTheme) this.setTheme()
            this.lastAutoTheme = newAutoTheme
        }, 1000)

        Array.from(this.elements.listSelectors).forEach(e => {
            e.onclick = () => {
                this.setTheme(e.dataset.theme)
                closePopup()
            }
        })
    },

    getAutoTheme() {
        let d = new Date()
        let y = d.getFullYear()
        if (new Date(`Oct 3 ${y} 00:00`) < d && d < new Date(`Oct 4 ${y} 06:00`)) {
            return 'birthday'
        }
        else if (new Date(`Dec 25 ${y} 00:00`) < d && d < new Date(`Dec 26 ${y} 06:00`)) {
            return 'christmas'
        }
        else if (new Date(`Jan 29 2025 00:00`) < d && d < new Date(`Feb 3 2025 06:00`)) {
            return 'lunarNewYear'
        }
        else if (new Date(`Aug 10 2024 00:00`) < d && d < new Date(`Aug 11 2024 06:00`)) {
            return 'qixi'
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

        this.timers.clear()

        this.theme = theme
        this.currentBG = this.getCurrentBgCount() - 1
        this.currentCaption = -1

        this.getCurrentBgs()[0].classList.add('bgzoom')
        this.elements.captionContainer.style.opacity = 0
        setOneTimeCSS(this.elements.captionContainer, { transition: 'none' })

        this.nextImg()
        this.nextCaption()
        if (this.getCurrentBgCount() > 1) {
            this.timers.setInterval(() => this.nextImg(), 8000)
            this.timers.setInterval(() => this.nextCaption(), 8000)
        }

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
        let prev = this.currentBG
        this.currentBG = prev + 1 < this.getCurrentBgCount() ? prev + 1 : 0
        let next = this.currentBG + 1 < this.getCurrentBgCount() ? this.currentBG + 1 : 0

        let bgs = document.getElementsByClassName(`${this.theme}bg`)
        let bgurl = this.theme == 'default' ? 'https://haojiezhe12345.top:82/madohomu/bg/' : `https://haojiezhe12345.top:82/madohomu/bg/${this.theme}/`

        try {
            bgs[prev].classList.remove('visible')
            bgs[this.currentBG].classList.add('ready', 'animating', 'visible')
            bgs[this.currentBG].firstElementChild.style.backgroundImage = `url("${bgurl}mainbg${this.currentBG + 1}.jpg")`
            // for single-image theme, show only the first image and disable slideshow
            if (prev == this.currentBG) return
            this.timers.setTimeout(() => {
                bgs[prev].classList.remove('ready', 'animating')
                bgs[next].classList.add('ready')
                bgs[next].classList.remove('bgzoom')
                bgs[next].firstElementChild.style.backgroundImage = `url("${bgurl}mainbg${next + 1}.jpg")`
            }, 2500);
        } catch (error) {
            logErr(error, 'failed to show next image')
        }
    },

    nextCaption() {
        try {
            var themeCaptions = document.getElementsByClassName(`${this.theme}Caption`);
        } catch (error) {
            console.log(error)
            return
        }

        if (themeCaptions.length == 1) {
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
        .replace(/\r\n/g, "<br>")
        .replace(/\n/g, "<br>")
    //.replace(/\s/g, "&nbsp;")
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
    var arr = []
    for (let key in obj) {
        obj[key] != null && arr.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    }
    return arr.length > 0 ? '?' + arr.join('&') : ''
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
    }, 35);
}

function readFile(blob) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
            resolve(reader.result)
        };
    })
}

function resizeImg(img, aspectRatio, maxPixels) {
    return new Promise((resolve, reject) => {

        if (typeof img != typeof '') {
            if (img && img.type.match(/image.*/)) {
                readFile(img).then(i => {
                    resizeImg(i, aspectRatio, maxPixels).then(i => resolve(i))
                })
            } else {
                FloatMsgs.show({ type: 'error', msg: '<span class="ui zh">图片无效</span><span class="ui en">Invalid image</span>' })
            }
            return
        }

        let image = new Image();
        image.src = img;
        image.onload = () => {
            let width = image.width;
            let height = image.height;

            if (aspectRatio) {
                if (width / height > aspectRatio) {
                    width = height * aspectRatio
                } else {
                    height = width / aspectRatio
                }
            }

            if (maxPixels && width * height > maxPixels) {
                let zoom = Math.sqrt(maxPixels / (width * height))
                width *= zoom
                height *= zoom
            }

            width = Math.round(width)
            height = Math.round(height)

            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext("2d");

            if (aspectRatio) {
                if (image.width / image.height > aspectRatio) {
                    ctx.drawImage(image, (image.width - image.height * aspectRatio) / 2, 0, image.height * aspectRatio, image.height, 0, 0, width, height)
                } else {
                    ctx.drawImage(image, 0, (image.height - image.width / aspectRatio) / 2, image.width, image.width / aspectRatio, 0, 0, width, height)
                }
            }
            else {
                ctx.drawImage(image, 0, 0, width, height)
            }

            resolve(canvas.toDataURL("image/jpeg"))
        }
    })
}

function isEmail(s) {
    return /^\S+@\S+\.\S+$/.test(s)
}


// common vars
//
var commentsUpToDate = false
var maxTimelineTime = 0

var userCommentUser = ''
var userCommentOffset = 0
var userCommentIsKami = false

// document elmnts
const bgContainer = document.getElementById('bgContainer')
const lowerPanel = document.getElementById('lowerPanel')

var commentDiv = document.getElementById('comments')
var userCommentEl = document.getElementById('userComment')

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
var isLoadCommentErrorShowed = false


// set title link href
document.querySelector('#mainTitle>a').href = location.origin + location.pathname

// set language
changeLang(getConfig('lang'))

var debug = false
if (location.hash == '#debug') {
    debug = true
    setTimeout(() => {
        Comments.forceLowerPanelUp()
    }, 0);
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

        const commentWidth = getFirstVisibleComment().getBoundingClientRect().width + 20 * Settings.pageScale
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
            var threshold = getFirstVisibleComment().offsetWidth / 8
        } else {
            var toStart = commentDiv.scrollTop
            var toEnd = commentDiv.scrollHeight - commentDiv.clientHeight - commentDiv.scrollTop
            var threshold = getFirstVisibleComment().offsetHeight / 8
        }
        //console.log(toStart, toEnd)

        if (toStart <= threshold && commentsUpToDate == false) {
            loadNewerComments()
            this.pauseScroll(500)
        }
        if (toEnd <= threshold) {
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

    GetTargetCommentScrollability(target) {
        while (this.elements.container.contains(target)) {
            if (target.classList.contains('comment') || target.id == 'msgText') {
                // console.log(target.scrollHeight, target.clientHeight)
                return {
                    inputable: target.id == 'msgText',
                    scrollable: target.scrollHeight > target.clientHeight,
                    top: target.scrollTop < 1,
                    bottom: target.scrollHeight - target.clientHeight - target.scrollTop < 1
                }
            }
            target = target.parentNode
        }
        return {
            inputable: false,
            scrollable: false,
            top: true,
            bottom: true
        }
    },

    forceLowerPanelUp() {
        lowerPanel.classList.add('lowerPanelUp');
        lowerPanel.classList.remove('lowerPanelDown')
        document.documentElement.style.overscrollBehavior = 'contain'
        document.body.style.overscrollBehavior = 'contain'
    },

    forceLowerPanelDown() {
        lowerPanel.classList.remove('lowerPanelUp')
        lowerPanel.classList.add('lowerPanelDown')
        setTimeout(() => {
            document.documentElement.style.removeProperty('overscroll-behavior')
            document.body.style.removeProperty('overscroll-behavior')
        }, 300);
        try {
            document.getElementById('msgText').blur()
        } catch (error) { }
    },

    init() {
        loadComments()

        this.elements.container.onwheel = e => {
            if (!isFullscreen) {
                let scroll = this.GetTargetCommentScrollability(e.target)
                if (!scroll.inputable && !scroll.scrollable)
                    e.deltaY > 0 ? this.seek(1) : this.seek(-1)
            }
        }
        this.elements.container.onscroll = () => this.scroll()
        setInterval(() => this.scroll(), 1000)

        // lowerPanel Up/Down touch handlers
        //
        bgContainer.addEventListener('click', this.forceLowerPanelDown)
        bgContainer.addEventListener('touchstart', this.forceLowerPanelDown)
        document.addEventListener('mouseover', () => lowerPanel.classList.remove('lowerPanelDown'))

        lowerPanel.addEventListener('touchstart', function (e) {
            this.lastTouchStart = e.touches[0]
            this.lastTouchMove = null
            this.timeTouchStart = e.timeStamp

            Comments.forceLowerPanelUp()
            document.getElementById('mouseScrollTooltip').style.display = 'none';
        })

        lowerPanel.addEventListener('touchmove', function (e) {
            const currentTouch = e.touches[0]
            const deltaX = currentTouch.clientX - this.lastTouchStart.clientX
            const deltaY = currentTouch.clientY - this.lastTouchStart.clientY

            if (!this.lastTouchMove && deltaY > Math.abs(deltaX) && !isFullscreen) {
                let scroll = Comments.GetTargetCommentScrollability(e.target)
                this.touchMoveLowerPanel = scroll.inputable ? !scroll.scrollable : scroll.top
            }

            if (this.touchMoveLowerPanel && deltaY > 0 && !isFullscreen) {
                lowerPanel.style.transform = `translateY(${deltaY}px)`
                lowerPanel.style.transition = 'none'
            }

            this.lastTouchMove = currentTouch
            this.timeLastMove = e.timeStamp
        })

        lowerPanel.addEventListener('touchend', function (e) {
            if (this.touchMoveLowerPanel) {
                lowerPanel.style.removeProperty('transform')
                lowerPanel.style.removeProperty('transition')
            }

            try {
                const deltaY = this.lastTouchMove.clientY - this.lastTouchStart.clientY
                const deltaTime = this.timeLastMove - this.timeTouchStart
                if (this.touchMoveLowerPanel && (deltaY / window.innerHeight > 0.15 || deltaY / window.innerHeight / deltaTime > 0.0007)) {
                    Comments.forceLowerPanelDown()
                }
            } catch (error) { }

            this.touchMoveLowerPanel = false
        })
    },
}

window.seekComment = delta => Comments.seek(delta)
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

            var mouseOffsetX = e.clientX - (window.innerWidth / 2)
            var mouseOffsetY = e.clientY - (window.innerHeight / 2)
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

window.viewImg = src => ImgViewer.view(src)
window.closeImgViewer = () => ImgViewer.close()
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
        document.addEventListener('click', () => {
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


// floating messages
//
const FloatMsgs = new Vue({
    el: '#floatMsgs',

    data: () => ({
        count: 0,
        msgs: [],
    }),

    methods: {
        show(msg) {
            msg.id = this.count
            this.count++
            this.msgs.push(msg)
            if (!msg.persist) {
                setTimeout(() => {
                    this.close(msg.id)
                }, msg.timeout || 4000);
            }
        },

        close(id) {
            this.msgs.forEach((item, i) => {
                if (item.id == id) {
                    this.msgs.splice(i, 1)
                    return
                }
            })
        },
    }
})


// global click handler
//
var lastClickEvent
document.addEventListener('click', e => lastClickEvent = e)


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
            Comments.forceLowerPanelDown()
        }
    }
}


// hash change handler
//
if (window.location.hash == '#view-img' || window.location.hash == '#popup') {
    window.location.hash = ''
}

if (location.hash.startsWith('#confirmemail=')) {
    let id = location.hash.replace('#confirmemail=', '')
    XHR.post('action', { id }).then(r => {
        if (r.code == 1) {
            FloatMsgs.show({ type: 'success', msg: '<span class="ui zh">邮箱确认成功!</span><span class="ui en">Email confirmed successfully!</span>' })
            location.hash = ''
        }
    })
}

if (location.hash.startsWith('#resetpassword=')) {
    let passwordResetToken = location.hash.replace('#resetpassword=', '')
    Popup.show('setPasswordPopup', { passwordResetToken })
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
const TouchKeyboardDetector = {
    init() {
        window.addEventListener('resize', this.detect)
    },

    detect() {
        let input = document.getElementById('msgText')
        if (input && document.activeElement == input) {
            if (!document.body.classList.contains('touchKeyboardShowing')
                && document.getElementById('newCommentBox').offsetHeight < 370 * Settings.pageScale) {
                console.log('detected editing newComment with touch keyboard')
                document.body.classList.add('touchKeyboardShowing')
            }
        }
        else {
            //if (debug) console.log('leaving editing newComment with touch keyboard')
            document.body.classList.remove('touchKeyboardShowing')
        }
    },
}

try {
    TouchKeyboardDetector.init()
} catch (error) {
    logErr(error, 'failed to init TouchKeyboardDetector')
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
window.jsLoaded = true
