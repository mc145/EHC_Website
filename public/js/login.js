
let loginForm = document.querySelector('form'); 
let errorDiv = document.getElementsByClassName('error-container')[0]; 
let errorMessage = document.getElementById('error-message'); 


const API_URL = 'http://localhost:5555/auth/login'; 

loginForm.addEventListener('submit', (event) =>{
    event.preventDefault(); 
    const loginData = new FormData(loginForm); 

    const email = loginData.get('email');   
    const password = loginData.get('password'); 


    loginForm.reset(); 

    const loginDataToSend = {
        'email': email, 
        'password': password
    }; 

    const xhr = new XMLHttpRequest(); 
    xhr.open('POST', API_URL); 

    xhr.setRequestHeader('Content-Type', 'application/json'); 
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); 

    xhr.send(JSON.stringify(loginDataToSend)); 

    xhr.onload = () => {
        console.log(xhr.responseText); 
        //window.location.href = JSON.parse(xhr.responseText.toString()); 
        let responseData = JSON.parse(xhr.responseText);
        if(responseData.status === 0){
            window.location.href = "http://localhost:5555/"; 
        } 
        else{
            errorMessage.innerHTML = responseData.message; 
            errorDiv.style.opacity = "100%"; 
        }
    }; 

}); 


