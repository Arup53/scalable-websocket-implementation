import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });


const users:{[key:string]:{
  ws: WebSocket,
  rooms: string[]
}}={

}

wss.on('connection', function connection(userSocket) {
   const id= getRandomId();
   users[id]={
    ws:userSocket,
    rooms:[]
   }

  userSocket.on('message', function message(data) {
    // console.log('received: %s', data);
    // userSocket.send('Hey i got your msg'+ data);

    const parsedMessage= JSON.parse(data as unknown as string);
    if(parsedMessage.type==="SUBSCRIBE"){
      users[id].rooms.push(parsedMessage.room)
    }

    if(parsedMessage.type==="UNSUBSCRIBE"){
      users[id].rooms= users[id].rooms.filter(x=> x !== parsedMessage.room)
    }

    if(parsedMessage.type==="sendMessage"){
      const message= parsedMessage.message ;
      const roomId = parsedMessage.roomId ;

      Object.keys(users).forEach((userId)=>{
        const {ws, rooms}= users[userId];
        if(rooms.includes(roomId)){
          ws.send(message);
        }
      })
    }
    


 });

});


function getRandomId():number{
  return Math.random()
}