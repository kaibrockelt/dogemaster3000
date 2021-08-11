# dogemaster3000
## what is it?
its a draft of a trade bot on the kraken api
it loads configuration files, checks the price and calculates the difference.
if a bot specific threshold is reached, its time to buy or sell.


## what does it do?
it pings the kraken price history for configured coins (currently ETH and MANA)
then it tries to load all local config files and status files of existing bots.

The status mainly describes what is currently being held, either fiat (EUR) or Crypto
based on what the bot has, he can either buy or sell.

it starts checking the price history chronologically backwards from "now" and compares the historical price with the current average price. If the differnce reaches a threshold X, the bot either simulates a buy or a sell action.

Every action gets logged, so you can analyse what happened.

## what does it not do?
actual trades.
i did not intend to write this code to gamble, but to learn. also, i though it would be a dumb idea to publish code that can burn uncareful people's money. Guess who would get the blame.
but a trade actually is only 2 api calls away. place an order and check its status. 
if you need that, i guess you know what to do.

## whats in the package?

the bot:
run the index js file ideally with forever and in a screen session so you dont block the console and thanks to forever it forgives eventual crashes.

the monitor:
run the ws js. this will launch a webserver on port 3000 which you can reach with your local web browser at your ip adress.

the config files:
dont delete the dummy status file. the code is still weak. the MYCONFIGS file contains the bot configurations

## what can the config do?
each bot an be set up with a couple of parameters.
{"name": "Fifteen", "threshold": 0.015, "coin": "XETH", "live": false, "smoothing": 1, "dynamic" : false},

* name: give it some identity. will be shown on the webserver
* threshold: at what percentual change should the bot react? a 1 represents 100%, so 0.05 would react when there is a rise or fall of 5% or higher in the available data.
* smoothing: defines how many timeframes (minute ticks) get averaged for comparison. a value of 1 means no smoothing, a value of 10 compares the average (arithmetic middle) prices of a moving timespan of 10 minutes. this is intended to wash out short spikes that instantly return to a normal value. the higher the value, the "smoother" the graph.
* intended to be a toggle for simulated bidding and real bidding. it does nothing.
* dynamic: tries an alternative approach where the threshold narrows down if bigger price changes flucutation are seen in the last hour. then i quadruple the result for no other reason than trying to find what might work. so far, its not the right adjustment to do for sure. ideas are welcome.


## how to use it:

install all dependencies. 

run 
````
node index.js 
````
to start watching the numbers in a browser, launch 
````
node ws.js
````

navigate to localhost:3000 if you run this on your local machine.

add or remove as many bots from the config as you like.
i recomend to keep the holding bots in for easy comparison.

you can tweak some configs, like the default assets directly in the index.js file. also you should add your kraken api credentials.


