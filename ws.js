const configsDir    = './action/';
fs = require('fs');
var express = require('express');
var  app = express();
const http = require('http').createServer(app);

//app.use(express.static(__dirname + '/public')); 
app.use('/', express.static('public'))


app.get('/data',async function (req, res) {
    lb=await getCurrentFiles();
    res.send(lb); 
});

app.get('/logbook',async  function (req, res) {
    
    lb=await getLogbook(req.query.myname);
    res.send(lb); 
});




http.listen(3000, () => {
  console.log('listening on *:3000');
});

console.log("in");

//LOADS CURRENT CONFIG
async function getCurrentFiles(){
      return new Promise(resolve => {
          try{
              fs.readFile(configsDir+"DATA.txt", 'utf-8',  (err, data) => {
                 
                    resolve (data);
                    
                
            })         //<<<<<<<<<<<FILE LOAD*/
        } catch(e){
            resolve ("no data");
        }
     
    });  
           
      
};

async function getLogbook(lbname){
      return new Promise(resolve => {
          try{
                fs.readFile(configsDir+"LOGBOOK-"+lbname+".txt", 'utf-8',  (err, data) => {
                    resolve (data);
                })         //<<<<<<<<<<<FILE LOAD*/
        } catch(e){
            resolve ("no data");
        }
    });  
};







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
