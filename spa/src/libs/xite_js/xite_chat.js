
/*eslint no-undef: 0*/
/*eslint no-unused-vars: 0*/
document.addEventListener("DOMContentLoaded", function() {
    
    const chatinput = document.querySelector("#chatinput");
    const chatlog = document.querySelector("#chatlog");
    const chatarea = document.querySelector("#chatarea");
    
    document.querySelector("#chatform").addEventListener("submit", function(e) {
        e.preventDefault();
        BxxEvents.dispatchEvent(new CustomEvent("CHAT:toServer", {detail: {msg: chatinput.value}}));
        chatinput.value = "";
    });
    
    BxxEvents.addEventListener("CHAT:fromServer", function(e) {
        chat(e.detail.nick, e.detail.msg);
    });
    
    BxxEvents.addEventListener("CHAT:system", function(e) {
        chat("<System>", e.detail.msg);
    });

    function chat(from, msg) {
        let shouldScroll = Math.ceil(chatarea.scrollHeight - chatarea.scrollTop) === chatarea.clientHeight; // https://stackoverflow.com/a/44893438
        let li = document.createElement("li");
        li.textContent = from + ":\t" + msg;
        chatlog.appendChild(li);
        if(shouldScroll) {
            chatarea.scrollTop = chatarea.scrollHeight;
        }
    }
    
    // System generated chat
    
    function system(msg) {
        console.log("system(", msg, ")");
        BxxEvents.dispatchEvent(new CustomEvent("CHAT:system", {detail: {msg: msg}}));
    }
    
    BxxEvents.addEventListener("AV:fromServer:new", function(e) {
        system(e.detail.nick + " enters.");
    });
    
    BxxEvents.addEventListener("AV:fromServer:del", function(e) {
        system(e.detail.nick + " leaves.");
    });
});

