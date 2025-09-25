// import { WebSocketServer, WebSocket } from 'ws';

// const wss = new WebSocketServer({ port: 8080 });


// const users:{[key:string]:{
//   ws: WebSocket,
//   rooms: string[]
// }}={

// }

// wss.on('connection', function connection(userSocket) {
//    const id= getRandomId();
//    users[id]={
//     ws:userSocket,
//     rooms:[]
//    }

//   userSocket.on('message', function message(data) {
//     // console.log('received: %s', data);
//     // userSocket.send('Hey i got your msg'+ data);

//     const parsedMessage= JSON.parse(data as unknown as string);
//     if(parsedMessage.type==="SUBSCRIBE"){
//       users[id].rooms.push(parsedMessage.room)
//     }

//     if(parsedMessage.type==="UNSUBSCRIBE"){
//       users[id].rooms= users[id].rooms.filter(x=> x !== parsedMessage.room)
//     }

//     if(parsedMessage.type==="sendMessage"){
//       const message= parsedMessage.message ;
//       const roomId = parsedMessage.roomId ;

//       Object.keys(users).forEach((userId)=>{
//         const {ws, rooms}= users[userId];
//         if(rooms.includes(roomId)){
//           ws.send(message);
//         }
//       })
//     }
    


//  });

// });


// function getRandomId():number{
//   return Math.random()
// }


// docker run -p 6379:6379 redis


// ---------------------------- Scalable chat code ------------------------------- 

import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from "redis"

const publishClient = createClient();
publishClient.connect();

const subscribeClient = createClient();
subscribeClient.connect();

const wss = new WebSocketServer({ port: 8080 });

const subscriptions: {[key: string]: {
    ws: WebSocket,
    rooms: string[]
}} = {

}

// setInterval(() => {
//     console.log(subscriptions);
// }, 5000);


wss.on('connection', function connection(userSocket) {
    const id = randomId();
    subscriptions[id] = {
        ws: userSocket,
        rooms: []
    }
  
    userSocket.on('message', function message(data) {
        const parsedMessage = JSON.parse(data as unknown as string);
        if (parsedMessage.type === "SUBSCRIBE") {
            subscriptions[id].rooms.push(parsedMessage.room);
            if (oneUserSubscribedTo(parsedMessage.room)) {
                console.log("subscribing on the pub sub to room " + parsedMessage.room);
                subscribeClient.subscribe(parsedMessage.room, (message) => {
                    const parsedMessage = JSON.parse(message);
                    Object.keys(subscriptions).forEach((userId) => {
                        const {ws, rooms} = subscriptions[userId];
                        if (rooms.includes(parsedMessage.roomId)) {
                            ws.send(parsedMessage.message);
                        }
                    })
                })
            }
        }
        
        if (parsedMessage.type === "UNSUBSCRIBE") {
            subscriptions[id].rooms = subscriptions[id].rooms.filter(x => x !== parsedMessage.room)
            if (lastPersonLeftRoom(parsedMessage.room)) {
                console.log("unsubscribing from pub sub on room" + parsedMessage.room);
                subscribeClient.unsubscribe(parsedMessage.room);
            }
        }

        if (parsedMessage.type === "sendMessage") {
            const message = parsedMessage.message;
            const roomId = parsedMessage.roomId;
            
            publishClient.publish(roomId, JSON.stringify({
                type: "sendMessage",
                roomId: roomId,
                message
            }))
        }
    });

});

function oneUserSubscribedTo(roomId: string) {
    let totalInterestedPeople = 0;
    Object.keys(subscriptions).map(userId => {
        if (subscriptions[userId].rooms.includes(roomId)) {
            totalInterestedPeople++;
        }
    })
    if (totalInterestedPeople == 1) {
        return true;
    }
    return false;
}

function lastPersonLeftRoom(roomId: string) {
    let totalInterestedPeople = 0;
    Object.keys(subscriptions).map(userId => {
        if (subscriptions[userId].rooms.includes(roomId)) {
            totalInterestedPeople++;
        }
    })
    if (totalInterestedPeople == 0) {
        return true;
    }
    return false;
}

function randomId() {
    return Math.random();
}