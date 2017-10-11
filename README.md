# javascript-poker-engine
Client side and server side javascript poker engine : manage players, get hands value, get winner, side pots management. Contact me if you need a working multiplayer server side nodejs version (nodejs/socket.io + benjaminrathelot javascript-poker-engine)

Example :

```javascript
var p = Object.create(PokerEngine);

p.init(100,5,10,8); // (Min Amount, Small Blind, Big Bling, Max Players)

p.newPlayer("id1", 10000, 3); // id, credits, position on the table

p.newGame(); // The engine mixes the deck, get blinds...

p.check();
p.bet(1000);
p.fold();
// The engine will automatically go to the next player, end the game and reassign credits (side pots included).
p.cardsValue(array); // Provides the value of a hand using the given array
p.getLevelText(p.cardsValue(array).value)); // Provides a text label associated with the hand's value (Pair, Two Pairs,...)

p.getTable(); // Current cards on the table
p.getHands(); // Current players' hands
```

All the functions are included, some must only be used on server side.
