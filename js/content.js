var default_stake, take_profit, loss_streak, martingale, gameType, bet_stake, gameBot;

let time = null
let allGames = ["green", "blue", "black", "red"]
let gameToPlay = ["green", "blue", "black"]
bet_stake = 50
let profit = 0
let loss = 0
let winning_color_odds = 3.8
let draw_color_odds = 4
let loss_streak_count = 0
let playedBet = false
// So that clear interval commands can be yielded in immediately
let stopGame = false
let isPlayed = false;

let gameStarter = () => {
    if(gameType === "colors"){
        console.log("Game start")
        try{
            document.querySelectorAll(".game-nav__item")[4].click();
        }
        catch(e){
            console.log(e)
        }

        gameBot = setInterval(()=>{
            if(!stopGame){
                time = parseInt(document.getElementsByClassName("timeline__value-txt")[0].innerText)
                try{
                       chrome.runtime.sendMessage({
                        msg: "getTime",
                        data: {
                            time: time
                        }
                    });
                }
                catch(e){console.log(e)}

                try{
                    // console.log(typeof time)
                    if(time >= '30' && time >= '40'){
                        if(!isPlayed){
                            // This is for playing games
                            playGame()
                            isPlayed = true
                            playedBet = true
                        }
                    }
                    else{
                        isPlayed = false
                    }
                }
                catch(error){
                    console.log(error)
                }
            }
            
        }, 3000)
    }
}

let getData = () => {
    // assign self to this cos of setInterval window object
    chrome.storage.sync.get(['stake', 'gameType', 'take_profit', 'loss_streak', 'martingale'], function(result) {
        default_stake = parseInt(result.stake) || 50;
        take_profit = parseInt(result.take_profit);
        loss_streak = parseInt(result.loss_streak);
        martingale = parseInt(result.martingale);
        gameType = result.gameType;
        bet_stake = default_stake
        alert(gameType, "game has started playing...")
        gameStarter()
    });
}
    
let start =()=>{
    getData()
    console.log("starting game...")
    alert("starting game...")   
    // gameStarter()
}
    
let playGame = async () => {
    // Checkwins First before proceeding to bets
    checkWins()

    try{
        let gamesToPlay = document.querySelectorAll("div[class^='g-total__btn '")
        for(let i = 0; i < gamesToPlay.length; i++){
            let winningColorBet = gamesToPlay[i].classList.toString().split(" ")[1]
            if(gameToPlay.includes(winningColorBet)){
                // Place bet of This
                await sleep(5000)
                setTimeout(()=>{
                    console.log(`playing bet on ${winningColorBet}...`); 
                    gamesToPlay[i].click()
                    // Send Message to the board
                    try{
                        chrome.runtime.sendMessage({
                            msg: "_placebet",
                            data: {
                                msg: `playing #${bet_stake} bet on ${winningColorBet}...`
                            }
                        });
                    }
                    catch(e){console.log(e)}
                    stakeAndPlay()
                }, 3000)
            }
        }

    }
    catch(error){}

}

let sleep = (ms) =>{
    console.log("sleep for 5000.....")
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
let checkWins = () => {
    let results =  document.querySelectorAll("div[class^='ball ball-'")
    let color = ""
    let colors = [{"color":[ 0, "green"]}, {"color": [0, "red"]}, {"color": [0, "blue"]}]
    try{
        for(let i = 0; i < results.length; i++){
            color = results[i].classList[1].split("-")[1]
            for(let j = 0; j < colors.length; j++){
                if(colors[j]["color"][1] === color){
                    colors[j]["color"][0] += 1
                }
            }
        }         
    }
    catch(e){}

    colors = colors.sort((a, b) => {
    return b.color[0] - a.color[0];
    })
    
    // Check whether game resulted in draw for the first two sort list
    // The below contains algorithms for placing bets
    let winningColorName = colors[0].color[1]
    if(colors[0].color[0] === colors[1].color[0]){
        console.log(gameToPlay, playedBet)
        if(gameToPlay.includes("black")){
            if(playedBet){
                profit += ((bet_stake * draw_color_odds) - (bet_stake * gameToPlay.length))
                loss = 0
                loss_streak_count = 0
                
                if(profit >= take_profit){
                    // Stop Game
                    stopGame = true
                    try{
                        chrome.runtime.sendMessage({
                            msg: "profit",
                            data: {
                                profit: profit,
                                msg: `You won your max profit of ${profit}, hurray, Game will be stopped now!!!`
                            }
                        });
                    }
                    catch(e){console.log(e)}
                    
                    clearInterval(gameBot)
                    
                }
                else{
                    try{
                        chrome.runtime.sendMessage({
                            msg: "profit",
                            data: {
                                profit: profit,
                                msg: `You won #${bet_stake * draw_color_odds} with None, hurray!!!`
                            }
                        });
                    }
                    catch(e){console.log(e)}
                    
                    console.log("congrations... you won NONE")
                    console.log("gained", (profit), "total", profit )
                    bet_stake = default_stake
                }

                
                playedBet = false

            }
        }
        else{
            if(playedBet){
                console.log("you lost!! ", this, gameToPlay, gameToPlay.length)
                profit -= (bet_stake * gameToPlay.length)
                loss += (bet_stake * gameToPlay.length)
                loss_streak_count++
                console.log("loss", (bet_stake * gameToPlay.length), "total", profit, "loss Streak count", loss_streak_count )
                
                if(loss_streak_count >= loss_streak){
                    // Stop Game
                    stopGame = true
                    clearInterval(gameBot)
                    try{
                        chrome.runtime.sendMessage({
                            msg: "loss_limit",
                            data: {
                                loss: loss,
                                msg: `You lost ${loss_streak_count} consecutively, You made a total loss of ${loss}`
                            }
                        });
                    }
                    catch(e){console.log(e)}
                    
                        
                }
                else{
                    try{
                        chrome.runtime.sendMessage({
                            msg: "loss",
                            data: {
                                loss: loss,
                                loss_streak: loss_streak_count,
                                msg: `You lost #${bet_stake * gameToPlay.length}`
                            }
                        });
                    }
                    
                    catch(e){console.log(e)}

                    bet_stake *= martingale
                }

                playedBet = false
            }
        }

        // Make new prediction
        console.log("Draw...")
        gameToPlay = allGames.filter(i => i !== "black")
    }
    else{
        console.log(playedBet)
        if(gameToPlay.includes(winningColorName)){
            if(playedBet){
                profit += ((bet_stake * winning_color_odds) -(bet_stake * gameToPlay.length))
                console.log(((bet_stake * winning_color_odds) -(bet_stake * gameToPlay.length)), (bet_stake * winning_color_odds), (bet_stake * gameToPlay.length))
                loss = 0
                loss_streak_count = 0
                
                if(profit >= take_profit){
                    // Stop Game
                    stopGame = true
                    clearInterval(gameBot)
                    try{
                        chrome.runtime.sendMessage({
                            msg: "profit",
                            data: {
                                profit: profit,
                                msg: `You won your max profit of ${profit}, hurray!!!`
                            }
                        });
                    }
                    catch(e){console.log(e)}
                    
                    
                }
                else{
                    try{
                        chrome.runtime.sendMessage({
                            msg: "profit",
                            data: {
                                profit: profit,
                                msg: `You won #${bet_stake * winning_color_odds} with ${winningColorName}, hurray!!!`
                            }
                        });
                    }
                    
                    catch(e){console.log(e)}
                    
                    console.log(`congratulations... you won ${winningColorName}`)
                    console.log("gained", (bet_stake * winning_color_odds), "total", profit )
                    bet_stake = default_stake
                }

            }

        }
        else{
            if(playedBet){
                console.log("you lost!! ", this, gameToPlay, gameToPlay.length)
                profit -= (bet_stake * gameToPlay.length)
                loss += (bet_stake * gameToPlay.length)
                loss_streak_count++
                
                console.log("loss", (bet_stake * gameToPlay.length), "total", loss, "loss Streak count", loss_streak_count )
                
                if(loss_streak_count >= loss_streak){
                    // Stop Game
                    stopGame = true
                    try{
                        clearInterval(gameBot)
                        chrome.runtime.sendMessage({
                            msg: "loss_limit",
                            data: {
                                loss: loss,
                                loss_streak: loss_streak_count,
                                msg: `You lost ${loss_streak_count} consecutively, You made a total loss of ${loss}`
                            
                            }
                        });
                    }
                    catch(e){console.log(e)}
                    
                        
                }
                else{
                    try{
                        chrome.runtime.sendMessage({
                            msg: "loss",
                            data: {
                                loss: loss,
                                loss_streak: loss_streak_count,
                                msg: `You lost #${bet_stake * gameToPlay.length}`
                            }
                        });
                    }
                    catch(e){console.log(e)}
                    
                    bet_stake *= martingale
                }
            }
        }

    // Make new prediction
    console.log(`${winningColorName} won...`)
    gameToPlay = allGames.filter(i => i !== winningColorName)


        // Make new prediction
        let color_name = colors[0].color[1]
        console.log(`${colors[0].color[1]} with ${colors[0].color[0]} balls...`)
        gameToPlay = allGames.filter(i => i !== color_name)
    }
}

let stakeAndPlay = () =>{
    stake();
    try {
        let placebet = document.querySelector("a.place-bet");
        if (!placebet.getAttribute("disabled")) {
            click(placebet);
        }
    } catch (error) {}
}

let click = (x) => {
    var clickEvent = document.createEvent('MouseEvents');
    clickEvent.initEvent('mousedown', true, true);
    x.dispatchEvent(clickEvent);
}

let stake = () => {
    let input = document.querySelector(".input-group input");
    if(input){
        input.focus();
        document.execCommand('selectAll', false, undefined);
        document.execCommand('insertText', false, bet_stake.toString());
    }
}



start()

// class Bot{
//     constructor(){
//         time = null
//         this.allGames = ["green", "blue", "black", "red"]
//         this.gameToPlay = ["green", "blue", "black"]
//         this.bet_stake = 50
//         this.profit = 0
//         this.loss = 0
//         this.winning_color_odds = 3.8
//         this.draw_color_odds = 4
//         this.loss_streak_count = 0
//         this.playedBet = false
//         // So that clear interval commands can be yielded in immediately
//         this.stopGame = false
//         alert("HA")
//         this.start()
//         // this.gameController()
//     }

//     // gameController(){
//     //     chrome.runtime.onMessage.addListener((request, sender) => {
//     //         if (request) {
//     //             console.log(request)
//     //             if(request.msg === 'start'){
//     //                 this.gameStarter()
//     //                 console.log("Game Started...")
//     //             }
//     //             else if(request.msg === 'pause'){
//     //                 alert("paused")
//     //                 clearInterval(this.gameBot)
//     //                 console.log("Game Paused...")
//     //             }
//     //         }
//     //     })
//     // }

//     gameStarter = () => {
//         this.isPlayed = false;
//         alert("alertHa2")
//         if(this.gameType === "colors"){
//             alert("Ha3")
//             console.log("starts")
//             try{
//                 document.querySelectorAll(".game-nav__item")[4].click();
//             }
//             catch(e){
//                 console.log(e)
//             }

//             this.gameBot = setInterval(()=>{
//                 if(!this.stopGame){
//                     time = parseInt(document.getElementsByClassName("timeline__value-txt")[0].innerText)
//                     console.log()
//                     chrome.runtime.sendMessage({
//                         msg: "getTime",
//                         data: {
//                             time: time
//                         }
//                     });
    
//                     try{
//                         // console.log(typeof time)
//                         if(time >= '30' && time >= '40'){
//                             if(!this.isPlayed){
//                                 // This is for playing games
//                                 this.playGame()
//                                 this.isPlayed = true
//                                 this.playedBet = true
//                             }
//                         }
//                         else{
//                             this.isPlayed = false
//                         }
//                     }
//                     catch(error){
//                         console.log(error)
//                     }
//                 }
                
//             }, 3000)
//         }
//     }

//     getData = () => {
//         // assign self to this cos of setInterval window object
//         let self = this

//         chrome.storage.sync.get(['stake', 'gameType', 'take_profit', 'loss_streak', 'martingale'], function(result) {
//             self.default_stake = parseInt(result.stake) || 50;
//             self.take_profit = parseInt(result.take_profit);
//             self.loss_streak = parseInt(result.loss_streak);
//             self.martingale = parseInt(result.martingale);
//             self.gameType = result.gameType;
//             self.bet_stake = self.default_stake
//             self.gameStarter()
//         });
//     }
    
//     start =()=>{
//         this.getData()
//         console.log("starting game...")
//         alert("starting game...")
        
//         this.gameStarter()
//     }
    
//     playGame = async () => {
//         // Checkwins First before proceeding to bets
//         this.checkWins()

//         try{
//             let gamesToPlay = document.querySelectorAll("div[class^='g-total__btn '")
//             for(let i = 0; i < gamesToPlay.length; i++){
//                 let winningColorBet = gamesToPlay[i].classList.toString().split(" ")[1]
//                 if(this.gameToPlay.includes(winningColorBet)){
//                     // Place bet of This
//                     await this.sleep(5000)
//                     setTimeout(()=>{
//                         console.log(`playing bet on ${winningColorBet}...`); 
//                         gamesToPlay[i].click()
//                         // Send Message to the board
//                         chrome.runtime.sendMessage({
//                             msg: "_placebet",
//                             data: {
//                                 msg: `playing #${this.bet_stake} bet on ${winningColorBet}...`
//                             }
//                         });
//                         this.stakeAndPlay()
//                     }, 3000)
//                 }
//             }

//         }
//         catch(error){}

//     }

//     sleep(ms){
//         console.log("sleep for 5000.....")
//             return new Promise(resolve => setTimeout(resolve, ms));
//         }
    
//     checkWins = () => {
//         let results =  document.querySelectorAll("div[class^='ball ball-'")
//         let color = ""
//         let colors = [{"color":[ 0, "green"]}, {"color": [0, "red"]}, {"color": [0, "blue"]}]
//         try{
//             for(let i = 0; i < results.length; i++){
//                 color = results[i].classList[1].split("-")[1]
//                 for(let j = 0; j < colors.length; j++){
//                     if(colors[j]["color"][1] === color){
//                         colors[j]["color"][0] += 1
//                     }
//                 }
//             }         
//         }
//         catch(e){}

//        colors = colors.sort((a, b) => {
//         return b.color[0] - a.color[0];
//        })
        
//        // Check whether game resulted in draw for the first two sort list
//        // The below contains algorithms for placing bets
//        let winningColorName = colors[0].color[1]
//        if(colors[0].color[0] === colors[1].color[0]){
//            console.log(this.gameToPlay, this.playedBet)
//             if(this.gameToPlay.includes("black")){
//                 if(this.playedBet){
//                     this.profit += ((this.bet_stake * this.draw_color_odds) - (this.bet_stake * this.gameToPlay.length))
//                     this.loss = 0
//                     this.loss_streak_count = 0
                    
//                     if(this.profit >= this.take_profit){
//                         // Stop Game
//                         this.stopGame = true
//                         chrome.runtime.sendMessage({
//                            msg: "profit",
//                            data: {
//                                profit: this.profit,
//                                msg: `You won your max profit of ${this.profit}, hurray, Game will be stopped now!!!`
//                            }
//                        });
                       
//                        clearInterval(this.gameBot)
                        
//                     }
//                     else{
//                         chrome.runtime.sendMessage({
//                             msg: "profit",
//                             data: {
//                                 profit: this.profit,
//                                 msg: `You won #${this.bet_stake * this.draw_color_odds} with None, hurray!!!`
//                             }
//                         });
                        
//                         console.log("congrations... you won NONE")
//                         console.log("gained", (this.profit), "total", this.profit )
//                         this.bet_stake = this.default_stake
//                     }

                    
//                     this.playedBet = false

//                 }
//             }
//             else{
//                 if(this.playedBet){
//                     console.log("you lost!! ", this, this.gameToPlay, this.gameToPlay.length)
//                     this.profit -= (this.bet_stake * this.gameToPlay.length)
//                     this.loss += (this.bet_stake * this.gameToPlay.length)
//                     this.loss_streak_count++
//                     console.log("loss", (this.bet_stake * this.gameToPlay.length), "total", this.profit, "loss Streak count", this.loss_streak_count )
                    
//                     if(this.loss_streak_count >= this.loss_streak){
//                         // Stop Game
//                         this.stopGame = true
//                         clearInterval(this.gameBot)
//                         chrome.runtime.sendMessage({
//                             msg: "loss_limit",
//                             data: {
//                                 loss: this.loss,
//                                 msg: `You lost ${this.loss_streak_count} consecutively, You made a total loss of ${this.loss}`
//                             }
//                         });
                        
                            
//                     }
//                     else{
//                         chrome.runtime.sendMessage({
//                             msg: "loss",
//                             data: {
//                                 loss: this.loss,
//                                 loss_streak: this.loss_streak_count,
//                                 msg: `You lost #${this.bet_stake * this.gameToPlay.length}`
//                             }
//                         });
//                         this.bet_stake *= this.martingale
//                     }

//                     this.playedBet = false
//                 }
//             }

//             // Make new prediction
//             console.log("Draw...")
//             this.gameToPlay = this.allGames.filter(i => i !== "black")
//        }
//        else{
//            console.log(this.playedBet)
//             if(this.gameToPlay.includes(winningColorName)){
//                 if(this.playedBet){
//                     this.profit += ((this.bet_stake * this.winning_color_odds) -(this.bet_stake * this.gameToPlay.length))
//                     console.log(((this.bet_stake * this.winning_color_odds) -(this.bet_stake * this.gameToPlay.length)), (this.bet_stake * this.winning_color_odds), (this.bet_stake * this.gameToPlay.length))
//                     this.loss = 0
//                     this.loss_streak_count = 0
                    
//                     if(this.profit >= this.take_profit){
//                         // Stop Game
//                         this.stopGame = true
//                         clearInterval(this.gameBot)
//                         chrome.runtime.sendMessage({
//                             msg: "profit",
//                             data: {
//                                 profit: this.profit,
//                                 msg: `You won your max profit of ${this.profit}, hurray!!!`
//                             }
//                         });
                        
                        
//                     }
//                     else{
//                         chrome.runtime.sendMessage({
//                             msg: "profit",
//                             data: {
//                                 profit: this.profit,
//                                 msg: `You won #${this.bet_stake * this.winning_color_odds} with ${winningColorName}, hurray!!!`
//                             }
//                         });
                        
//                         console.log(`congratulations... you won ${winningColorName}`)
//                         console.log("gained", (this.bet_stake * this.winning_color_odds), "total", this.profit )
//                         this.bet_stake = this.default_stake
//                     }

//                 }

//             }
//             else{
//                 if(this.playedBet){
//                     console.log("you lost!! ", this, this.gameToPlay, this.gameToPlay.length)
//                     this.profit -= (this.bet_stake * this.gameToPlay.length)
//                     this.loss += (this.bet_stake * this.gameToPlay.length)
//                     this.loss_streak_count++
                    
//                     console.log("loss", (this.bet_stake * this.gameToPlay.length), "total", this.loss, "loss Streak count", this.loss_streak_count )
                    
//                     if(this.loss_streak_count >= this.loss_streak){
//                         // Stop Game
//                         this.stopGame = true
//                         clearInterval(this.gameBot)
//                         chrome.runtime.sendMessage({
//                             msg: "loss_limit",
//                             data: {
//                                 loss: this.loss,
//                                 loss_streak: this.loss_streak_count,
//                                 msg: `You lost ${this.loss_streak_count} consecutively, You made a total loss of ${this.loss}`
                            
//                             }
//                         });
                        
                            
//                     }
//                     else{
//                         chrome.runtime.sendMessage({
//                             msg: "loss",
//                             data: {
//                                 loss: this.loss,
//                                 loss_streak: this.loss_streak_count,
//                                 msg: `You lost #${this.bet_stake * this.gameToPlay.length}`
//                             }
//                         });
//                         this.bet_stake *= this.martingale
//                     }
//                 }
//             }

//         // Make new prediction
//         console.log(`${winningColorName} won...`)
//         this.gameToPlay = this.allGames.filter(i => i !== winningColorName)


//             // Make new prediction
//             let color_name = colors[0].color[1]
//             console.log(`${colors[0].color[1]} with ${colors[0].color[0]} balls...`)
//             this.gameToPlay = this.allGames.filter(i => i !== color_name)
//         }
//     }

//     stakeAndPlay = () =>{
//         this.stake();
//         try {
//             let placebet = document.querySelector("a.place-bet");
//             if (!placebet.getAttribute("disabled")) {
//                 this.click(placebet);
//             }
//         } catch (error) {}
//     }

//     click = (x) => {
//         var clickEvent = document.createEvent('MouseEvents');
//         clickEvent.initEvent('mousedown', true, true);
//         x.dispatchEvent(clickEvent);
//     }
//     stake = () => {
//         let input = document.querySelector(".input-group input");
//         if(input){
//             input.focus();
//             document.execCommand('selectAll', false, undefined);
//             document.execCommand('insertText', false, this.bet_stake.toString());
//         }
//     }
// }

// new Bot()