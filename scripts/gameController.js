function additemstolist(output) {
    document.getElementById("board").innerHTML += `${output}<br/>`;
    document.getElementById("board").scrollTop += document.getElementById("board").scrollHeight;
}

let controller = document.getElementById("control");

controller.addEventListener('click', () =>{
    let buttonState = controller.getAttribute("bool")
    console.log("CLICKED---")
    if(!buttonState){
        controller.innerText = "Pause"
        chrome.runtime.sendMessage({
            msg: "start",
        });
        chrome.tabs.query({
            active: true,
            // currentWindow: true
        }, (tabs) => {
            console.log(tabs)
            chrome.tabs.sendMessage(tabs[0].id, {
                msg: "start"
            });
        });
        additemstolist("--  GAME STARTED  --");
        controller.setAttribute("bool", "True")
    }
    else{
        controller.innerText = "Start"
        chrome.runtime.sendMessage({
            msg: "pause",
        });
        additemstolist("--  GAME PAUSED  --");
        controller.setAttribute("bool", "")
    }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request) {
        console.log(request)
        if(request.msg == "_placebet"){
            additemstolist(request.data.msg)
        }
        else if(request.msg == "loss"){
            document.getElementById("profit").innerText = `#${request.data.profit}`
            document.getElementById("loss_streak").innerText = `${request.data.loss_streak}`
            additemstolist(request.data.msg)
        }
        else if(request.msg == "profit"){
            document.getElementById("profit").innerText = ` #${request.data.profit}`
            document.getElementById("loss_streak").innerText = `0`
            additemstolist(request.data.msg)
        }
        else if(request.msg == "loss_limit"){
            additemstolist(request.data.msg)
        }
        else if(request.msg == "take_profit"){
            additemstolist(request.data.msg)
        }
        else if(request.msg == "getTime"){
            document.getElementById("clock").innerText = ` ${request.data.time}s`
        }
    }
})