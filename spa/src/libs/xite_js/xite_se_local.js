BxxEvents.addEventListener("SE:toServer", function(e) {
    console.log("Event:", e.detail);
    BxxEvents.dispatchEvent(new CustomEvent("SE:fromServer", {detail: e.detail}));
});