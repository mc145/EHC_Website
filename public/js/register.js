
let registerForm = document.querySelector('form'); 
let errorDiv = document.getElementsByClassName('error-container')[0]; 
let errorMessage = document.getElementById('error-message'); 


const API_URL = 'http://localhost:5555/auth/register'; 

registerForm.addEventListener('submit', (event) =>{
    event.preventDefault(); 
    const registerData = new FormData(registerForm); 

    let email = registerData.get('email');   
    let password = registerData.get('password'); 

    email = email.trim(); 
    password = password.trim(); 

    registerForm.reset(); 

    const registerDataToSend = {
        'email': email, 
        'password': password
    }; 

    const xhr = new XMLHttpRequest(); 
    xhr.open('POST', API_URL); 

    xhr.setRequestHeader('Content-Type', 'application/json'); 
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); 

    xhr.send(JSON.stringify(registerDataToSend)); 

    xhr.onload = () => {
        console.log(JSON.parse(xhr.responseText.toString()));
        if(JSON.parse(xhr.responseText.toString()).status !== 1){
            window.location.href = JSON.parse(xhr.responseText.toString()); 

        } 
        else{
            errorMessage.innerHTML = JSON.parse(xhr.responseText.toString()).message; 
            errorDiv.style.opacity = "100%"; 
        }
    }; 

}); 