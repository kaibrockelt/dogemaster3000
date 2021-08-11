

$(document).ready(function(){
    loadData();
   // console.log(data);
});


function loadData(){
    
    $.get( "/data", function( data ) { 
        console.log(data);
        
        renderPage(data);
    }, "json" );
    
}
function getLogbook(name, coin){
    console.log("get ogbook for "+name);
    $.get( "/logbook",{"myname": name}, function( data ) { 
        console.log("received");
        console
        showLogbook(data, coin);
    }, "text" );
    
}
function renderPage(data){
    rows=[];
    $('#overview').empty();
    
    
    //getting highs and lows
    
    hl=data.market.highlow;
    rows.push('<div id="meta"><table><tr><td>COIN</td><td>12h</td><td>6h</td><td>3h</td><td>1h</td></tr>');
    for (const [key, value] of Object.entries(hl)) {

        low=hl[key].full.low;
        high=hl[key].full.high;
        low1=hl[key].one.low;
        high1=hl[key].one.high;
        low3=hl[key].three.low;
        high3=hl[key].three.high;
        low6=hl[key].six.low;
        high6=hl[key].six.high;
        
        diff=high-low;
        diff1=high1-low1;
        diff3=high3-low3;
        diff6=high6-low6;
        curr=parseFloat(data.market.current[key]);
        console.log("curr&low");
        console.log(curr)
        console.log(low1);
        currdiff=curr-low;
        console.log(currdiff);
        currdiff1=curr-low1;
        console.log(currdiff1);
        currdiff3=curr-low3;
        currdiff6=curr-low6;
          
        rel=currdiff/diff;
        
        rel1=currdiff1/diff1;
        rel3=currdiff3/diff3;
        rel6=currdiff6/diff6;

        
        rel=rel*100;
        rel1=rel1*100;
        rel3=rel3*100;
        rel6=rel6*100;
   
        myrow='<tr><td class="coinname"><div class="thecoin"><h3>'+key+'</h3></div></td>';
        myrow+='<td class="datafield"><div class="bar"><div class="indicator" style="left: '+rel+'%;"><span class="iprice">'+data.market.current[key]+'</span></div></div><p class="left">'+low+'</p><p class="right">'+high+'</p></td>';
        myrow+='<td class="datafield"><div class="bar"><div class="indicator" style="left: '+rel6+'%;"><span class="iprice">'+data.market.current[key]+'</span></div></div><p class="left">'+low6+'</p><p class="right">'+high6+'</p></td>';
        myrow+='<td class="datafield"><div class="bar"><div class="indicator" style="left: '+rel3+'%;"><span class="iprice">'+data.market.current[key]+'</span></div></div><p class="left">'+low3+'</p><p class="right">'+high3+'</p></td>';
        myrow+='<td class="datafield"><div class="bar"><div class="indicator" style="left: '+rel1+'%;"><span class="iprice">'+data.market.current[key]+'</span></div></div><p class="left">'+low1+'</p><p class="right">'+high1+'</p></td></tr>';
        
       console.log('1h gap: '+low1+' - '+high1+' - '+(1-(low1/high1))*100+' %');
       console.log('3h gap: '+low3+' - '+high3+' - '+(1-(low3/high3))*100+' %');
       console.log('6h gap: '+low6+' - '+high6+' - '+(1-(low6/high6))*100+' %');
       console.log('12h gap: '+low+' - '+high+' - '+(1-(low/high))*100+' %');
        
       
       
       /*
       
       10/1-(28/30)
       Base value / 1 - (Min / MAX) 1h) = Modificator
       */
        
        rows.push(myrow);
    }
    rows.push('</table></div>');        
    
    //getting  the bots
    for(i=0; i< data.configs.length; i++){
        name=data.configs[i].name;
        coin=data.configs[i].coin;
        
        
        myEUR=data.statuses[name].balance.ZEUR;
        myETH=data.statuses[name].balance[coin];
        myval=myEUR+(myETH*data.market.current[coin]-(myETH*data.market.current[coin]*0.0026));
        threshold= data.configs[i].threshold;
        myclass="black";
        switch(true){
            case (myval<500):
                myclass="red";
                break;
            
            case (myval>500):
            myclass="green"
                break;

        }
        myrow='<div class="card" onclick="getLogbook(\''+name+'\', \''+coin+'\')"><h2 class="'+myclass+'"><span>'+data.configs[i].name+'</span><span class="goright">'+new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(myval)+'</span></h2>';
        myrow+='<p>Threshold: '+threshold;+'</p>';
        myrow+='<p class="cash'+(myEUR>0 ? ' have' :'')+'">EUR: '+myEUR;+'</p>';
        myrow+='<p class="crypto'+(myETH>0 ? ' have' :'')+'">'+coin+': '+myETH;+'</p>';
        myrow+='</div>';
        //<p>threshold: <span>'+data.configs[i].threshold+'</span></p><p>'+data.statuses[name].balance.ZEUR+' EUR</p><p>'+data.statuses[name].balance.XETH+ ' ETH ('+(data.statuses[name].balance.XETH*data.market.current)+' EUR) </p></div>'
       rows.push(myrow);
    }
    
     $('#overview').append(rows.join(""));
}


function showLogbook (data, coin){
    console.log("DONE!");
    
    data=data.split("\n");
    delete data[data.length-1];
    data="["+data.join(",").slice(0,-1)+"]";
    
    
    
    data=JSON.parse(data);
    console.log(data);
    logbook="<table><thead><tr>";
    logbook+="<td>Date</td><td>Action</td><td>at Price</td><td>HAD:</td><td>HAVE</td><td>NEW VALUE EUR</td>";
    logbook+="</tr></thead><tbody>";
    
    logrows=[];
    for(i=data.length-1; i>=0; i--){
        if(data[i].old[coin]==0){
            had=data[i].old.ZEUR+" EUR";
            have=data[i].new[coin]+" "+coin;
            val=data[i].new[coin]*data[i].price+" EUR";
        }
        else{
            have=data[i].new.ZEUR+" EUR";
            had=data[i].old[coin]+" "+coin;
            val=have;
        }
        logrow='<tr><td>'+new Date(data[i].thetime).toLocaleDateString('de-DE', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});+'</td>';
        logrow+='<td>'+data[i].action+'</td><td>'+data[i].price+'</td><td>'+had+'</td><td>'+have+'</td><td>'+val+'</td></tr>';
        logrows.unshift(logrow);
    }
    
    logbook+=logrows.join("");
    logbook+="</tbody><table>";
    $('#logbook').html(logbook);
    $('#modal').fadeIn();
}

$('#background').click(function(){
    $('#modal').fadeOut();
    
})
