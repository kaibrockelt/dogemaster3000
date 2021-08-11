const key           = ''; // API Key
const secret        = ''; // API Private Key
const CURRENCY      = 'ZEUR'
const TRADEPAIRS        = ['XETHZEUR', 'MANAEUR']
const KrakenClient  = require('kraken-api');
const kraken        = new KrakenClient(key, secret);
const routineTime   = 60000;
const fee           = 0.0026;
const mineth        =0.005;
const MININEST      = 10;
const configsDir    = './action/'; //where to store the log files etc.
const DEFAULT       ={"balance":{"ZEUR":500,"XETH":0, "MANA":0}}; // the default setting for new bots.

configs=[];  
market={};
statuses={};

fs = require('fs');


(async () => {

Act();

//market.current
//Acts as an entry point for checking prices
async function Act(){
    
    marketloaded=false;
    try{
        market= await loadMarket();    
        marketloaded=true;
    }
    catch (e){
        console.log("error loading market tata.");
        console.log(e);
    }
    
    if(marketloaded){
        configs=await loadConfigs();
        statuses= await loadStatuses();
        completeStatuses();
        await storeData();
            
        for(i=0; i<configs.length; i++ ){
            
                name= configs[i].name;
                threshold= configs[i].threshold;
                config=configs[i];
                price=market.current[config.coin];
                abalance=statuses[name];
                abalance=abalance.balance;
                
                
                await buysell(name, abalance, config);
                
                

        }
    }
    console.log("END OF ROUTINE - "+new Date());
    console.log(" ");
    setTimeout(() => {  Act(); }, routineTime);

            return new Promise(resolve => {
            
                resolve ("X");
            });
}








async function buysell(name, balance, config){
    return new Promise(resolve => {
        
        tp=getPair(config.coin);
        localthreshold=config.threshold;
        
        //DYN ADJUST
        if(config.dynamic==true){ //DYN ADJUST
            fluct=1-market.highlow[config.coin].one.fluctuation;
            
            fluct=fluct*fluct*fluct*fluct;
            //console.log(fluct);
            localthreshold=(fluct)*localthreshold;
            console.log("adjusted threshold: "+localthreshold.toFixed(4)+" from "+config.threshold+" 1h fluct: "+(100*market.highlow[config.coin].one.fluctuation).toFixed(4)+"%");
        }
        
        ltt=0; //last trade timestamp
            if(statuses[name].hasOwnProperty("lasttradetime")){
                ltt=statuses[name].lasttradetime;
        } 

            
            
        for(j=market.history[tp].length-1; j>=0; j--){
            histprice=market.history[tp][j][5];
            ts=market.history[tp][j][0]*1000;
            
            
            if(ts<ltt){
                continue; 
            }
            if(histprice==0 ){
                continue;
            }
            
            else{
                
                    if(config.smoothing>1){
                        histprice=smooth(j, config.smoothing, tp);
                        
                    }
                    
                    change=compare(histprice, config.coin);
                    
                    
                
                    if(change<=0 && change<=localthreshold*-1 && balance.ZEUR==0) {
                        oldbalance=clone(balance);
                       
                        balance = trade(balance, "SELL", config);
                        console.log(name+" made a SALE. New EUR: "+balance.ZEUR+' Because there was a change of '+change);
                        
                        
                        buyprice=parseFloat(statuses[name].tradeprice[coin]);
                        currprice=parseFloat(market.current[coin]);
                        diffprice=buyprice/currprice;
                        
                        
                        
                        if(diffprice<buyprice){
                            console.log ("SHOULD have gained");
                            console.log("buyprice was: "+buyprice);
                            console.log ("Now it is: "+ currprice);
                            console.log("Change: "+diffprice);
                        }
                        else{
                            console.log ("SHOULD have LOST");
                        }
                        
                        
                        newaction="SELL";
                        
                    }
                    else if(change>=0 && change>=localthreshold && balance[config.coin]==0) {
                        oldbalance=clone(balance);
                       
                        balance= trade(balance, "BUY", config);
                        console.log(name+" made a BUY. New "+config.coin+": "+balance[config.coin]+' Because there was a change of '+change);
                        
                        newaction="BUY";
                        
                    }
                    else {
                        
                        continue;
                    }
                    
                    updateStatus (name, balance, config);
                    currenttime=Date.now();
                    
                    logdata={old: oldbalance, new: balance, change: change, action: newaction, price: market.current[config.coin], thetime: Date.now()};
                    log(name, logdata);
                    break;
            }
            
        }
        resolve (balance);
    });
    
}







function smooth(k, smoothing, tradepair){
    const reducer = (accumulator, currentValue) => accumulator + currentValue;

    vals=[];
    skippr=0;
    for(A=smoothing; A  >0; A--){

        if((k-A)>0){
            if(market.history[tradepair][k-A][5]==0){
                continue;
            }
            vals.push(parseFloat(market.history[tradepair][k-A][5]))
        }else{
             //console.log("end reached");
        }
    } 
    divisor=vals.length;
    
    if(divisor>0){
        return vals.reduce(reducer)/divisor;
    }
    return market.history[tradepair][k][5]
}


function trade( balance, action, config){
    var mybalance={}

    
    ZEUR=parseFloat(balance.ZEUR);    
    currprice=parseFloat(market.current[config.coin]);
    XETH=parseFloat(balance[config.coin]);
    buyvolume=ZEUR/currprice;
    sellvolume=XETH*currprice;
    switch(action){
        case "BUY":
            XETH=XETH+buyvolume;
            ZEUR=0;
            XETH= XETH-(XETH*fee);
            break;
        case "SELL":
            ZEUR=ZEUR+sellvolume;
            XETH=0;
            //Calculating th fee
            ZEUR= ZEUR-(ZEUR*fee);
            //console.log("Fee: "+(ZEUR*fee)+" "+config.coin);
            break;
    }
    
    
    
    mybalance.ZEUR=ZEUR;
    mybalance[config.coin]=XETH;
    return(mybalance);
}
async function log(name, data){
    return new Promise(resolve =>  {
       
        data=JSON.stringify(data)+"\n";
        fs.appendFile(configsDir+"LOGBOOK-"+name+".txt", data, function (err) {
            if (err) {
            console.log("LOG FAILED!!");
            } else {
            
            }
        });
        resolve ("YO");
    });
    
}

//Saves market data to local file
async function storeData(){
       return new Promise(resolve =>  {
        out={
            "configs": configs,
            "market": market,
            "statuses": statuses
        }
        
        out=JSON.stringify(out);

        fs.writeFile(configsDir+"DATA.txt", out, 'utf8', function (err) {
       // fs.appendFile(configsDir+"STATUS-"+name+".txt", , function (err) {
            if (err) {
            // append failed
            } else {
            // done
            }
        });
        resolve ("YO");
    }); 
    
}
async function updateStatus(name, upbalance, config){
    return new Promise(resolve =>  {
        out={balance: upbalance, tradeprice: market.current, lasttradetime: Date.now()};
        out=JSON.stringify(out);
        //console.log(upbalance);
        fs.writeFile(configsDir+"STATUS-"+name+".txt", out, 'utf8', function (err) {
       // fs.appendFile(configsDir+"STATUS-"+name+".txt", , function (err) {
            if (err) {
             console.log("WRITE FAILED");
            } else {
            // done
            }
        });
        resolve ("YO");
    });
}
function compare(history, coin){
    
    current=market.current[coin];
    increase=current -  history;

    //% increase = Increase ÷ Original Number × 100
    
    
    //Change = 500-((500/100)*17
    
    increasePercent=increase / ( current );
    
    
    return increasePercent;
};



async function loadConfigs(){
      return new Promise(resolve => {
          
           fs.readFile(configsDir+"MYCONFIGS.txt", 'utf-8',  (err, data) => {

                data=data.replace(/(?:\r\n|\r|\n)/g, '');
                data=JSON.parse(data);  
                
              
                    resolve (data);
                    
                
            })         //<<<<<<<<<<<FILE LOAD
    });  
           
      
};

async function loadStatuses(){
return new Promise(resolve => {
    openfiles=0;
  

fs.readdir(configsDir, (err, files) => {
    internalstatuses={};
    
  files.forEach(file => {
    
    if(file.indexOf("STATUS-")==0){
            
            openfiles++;
            fs.readFile(configsDir+file, 'utf-8',  (err, data) => {
                openfiles--;

                filename=file.replace("STATUS-", "");
                filename=filename.replace(".txt", "");
                
                internalstatuses[filename]=JSON.parse(data);
                if(openfiles==0)
                {

                    resolve (internalstatuses);
                }
                
            })         //<<<<<<<<<<<FILE LOAD
       
    }
    //;
  });
});
})
}

function completeStatuses(){ //Fills missing statuses with defaults;
    for(i=0; i<configs.length;i++){

        if(statuses.hasOwnProperty(configs[i].name)){
            continue
        }
        else
        {
            statuses[configs[i].name]=DEFAULT;
        }
    }
    
}
async function loadMarket(){
    current={};
    mycurrent= await kraken.api('Ticker', { pair : TRADEPAIRS.join(",") });
    //current= await kraken.api('Ticker', { pair : 'XETH'+CURRENCY+', MANA'+CURRENCY });
    mycurrent= mycurrent.result; // current price
    for(i=0; i<TRADEPAIRS.length; i++){

        
        switch(TRADEPAIRS[i])
        {
            case "XETHZEUR":
                kk="XETH";
                break;
            case "MANAEUR":
                kk="MANA";
                break;
        }
       current[kk]=mycurrent[TRADEPAIRS[i]]['c'][0];
       
    }
    
    //GETTING HIGHS AND LOWS
    highlow={};
    var history={}
    for(i=0; i<TRADEPAIRS.length; i++){
       zehpair=TRADEPAIRS[i];
        history[zehpair]=await kraken.api('OHLC', { pair : zehpair});
        history[zehpair]=history[zehpair].result[zehpair];
        
        //Getting high and lows
        coin=getCoin(zehpair);
        high=current[coin];
        low=current[coin];
        
        now=Date.now();
        hour=1000*60*60;    
        nowminus1=now-(hour);
        nowminus3=now-(hour*3);
        nowminus6=now-(hour*6);
        low1h=0,
        high1h=0;
        
        low3h=0,
        hig3h=0;
        
        low6h=0,
        high6h=0;
        lowts=0;
        hights=0;
        for(j=history[zehpair].length-1; j>=0 ; j--) {
            cnow=parseFloat(history[zehpair][j][5]);
            if(cnow==0){
                "skipping zeroes in history";
                continue;
            }
            cts=history[zehpair][j][0]*1000;
            
            if(cnow<low){
                low=cnow;
                lowts=cts;
            } else if(cnow>high){
                high=cnow; 
                hights=cts;

            }
            
            if(cts<=nowminus1 && low1h==0){

                low1h=parseFloat(low);
                high1h=parseFloat(high);
                gap1=high1h-low1h;
                fluct1=1-(low1h/high1h);
            }
            if(cts<=nowminus3 && low3h==0){
                low3h=parseFloat(low);
                high3h=parseFloat(high);

            }
            if(cts<=nowminus6 && low6h==0){
                low6h=parseFloat(low);
                high6h=parseFloat(high);
            }
            
        }
        highlow[coin]={
            full: {"high": high, "low": low, "hightime": hights, "lowtime": lowts},
            one: {"high": high1h, "low": low1h, "hightime": hights, "lowtime": lowts, "fluctuation": fluct1, "gap": gap1},
            three: {"high": high3h, "low": low3h, "hightime": hights, "lowtime": lowts},
            six: {"high": high6h, "low": low6h, "hightime": hights, "lowtime": lowts},
        };
    }
    account= await kraken.api('Balance');
    account=account.result;
    
    dataset={
        "account":account,
        "history" : history,
        "current": current,
        "highlow": highlow,
    }
  
    
    
    return dataset;
}





})();









/*HELPER FUNCTIONS*/
function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

//Making a real copy of an object
function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function getPair(coin){
    switch (coin){
        case "MANA":
            return "MANAEUR";
        break;
        case "XETH":
            return "XETHZEUR";
    }
}

function getCoin(pair){
    
      switch (pair){
        case "MANAEUR":
            return "MANA";
        break;
        case "XETHZEUR":
            return "XETH";
    }  
    
}
