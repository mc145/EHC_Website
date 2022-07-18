let logoutLink = document.getElementById("logout-link"); 

logoutLink.onclick = function(e) {
    return myHandler(e); 
}


function myHandler(e){


    const xhr = new XMLHttpRequest(); 
    xhr.open('POST', 'http://localhost:5555/logout'); 

    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    xhr.send(); 

    xhr.onload = () => {
        console.log(xhr.responseText); 

        if(JSON.parse(xhr.responseText).status === 0){
            window.location.href = "http://localhost:5555/login"; 
        }
    }; 
    return false; 
}

