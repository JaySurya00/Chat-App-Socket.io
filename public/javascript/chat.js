const socket=io();

//Elements

const $messageForm= document.getElementById('message-form');
const $messageFormInput= $messageForm.querySelector('input');
const $messageFormButton= $messageForm.querySelector('button');
const $locationButton= document.querySelector('#geo-location');
const $messages=document.querySelector('.chat__messages');
const $sidebar= document.querySelector('#sidebar');

const {username, room}=Qs.parse(location.search, {ignoreQueryPrefix: true});

console.log(username, room);

socket.emit('join', {username, room}, (error)=>{
    if(error)
    {
         alert(error);
         location.href ='/';

    }
});

const autoScroll=()=>{
    
    const $newMessage=$messages.lastElementChild;
    const newMessageStyle= getComputedStyle($newMessage);
    const newMessageMargin= parseInt(newMessageStyle.marginBottom);
    const newMessageHeight= $newMessage.offsetHeight+newMessageMargin;

    const visibleHeight= $messages.offsetHeight;

    const containerHeight= $messages.scrollHeight;

    const scrollOffset= $messages.scrollTop+visibleHeight;

    console.log(containerHeight, newMessageHeight, scrollOffset, visibleHeight);

    if(containerHeight-newMessageHeight-scrollOffset<=1)
    {
        $messages.scrollTop=$messages.scrollHeight;
    }
}


socket.on('message',(messageObj,)=>{
    const messageDiv= document.createElement('div');
    messageDiv.innerHTML=`<p>
    <span class="message__name">Admin</span>
    <span class="message__meta">${moment(new Date().getTime()).format('h:mm a')}</span>
    </p>
    <p>${messageObj.message}</p>`;
    messageDiv.classList.add('message');
    $messages.insertAdjacentElement('beforeend', messageDiv);
})


socket.on('sendMessage',(messageObj)=>{
    const messageDiv= document.createElement('div');
    messageDiv.innerHTML=`<p>
    <span class="message__name">${messageObj.username}</span>
    <span class="message__meta">${moment(new Date().getTime()).format('h:mm a')}</span>
    </p>
    <p>${messageObj.message}</p>`;
    messageDiv.classList.add('message');
    $messages.insertAdjacentElement('beforeend', messageDiv);
    autoScroll();
})

socket.on('chatRoomUsers',(users)=>{
    $sidebar.innerHTML='';
    let userList="";
    users.forEach((user)=>{
        userList+=`<li>${user.username}</li>`;
    })
    const sidebarEle= document.createElement('div');
    sidebarEle.innerHTML=
        `  
            <h2 class="room-title">${users[0].room}</h2>
            <h3 class="list-title">Users</h3>
            <ul class="users">
                ${userList}
            </ul>
        `;
    $sidebar.insertAdjacentElement('beforeend',sidebarEle);
})


$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    $messageFormButton.setAttribute('disabled',"");
    const message=e.target.elements.msg.value;
    socket.emit('sendMessage',message,(ack)=>{
        $messageFormButton.removeAttribute('disabled');
        console.log(ack);
    })
})

$locationButton.addEventListener('click', ()=>{
    $locationButton.setAttribute('disabled',"");
    navigator.geolocation.getCurrentPosition((location)=>{
        const {latitude, longitude}= location.coords;
        socket.emit('location',{latitude, longitude}, (ack)=>{
            $locationButton.removeAttribute('disabled');
            console.log(ack)
        });
    })
})

socket.on('location',(location, user)=>{
    const {latitude, longitude}=location;
    const url=`www.google.com/maps?q=${latitude},${longitude}`;
    const locationDiv= document.createElement('div');
    locationDiv.innerHTML=`<p>
    <span class="message__name">${user.username}</span>
    <span class="message__meta">${moment(new Date().getTime()).format('h:mm a')}</span>
    </p>
    <p><a href="//${url}" target="_blank">My current location</a></p>`;
    locationDiv.classList.add('message');
    $messages.insertAdjacentElement('beforeend', locationDiv);
    autoScroll();
})

