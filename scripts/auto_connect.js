const CONNECT_LINK = "https://www.linkedin.com/mynetwork/"
var CONNECT_COUNTER = 0
var CONNECT_RANGE = 0
var PENDING_COUNTER = 0
var ONSCROLL = false
// scroll s alert(CONNECT_LINK)

function autoConnect(SECTION_CARDS, currentIndex){
    // alert(`Started again with ${currentIndex}`)
    console.log(SECTION_CARDS, SECTION_CARDS.length)
    for(let i = currentIndex; i < SECTION_CARDS.length; i++){
            if(ONSCROLL){
                i += CONNECT_COUNTER;
                ONSCROLL = false;
            }

            if(CONNECT_COUNTER == CONNECT_RANGE) {
                CONNECT_COUNTER = 0
                CONNECT_RANGE = 0
                PENDING_COUNTER = 0
                break;
            }
            
            const CONNECT_BUTTON = SECTION_CARDS[i].getElementsByClassName("artdeco-button artdeco-button--2 artdeco-button--secondary ember-view full-width")[0]
            console.log(CONNECT_BUTTON.innerText)
            
            if(CONNECT_BUTTON.innerText.trim() == "Pending") PENDING_COUNTER += 1
            if(CONNECT_BUTTON.innerText.trim() == "Connect") {
                CONNECT_COUNTER += 1
                chrome.runtime.sendMessage({
                    msg: "connadded",
                    data: CONNECT_COUNTER
                });                
            }

            if(PENDING_COUNTER === 15 ){
                window.scrollTo(0,document.body.scrollHeight)
                ONSCROLL = true
                startAutoConnect(SECTION_CARDS.length, i)
                PENDING_COUNTER = 0
                break;
            }
            
            console.log("i: ", i, "Connected: ", CONNECT_COUNTER, " Length: ", SECTION_CARDS.length)
            randomTime(SECTION_CARDS, i)
            // SECTION_CARDS.length - 1
            if(i % 30 === 0){
                window.scrollTo(0,document.body.scrollHeight)
                ONSCROLL = true
                startAutoConnect(SECTION_CARDS.length, i)
                break;
            }
        }
}

function pollNode(className, previousLen, currentIndex){
    
    // Every time the element is polled the new length must be greater than the other 
    // to signify growth in Elements
    let interval = setInterval(()=>{
        const NODE = document.getElementsByClassName(className)
        if(NODE.length > previousLen) {
            clearInterval(interval)
            return autoConnect(NODE, currentIndex)
        }
    }, 1000)
}

function randomTime(SECTION_CARDS, i){
    // Random time between 1 - 10
    let randSecond = Math.ceil(Math.random() * 20) * 1000
    
    setTimeout(()=>{
        try{
            const CONNECT_BUTTON = SECTION_CARDS[i].getElementsByClassName("artdeco-button artdeco-button--2 artdeco-button--secondary ember-view full-width")[0]
            console.log(CONNECT_BUTTON.innerText)
            // Check button
           
            if(CONNECT_BUTTON.innerText.trim() == "Connect")
            {
                CONNECT_BUTTON.click()
            } 
        }
        catch(e){
            console.log(e, "error Some while")
        }
    }, randSecond)
}

function startAutoConnect(previousLen, currentIndex){
    pollNode("discover-entity-type-card__bottom-container", previousLen, currentIndex)
}

function connectConfig(){
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log(request, sender, sendResponse)
        if(request) {
            if (request.cmd == "startconnecting") {
                CONNECT_RANGE = request.data
                if(CONNECT_LINK === window.location.href) 
                {
                    const CURRENT_URL = window.location.href
                    const REGEX = new RegExp("mynetwork")
                    if(REGEX.test(CURRENT_URL)) 
                    {
                        startAutoConnect(0, 0)
                    }
                }
                else
                {
                    // Click on my network
                    let networkBtn = document.getElementById("ember20")
                    if(!networkBtn){
                        networkBtn = document.getElementById("ember19")
                        networkBtn.click()
                    }
                    else{
                        networkBtn.click()
                    }

                    let changeToInterval = setInterval(()=>{
                        if(window.location.href === CONNECT_LINK){
                            const CURRENT_URL = window.location.href
                            const REGEX = new RegExp("mynetwork")
                            if(REGEX.test(CURRENT_URL))
                            {
                                startAutoConnect(0, 0)
                                clearInterval(changeToInterval)
                            }    
                        }   
                    }, 3000) 
                }
                try{
                    sendResponse({msg: "Bot has start working", status: true})
                }
                catch(e){
                    console.log(e)
                }
                
            }
        }
    });
}

connectConfig()