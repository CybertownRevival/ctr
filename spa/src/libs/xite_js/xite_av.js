
/*eslint no-undef: 0*/
/*eslint no-unused-vars: 0*/
(function () {


    let uniqValue = 0;
    function unique(prefix) {
        uniqValue += 1;
        return prefix + uniqValue.toString();
    }

    let AVATARS = new Map();

    function loadInlineAsync(browser, url) {
        browser.endUpdate();
        let inline = browser.currentScene.createNode("Inline");
        inline.url = new X3D.MFString(url);
        console.log(inline.url);
        let loadSensor = browser.currentScene.createNode("LoadSensor");
        loadSensor.watchList[0] = inline;
        let callbackKey = {};
        let promise = new Promise(function (resolve, reject) {
            loadSensor.addFieldCallback("isLoaded", callbackKey, function (value) {
                loadSensor.removeFieldCallback("isLoaded", callbackKey);
                if (value) {
                    resolve(inline);
                } else {
                    reject(inline);
                }
            });
        });
        browser.beginUpdate();
        return promise;
    }

    BxxEvents.addEventListener("INIT", function (initEvent) {
        const avatarsData = initEvent.detail.avatarsData;

        const ROTATE180 = new X3D.SFRotation(0, 1, 0, Math.PI);

        let browser = X3D.getBrowser();
        browser.addBrowserCallback({}, function (eventType) {
            console.log(eventType);
            if (eventType === X3D.X3DConstants.INITIALIZED_EVENT) {


                BxxEvents.addEventListener("AV:fromServer:new", async function (e) {
                    let eventData = e.detail;
                    let avatar = AVATARS.get(eventData.id);
                    if (!avatar) {
                        avatar = {};
                        AVATARS.set(eventData.id, avatar);
                    }

                    if (!avatar.loading && !avatar.loaded) {
                        let avURL;

                        if (eventData.avatar && avatarsData[eventData.avatar] && avatarsData[eventData.avatar].url) {
                            avURL = avatarsData[eventData.avatar].url;
                        } else {
                            avURL = avatarsData.default.url;
                        }

                        avatar.loading = true;
                        let avInline = await loadInlineAsync(browser, avURL);
                        let uniqueID = unique("Av-");
                        browser.currentScene.updateImportedNode(avInline, "Avatar", uniqueID);
                        avImport = browser.currentScene.getImportedNode(uniqueID);
                        browser.currentScene.addRootNode(avInline);
                        avatar.loading = false;
                        avatar.loaded = true;
                        avatar["inline"] = avInline;
                        avatar["import"] = avImport;
                    }

                    if (avatar["inline"]) {
                        if (avatar.transform && avatar.transform.pos) {
                            avatar["import"].set_position = new X3D.SFVec3f(...avatar.transform.pos);
                        }
                        if (avatar.transform && avatar.transform.rot) {
                            avatar["import"].rotation = ROTATE180.multiply(new X3D.SFRotation(...avatar.transform.rot));
                        }
                    }
                });

                BxxEvents.addEventListener("AV:fromServer", async function (e) {
                    let eventData = e.detail;
                    let avatar = AVATARS.get(eventData.id);
                    if (!avatar) {
                        avatar = {};
                        AVATARS.set(eventData.id, avatar);
                    }
                    if (!avatar.transform) {
                        avatar.transform = {};
                    }
                    if (eventData.pos) {
                        avatar.transform.pos = eventData.pos;
                    }
                    if (eventData.rot) {
                        avatar.transform.rot = eventData.rot;
                    }

                    if (avatar["inline"]) {
                        if (avatar.transform.pos) {
                            avatar["import"].set_position = new X3D.SFVec3f(...avatar.transform.pos);
                        }
                        if (avatar.transform.rot) {
                            avatar["import"].rotation = ROTATE180.multiply(new X3D.SFRotation(...avatar.transform.rot));
                        }
                        if (typeof eventData.gesture === "number") {
                            avatar["import"]["set_gesture" + eventData.gesture.toString()] = browser.getCurrentTime();
                        }
                    }
                });

                BxxEvents.addEventListener("AV:fromServer:del", async function (e) {
                    let id = e.detail.id;
                    let avatar = AVATARS.get(id);
                    if (avatar.inline) {
                        browser.currentScene.removeRootNode(avatar.inline);
                    }
                    if (avatar.import) {
                        avatar.import.dispose();
                    }
                    AVATARS.delete(id);
                });

                // Gesture UI
                const myAvatar = avatarsData[localStorage.getItem("avatar")] || avatarsData.default;
                const gestureList = document.querySelector("#gestures");
                if (myAvatar.gestures) {
                    myAvatar.gestures.forEach(function (gestureName, gestureIndex) {
                        let button = document.createElement("button");
                        button.textContent = gestureName;
                        let li = document.createElement("li");
                        li.appendChild(button);
                        gestureList.appendChild(li);
                        button.addEventListener("click", function () {
                            BxxEvents.dispatchEvent(new CustomEvent("AV:toServer", { detail: { gesture: gestureIndex + 1 } })); // Gestures in avs start at 1 for some reason.
                        });
                    });
                }
            }
        });
    });
})();
