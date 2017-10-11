/*
	JavaScript Poker Engine

*/
var PokerEngine = {
	init: function(minCredits, smallBlind, bigBlind, tableSize) {
		this.tableSize = tableSize;
		this.tableOrder = {};
		this.smallBlind = smallBlind;
		this.bigBlind = bigBlind;
		this.minCredits = minCredits;
		this.currentPlayerSeat = 0;
		this.currentDealerSeat = 0;
		this.currentSBSeat = 0;
		this.currentBBSeat = 0;
		this.deck = [];
		this.pot = 0;
		this.currentHigh = 0;
		this.table = [];
		this.hands = [];
		this.colors = ['spade', 'heart', 'diamond', 'club'];
		this.types = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; // 11=J, 12=Q, 13=K, 14=A (in case of equality)
		var iSeat = 1;
		while(iSeat<=this.tableSize) {
			this.tableOrder[iSeat] = 0;
			iSeat++;
		}
		
	},
	shuffle: function(a) {
	    for (let i = a.length; i; i--) {
	        let j = Math.floor(Math.random() * i);
	        [a[i - 1], a[j]] = [a[j], a[i - 1]];
	    }
	    return a;
	},
	getNextSeat: function(seat) { 
		var iS = seat;
		var rtn = 0;
		var turn = 0;
		while(!rtn && turn<3) { 
			iS++;
			if(iS>this.tableSize) {
				iS = 0;
				turn++;
			}
			if(this.tableOrder[iS]) { 
				var idX = this.tableOrder[iS];
				var player = this.hands.filter(function(x){return x.id==idX;})[0];
				if(player.inGame && player.credits>0){
					rtn = iS;
				}
			}
		}
		return rtn;
	},
	getCards: function(num){
		ret = [];
		i=0;
		while(i<num) {
			ret.push(this.deck[0]);
			this.deck.shift();
			i++;
		}
		return ret;
	},
	newPlayer: function(id, credits, seat){
		if(credits>=this.minCredits && !this.tableOrder[seat]){
			this.hands.push({id:id, content:[], credits:credits, currentBet:0, roundBet:0, inGame:false, allInFollowedBy:0});
			this.tableOrder[seat] = id;
			return true;
		}
		else
		{
			return false;
		}
	},
	newGame: function(){
		this.pot = 0;
		this.deck = [];
		this.table = [];

		for(p of this.hands) { 
			if(p.credits==0) {
				p.inGame = false;
			}
			else
			{
				p.inGame = true;
			}
		}
		
		this.currentDealerSeat = this.getNextSeat(this.currentDealerSeat);
		this.currentSBSeat = this.getNextSeat(this.currentDealerSeat);
		this.currentBBSeat = this.getNextSeat(this.currentSBSeat);
		this.currentPlayerSeat = this.currentSBSeat;


		for(col of this.colors) {
			for(t of this.types) {
				this.deck.push({type:t, color:col});
			}
		}

		this.deck = this.shuffle(this.deck);
		for(h of this.hands) {
			h.content = this.getCards(2);
		}


		this.bet(this.smallBlind);
		this.bet(this.bigBlind);


	},
	endGame: function() {
		console.log("Ending game!");
		this.currentPlayerSeat = 0;
		this.getBets();
		var winners = this.getWinners();
		var individualPot = Math.round(this.pot/winners.winners.length*100)/100; console.log("Individual pot: "+individualPot);
		var recalc = false;
		console.log(winners);
		// Need side pot management
		for(p of this.hands) {
			if(winners.winners.indexOf(p.id)!==-1 && p.inGame && p.credits==0 && p.roundBet < individualPot) {
				// All in of a user...
				maxPot = p.roundBet+(p.allInFollowedBy*p.roundBet);
				//if(maxPot>individualPot) { maxPot=individualPot; }
				console.log("Side pot : "+maxPot);
				p.inGame = false; // out of calc
				p.credits=maxPot;
				this.pot-=maxPot;
				recalc=true;
			}
		}

		if(recalc) {
			winners = this.getWinners();
			individualPot = Math.round(this.pot/winners.winners.length*100)/100; console.log("Individual pot: "+individualPot);

		}

		for(p of this.hands) {
			if(winners.winners.indexOf(p.id)!==-1 && p.inGame) {
				p.credits+=individualPot;
			}

			p.content = [];
			p.currentBet = 0;
			p.roundBet = 0;
			p.allInFollowedBy = 0;
			p.inGame = false;
		}
	},
	getBets: function(){
		var playing = this.hands.filter(function(a){ return a.currentBet > 0; }).length;
		for(p of this.hands) {
			if(p.currentBet>=this.currentHigh || p.credits==0) {
				if(p.credits==0 && p.allInFollowedBy==0) {
					// All in situation
					p.allInFollowedBy = (playing-1);
				}
				if(p.currentBet>0){ 
					this.pot+= p.currentBet;
					p.roundBet+=p.currentBet;
				}
				p.currentBet = 0;
			}
		}
		this.currentHigh = 0;
		console.log("Current pot : "+this.pot);
	},
	nextPlayer: function(){ 
		var nextSeat = this.getNextSeat(this.currentPlayerSeat);
		var nextId = this.tableOrder[nextSeat];
		var nextPlayer = this.hands.filter(function(x){return x.id==nextId;})[0];
		if(nextPlayer.currentBet == this.currentHigh || nextId == this.currentPlayerSeat) {
			// End of turn
			console.log("End of turn");
			var l = this.table.length;
			switch(l) {
				case 0:
				this.flop();
				break;
				case 3:
				this.turn();
				break;
				case 4:
				this.river();
				break;
				case 5:
				this.endGame();
				break;
			}
		}
		else
		{

			this.currentPlayerSeat = nextSeat;
		}
	},
	fold: function() {
		var id = this.tableOrder[this.currentPlayerSeat];
		var player = this.hands.filter(function(x){return x.id==id;})[0];
		console.log("Player "+id+" folds!");
		player.inGame = false;
		this.nextPlayer();

	},
	check: function(){
		if(this.currentHigh == 0 || this.currentHigh == -1) {
			var id = this.tableOrder[this.currentPlayerSeat];
			var player = this.hands.filter(function(x){return x.id==id;})[0];
			this.currentHigh = -1;
			console.log("Player "+id+" checks!");
			player.currentBet = -1;
			this.nextPlayer();
			return true;
		}
		else
		{
			return false;
		}
	},
	bet: function(amount){
		var id = this.tableOrder[this.currentPlayerSeat];
		var player = this.hands.filter(function(x){return x.id==id;})[0];
		console.log("Player "+id+"("+player.credits+") bets "+amount+"$");
		if(amount<=player.credits && (amount >= this.bigBlind || this.pot == 0 && this.currentHigh == 0 || player.currentBet == this.smallBlind && amount == this.smallBlind) && ((amount+player.currentBet)>=this.currentHigh || player.currentBet==-1 && (amount+player.currentBet+1)>=this.currentHigh || this.currentHigh==this.bigBlind && amount==this.smallBlind && player.currentBet==this.smallBlind)) {
			player.currentBet+= amount;
			if(player.currentBet>this.currentHigh) {
				this.currentHigh = player.currentBet;
			}
			player.credits-=amount;
			this.nextPlayer(); 
			return true;

		}
		else
		{ console.log("paok");
			return false;
		}

	},
	flop: function(){
		console.log("Flop!");
		this.currentPlayerSeat = this.getNextSeat(this.currentDealerSeat);
		this.getBets();
		this.deck.shift();
		this.table = this.getCards(3);
	},
	turn: function(){
		console.log("Turn!");
		this.currentPlayerSeat = this.getNextSeat(this.currentDealerSeat);
		this.getBets();
		this.deck.shift();
		this.table = this.table.concat(this.getCards(1));
	},
	river: function(){
		console.log("River!");
		this.currentPlayerSeat = this.getNextSeat(this.currentDealerSeat);
		this.getBets();
		this.deck.shift();
		this.table = this.table.concat(this.getCards(1));
	},
	cardsValue: function(cardArray) {
		cardArray = cardArray.sort(function(a, b) {
		    return parseFloat(a.type) - parseFloat(b.type);
		});
		var handValue = 0;
		var hand = [];
		var arr = {};
		var color = false;
		var colorHigh = 0;
		var straightCount = 1;
		var straightLast = 0;
		var straight = [];
		var fourOK = 0;
		var threeOK = 0;
		var pairs = [];
		var high = 0;
		for(t of this.types) {
			arr['t'+t.toString()] = 0;
		}
		for(c of this.colors) {
			arr['c'+c.toString()] = 0;
		}
		
		for(card of cardArray) { 
			arr['t'+card.type]++;
			arr['c'+card.color]++;
			if(card.type>high || card.type==1 || high!=1) {
				high = card.type;
			}
			if(card.type==(straightLast+1) || straightLast==13 && card.type==1 || straightCount>4) { 
				if(straightCount<5) {
					if(straightLast!=0 && card.type!=1) {
						straightCount++;
					}
					straightLast = card.type;
					straight.push(card);
				}
				else
				{
					straightLast = card.type;
					straight.shift();
					straight.push(card);
				}
			}
			else if(card.type==straightLast) {
				// ok
			}
			else
			{
				straightCount = 1;
				straightLast = 0;
				straight = [];
			}
			arr[card.type+'-'+card.color] = 1;
			if(arr['c'+card.color]>4) {
				color = card.color;
				tempOO = 0;
				for(c of cardArray) {
					if(c.color==color && c.type>tempOO){
						tempOO = c.type;
						colorHigh = c.type;
						if(c.type==1){colorHigh=14;tempOO=14;}
					}
				}
			}
			if(arr['t'+card.type]>3) {
				fourOK = card.type;
			}
			if(arr['t'+card.type]>2) {
				threeOK = card.type;
			}
			if(arr['t'+card.type]>1) {
				pairs.push(card);
			}
		}

		
		//Royal Flush
		if(color && arr.hasOwnProperty('10-'+color) && arr.hasOwnProperty('11-'+color) && arr.hasOwnProperty('12-'+color) && arr.hasOwnProperty('13-'+color) && arr.hasOwnProperty('1-'+color)) {
			handValue = 9;
		}

		//Straight Flush
		else if(color && straightCount>4) {
			var err = 0;
			for(c of straight) {
				if(c.color!=color) {
					err++;
				}
			}
			if(!err) {
				handValue = 8;
				hand = straight;
			}
		}

		// Four of a Kind
		if(!handValue && fourOK) {
			handValue = 7;
			hand = {fourOK: fourOK, fullHand:cardArray};
		}

		// Full House
		if(!handValue && threeOK && pairs.length > 2) {
			handValue = 6;
			hand = {threeOK:threeOK, pairs:pairs};
		}

		// Flush
		if(!handValue && color){
			handValue = 5;
			hand = {color:color, high:colorHigh};
		}

		// Straight
		if(!handValue && straightCount>4) {
			handValue = 4;
			hand = straight;
		}

		// Three of a Kind
		if(!handValue && threeOK) {
			handValue = 3;
			hand = {threeOK:threeOK, fullHand:cardArray};
		}

		// Two Pair
		if(!handValue && pairs.length>1) { 
			if(pairs.length==3) { 
				var k =pairs.shift();  
				if(k.type==1) {
					pairs[0] = k;
				}
			}
			handValue = 2;
			hand = pairs;
		}

		// One Pair
		if(!handValue && pairs.length==1) {
			handValue = 1;
			hand = {pairs:pairs, fullHand:cardArray};
		}

		// High Card
		if(!handValue) {
			hand = high;
		}
		
		var rtn = {value:handValue, justify:hand};
		return rtn;
	},
	manageEquality: function(handValue, hands) { // hands = {id: X, content: Y }
		higher = 0;
		higherArr = [];
		temp = 0;
		switch(handValue) {
			case 0:
				for(h of hands) {
					if(h.content==1) { h.content=14; }
					if(h.content>temp) {
						temp = h.content;
						higher = h.id;
						higherArr = [];
					}
					else if(h.content==temp) {
						higherArr.push(h.id);
						if(higher) {
							higherArr.push(higher);
							higher = 0;
						}
					}
				}
			break;
			case 1:
			var otherHighCard = 0;
				for(h of hands) {
					if(h.content.pairs[0].type==1) { h.content.pairs[0].type=14; }
					if(h.content.pairs[0].type>temp) {
						temp = h.content.pairs[0].type;
						higher = h.id;
						higherArr = [];
						otherHighCard = 0;
						for(ccc of h.content.fullHand) {
							if(ccc.type==1) { ccc.type=14; }
							if(ccc.type!=temp && ccc.type>otherHighCard) {
								otherHighCard = ccc.type;
							}
						}
					}
					else if(h.content.pairs[0].type==temp) { 
						var currentHigh = 0;
						for(ccc of h.content.fullHand) {
							if(ccc.type==1) { ccc.type=14; }
							if(ccc.type!=temp && ccc.type>currentHigh) {
								currentHigh = ccc.type;
							}
						}
						if(currentHigh>otherHighCard) {
							higher = h.id;
							higherArr = [];
							otherHighCard = currentHigh;
						}
						else if(currentHigh==otherHighCard)
						{
							higherArr.push(h.id);
							if(higher) {
								higherArr.push(higher);
								higher = 0;
							}
						}
					}
				}
				if(higherArr.length>0) {
					temp2 = 0;

				}
			break;
			case 2: 
				temp2 = 0;
				equality = 0;
				for(h of hands) {
					pair1 = h.content[0];
					pair2 = h.content[1];
					if(pair1.type==1) {pair1.type=14;} 
					if(pair2.type==1) {pair2.type=14;} 
					if(pair1.type>temp) {
						temp = pair1.type;
						higher = h.id;
					}
					else if(pair1.type==temp) {
						equality = pair1.type;
					}
					if(pair2.type>temp) {
						temp = pair2.type;
						higher = h.id;
					}
					else if(pair2.type==temp) {
						equality = pair2.type;
					}
				}
				if(equality==temp) {
					for(h of hands) {
						if(h.content[0].type==equality) {
							if(h.content[0].type==1) {h.content[0].type=14;}
							cardx = h.content[1].type;
						}
						else if(h.content[1].type==equality) {
							if(h.content[1].type==1) {h.content[1].type=14;}
							cardx = h.content[0].type;
						}
						else
						{
							cardx = false;
						}
						
						if(cardx) {
							if(cardx>temp2) {
								temp2 = cardx;
								higher = h.id;
								higherArr = [];
							}

							else if(cardx==temp2) { 
								higherArr.push(h.id);
								if(higher) {
									higherArr.push(higher);
									higher = 0;
								}
							}
						}
					}
				}
			break;
			case 3:
				var otherHighCard = 0;
				for(h of hands) {
					if(h.content.threeOK[0] == 1) { h.content.threeOK[0]=14;}
					if(h.content.threeOK[0]>temp) {
						higher = h.id;
						temp = h.content.threeOK[0];
						higherArr = [];
						for(ccc of h.content.fullHand) {
								if(ccc.type==1) { ccc.type=14; }
								if(ccc.type!=temp && ccc.type>otherHighCard) {
									otherHighCard = ccc.type;
								}
							}
						}
						else if(h.content.threeOK[0]==temp) {
							var currentHigh = 0;
							for(ccc of h.content.fullHand) {
								if(ccc.type==1) { ccc.type=14; }
								if(ccc.type!=temp && ccc.type>currentHigh) {
									currentHigh = ccc.type;
								}
							}
							if(currentHigh>otherHighCard) {
								higher = h.id;
								higherArr = [];
								otherHighCard = currentHigh;
							}
							else if(currentHigh==otherHighCard)
							{
								higherArr.push(h.id);
								if(higher) {
									higherArr.push(higher);
									higher = 0;
								}
							}
						}
					}
			break;
			case 4:
				for(h of hands) {
					e = h.content.slice(-1)[0];
					if(e.type==1) { e.type=14}
					if(e.type>temp) {
						higher = h.id;
						temp = e.type;
						higherArr = [];
					}
					else if(e.type==temp) {
						higherArr.push(h.id);
						if(higher) {
							higherArr.push(higher);
							higher = 0;
						}
					}
				}
			break;
			case 5:
				for(h of hands) {
					if(h.content.high==1) {h.content.high=14;}
					if(h.content.high>temp) {
						temp = h.content.high;
						higher = h.id;
						higherArr = [];
					}
					else if(h.content.high==temp) {
						higherArr.push(h.id); 
						if(higher) { 
							higherArr.push(higher);
							higher = 0;
						}
					}
				}
			break;
			case 6:
				temp2 = 0;
				equality = 0;
				for(h of hands) {
					if(h.content.threeOK==1) { h.content.threeOK=14; }
					if(h.content.threeOK>temp) {
						temp = h.content.threeOK;
						higher = h.id;
					}
					else if(h.content.threeOK==temp) {
						equality = h.content.threeOK;
					}
				}
				if(equality==temp) {
					players = {};
					for(h of hands) { 
						for(c of h.content.pairs) {
							if(c.type>temp2 && c.type!=temp) {
								higher = h.id;
								temp2 = c.type;
								higherArr = [];
							}
							else if(c.type==temp2 && c.type!=temp && higher!=h.id && !players.hasOwnProperty(h.id)) {
								higherArr.push(h.id);
								players[h.id] = true;
								if(higher) {
									higherArr.push(higher);
									higher = 0;
								}
							}
						}
					}
				}
			break;
			case 7:
				var otherHighCard = 0;
				for(h of hands) {
					if(h.content.fourOK==1) { h.content.fourOK=14;}
					if(h.content.fourOK>temp) {
						temp = h.content.fourOK;
						higher = h.id;
						higherArr = [];
						for(ccc of h.content.fullHand) {
							if(ccc.type==1) { ccc.type=14; }
							if(ccc.type!=temp && ccc.type>otherHighCard) {
								otherHighCard = ccc.type;
							}
						}
					}
					else if(h.content.fourOK==temp) {
						var currentHigh = 0;
						for(ccc of h.content.fullHand) {
							if(ccc.type==1) { ccc.type=14; }
							if(ccc.type!=temp && ccc.type>currentHigh) {
								currentHigh = ccc.type;
							}
						}
						if(currentHigh>otherHighCard) {
							higher = h.id;
							higherArr = [];
							otherHighCard = currentHigh;
						}
						else if(currentHigh==otherHighCard)
						{
							higherArr.push(h.id);
							if(higher) {
								higherArr.push(higher);
								higher = 0;
							}
						}
					}
				}
			break;
			case 8:
				for(h of hands) {
					e = h.content.slice(-1)[0];
					if(e.type==1) { e.type=14}
					if(e.type>temp) {
						higher = h.id;
						temp = e.type;
						higherArr = [];
					}
					else if(e.type==temp) {
						higherArr.push(h.id);
						if(higher) {
							higherArr.push(higher);
							higher = 0;
						}
					}
				}
			break;
			case 9:
				for(h of hands) {
					higherArr.push(h.id);
				}
			break;
		}
		if(higherArr.length>0) {
			rtn = higherArr;
		}
		else
		{
			if(higher) {
				rtn = [higher];
			}
			else
			{
				for(h of hands) {
					higherArr = [];
					higherArr.push(h.id);
				}
				rtn = higherArr;
			}
		}
		
		return rtn;
	},
	getLevelText: function(lvl) {
		switch(lvl) {
			case 0:
			return "High Card";
			break;
			case 1:
			return "Pair";
			break;
			case 2:
			return "Two Pairs";
			break;
			case 3:
			return "Three of a Kind";
			break;
			case 4:
			return "Straight";
			break;
			case 5:
			return "Flush";
			break;
			case 6:
			return "Full House";
			break;
			case 7:
			return "Four of a Kind";
			break;
			case 8:
			return "Straight Flush";
			break;
			case 9:
			return "Royal Flush";
			break;
		}
	},
	getWinners: function() {   
		equality = 0;
		tempX = 0;
		higher = 0;
		highestCards = {};
		higherArr = [];
		winners = [];
		for(player of this.hands) { 
			if(player.inGame) {
				calc = this.cardsValue(player.content.concat(this.table));
				if(parseFloat(calc.value)>tempX) {
					tempX = calc.value;
					higher = player.id;
					highestCards = calc.justify;
					higherArr = [];
					equality = 0;
				} 
				else if(calc.value==tempX) {
					if(!equality) {
						equality = tempX;
						higherArr.push({id:higher, content:highestCards});
					}
					higherArr.push({id:player.id, content:calc.justify});
				}
			}
		}
		if(equality==tempX) {
			winners = this.manageEquality(tempX, higherArr)
		}
		else
		{
			winners = [higher];
		}

		return {type:tempX, winners:winners};
	},
	getTable: function(){
		return this.table;
	},
	getHands: function(){
		return this.hands;
	}
}

/*var P = Object.create(PokerEngine);

P.init(100, 5, 10, 8);

P.newPlayer("Ben", 1000, 2);
P.newPlayer("Rose", 1000, 5);
P.newPlayer("Test", 210, 7);

P.newGame();

P.bet(10);
P.bet(5);
// Flop
P.bet(10);
P.bet(200);
P.bet(200);
P.newPlayer("X", 2100, 3);
P.bet(190);
//Turn
P.check();
P.bet(100);
P.bet(100);
//River
P.check();
P.check();


console.log(P.getHands());*/

