var button = document.getElementById("store")
var slider = document.getElementById("connectRange")
var output = document.getElementById("rangeNumber")
var display = document.getElementById("noOfConn")

output.innerHTML = slider.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  output.innerHTML = this.value;
}

button.addEventListener('click', ()=>{
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log(tabs)
        let connectNumber = parseInt(output.innerText)
        chrome.tabs.sendMessage(tabs[0].id, { cmd: "startconnecting", data: connectNumber }, function(response) {
            console.log(response);
            button.innerText = "Started"
        
          });
    });
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log(request, sender, sendResponse)
        if(request.msg == "connadded"){
           display.innerText = request.data 
        }
    })
})



