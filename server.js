import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

const msgs = []
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public/index.html'));
})

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('set-user-socket', nickname =>{
        socket.nickname = nickname
        socket.broadcast.emit('add-msg', {from: 'System', txt: `${nickname} has joined the chat`})

    })

    socket.on('send-msg', async (msg) => {
        console.log('message: ' , msg);

        msgs.push(msg)

        if(msg.to) {
            const userSocket = await _getUserSocket(msg.to)
            userSocket.emit('add-msg', msg)
        }
        else io.to(socket.topic).emit('add-msg', msg)//io.emit('add-msg', msg)

        // setTimeout( () => {
        //     socket.emit('add-msg', {from: 'System', txt: 'We are here for you'})
        // }, 1500)
    })

    socket.on('set-topic', (topic) => {
        if(socket.topic) socket.leave(socket.topic)

        socket.topic = topic
        socket.join(topic)

        const msgsByTopic = msgs.filter(msg => msg.topic === socket.topic)
        socket.emit('add-msgs', msgsByTopic)
    })

    socket.on('disconnect', () => {
      console.log('user disconnected');
    })
})

async function _getUserSocket(nickname) {
    const sockets = await _getAllSockets()
    const socket = sockets.find(s => s.nickname === nickname)
    return  socket
}

async function _getAllSockets() {
    const sockets = await io.fetchSockets()
    return sockets
}

server.listen(3030, () => {
  console.log('server running at http://localhost:3030');
})