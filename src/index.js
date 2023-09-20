const express= require('express');
const path= require('path');
const http= require('http');
const socketio= require('socket.io');
const Filter= require('bad-words');
const engine= require('ejs');
const {generateMessage}= require('./utils/message.js');
const { addUser, removeUser, getUser, getUserInRoom }= require('./utils/users.js');

const app= express();
const server= http.createServer(app);
const io= new socketio.Server(server);

const port= process.env.PORT || 3000;
const publicDirectoryPath= path.join(__dirname,'../public');
const viewDir= path.join(__dirname,'../view');

app.use(express.static(publicDirectoryPath));
app.set('view engine', 'ejs');
app.set('views',viewDir);
// app.engine('ejs', engine);

app.get('/',(req, res)=>{
    res.render('index.ejs');
})
app.get('/chat',(req, res)=>{
    res.render('chat.ejs');
})



const filter= new Filter();

io.on('connection',(socket)=>{
    console.log('New Client Connection!');

    socket.on('join',({ username, room }, callback)=>{
        const {user, error}= addUser({id:socket.id, username:username, room:room});
        if(error)
        {
            return callback(error);
        }
        socket.join(room);
        socket.emit('message', generateMessage('Admin','Welcome!'));
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin', `${user.username} has joined.`));
        io.to(user.room).emit('chatRoomUsers',getUserInRoom(user.room));
    })


    socket.on('sendMessage',(msg, callback)=>{

        const user= getUser(socket.id);
        
        if(filter.isProfane(msg))
        {
            io.to(user.room).emit('sendMessage',generateMessage(user.username,filter.clean(msg)));
        }
        else{
            io.to(user.room).emit('sendMessage',generateMessage(user.username,msg));
        }
        callback('Delivered');
    })


    socket.on('location',(location, callback)=>{
        const user= getUser(socket.id);
        io.to(user.room).emit('location',location, user);
        callback('Location Shared');
    })

    socket.on('disconnect',()=>{
        const user= removeUser(socket.id);
        if(user)
        {
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left the room`));
            io.to(user.room).emit('chatRoomUsers',getUserInRoom(user.room));
        }
    })



});



server.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})