import * as util from './util.js';
import * as modal from './modal.js';
import * as post from './post.js';
import * as profile from './profile.js';
import {api} from "./main.js";


export default function initPage(){
    let nav = document.getElementsByClassName("nav")[0];
    let main = document.getElementsByTagName("main")[0];

    // clean the page
    util.removeAllChild(nav);
    util.removeAllChild(main);


    if (! sessionStorage.getItem("token")){
        // navbar with login and registration button
        let btn_login = document.createElement("li");
        btn_login.classList.add("nav-item");
        btn_login.textContent = "Login";

        let btn_register = document.createElement("li");
        btn_register.classList.add("nav-item");
        btn_register.textContent = "Registration";

        nav.appendChild(btn_login);
        nav.appendChild(btn_register);

        // main tag shows the form        
        let form = document.createElement("form");
        form.classList.add("authform");

        main.appendChild(form);

        // show two forms
        btn_login.addEventListener("click", showLoginForm, false);
        btn_register.addEventListener("click", showRegisterForm, false);

        // default show login form
        btn_login.click();
    }
    else{
        // login already
        // search bar for username (bonus feature)
        let div_search = document.createElement("div");
        div_search.classList.add("nav-search");

        let search_input = document.createElement("input");
        search_input.type = "text";
        search_input.placeholder = "Search Username";

        let search_i = document.createElement("div");
        search_i.classList.add("material-icons");
        search_i.textContent = "search";
        
        div_search.appendChild(search_i);
        div_search.appendChild(search_input);

        // home, myprofile, notification, logout four buttons
        let btn_home = document.createElement("li");
        btn_home.classList.add("nav-item");
        btn_home.classList.add("material-icons");
        btn_home.textContent = "home";

        let btn_profile = document.createElement("li");
        btn_profile.classList.add("nav-item");
        btn_profile.classList.add("material-icons");
        btn_profile.textContent = "account_circle";

        let btn_notice = document.createElement("li");
        btn_notice.classList.add("nav-item");
        btn_notice.classList.add("material-icons");
        btn_notice.textContent = "circle_notifications";

        // notice has an icon, for new notice
        let icon_notice = document.createElement("i");
        icon_notice.classList.add("material-icons");
        icon_notice.textContent = "snooze";
        icon_notice.style.display = "none";
        btn_notice.appendChild(icon_notice);

        btn_notice.addEventListener("click", function(){
            alertForNewFeed();
            return;
        });

        let btn_logout = document.createElement("li");
        btn_logout.classList.add("nav-item");
        btn_logout.classList.add("material-icons");
        btn_logout.textContent = "logout";

        // link
        util.appendListChild(nav, [
            div_search, btn_home, btn_notice, btn_profile, btn_logout
        ]);

        search_input.addEventListener("keydown", function(e){
            if (e.keyCode !== 13){
                return;
            }

            if (search_input.value == ""){
                let modal_dict = modal.createSimpleModal(
                    "Search User Error",
                    "Please enter the username then press Enter...",
                    "OK"
                );

                modal_dict['footer_close'].addEventListener("click", function(){
                    util.removeSelf(modal_dict['modal']);
                    return;
                });

                return;
            }
            else{
                profile.showProfile(null, search_input.value);
            }

            search_input.value = "";
            return;
        });

        btn_home.addEventListener("click", initPage);

        btn_profile.addEventListener("click", function(){
            profile.showProfile(sessionStorage.getItem("id"));
        });
        
        // btn_notice.addEventListener("click", showNotice);
        btn_logout.addEventListener("click", logout);

        util.fetchMyInfo();
        post.initPageFeed();
    }

    return;
}


function alertForNewFeed(){
    // get dom element
    let nav = document.getElementsByClassName("nav")[0];
    let icon_notice = nav.getElementsByTagName("i")[0];

    // get the storage
    let new_post_counter = parseInt(sessionStorage.getItem("new_post_counter"));
    let author_list = JSON.parse(sessionStorage.getItem("new_post_author_list"));

    // if no new post
    if (new_post_counter == 0){        
        // modal window
        let modal_dict = modal.createSimpleModal(
            "No New Notice",
            "Your friends have not made new posts since your last fetching.",
            "OK",
        );

        modal_dict['footer_close'].addEventListener("click", function(){
            util.removeSelf(modal_dict['modal']);
            return;
        })

    }
    else{
        // there is new post
        icon_notice.style.display = "none";

        let modal_dict = modal.createYesNoModal(
            "There are " + new_post_counter + " new posts.",
            "",
            "Show me !",
            "Close",
        );

        if (new_post_counter == 1){
            modal_dict['body_p'].textContent = "Your friend " + author_list[0] + " has made a new post !!";
        } 
        else{
            // multiple posts
            if (author_list.length == 1){
                modal_dict['body_p'].textContent = "Your friend " + author_list[0] + " has made new posts !!";
            }
            else{
                modal_dict['body_p'].textContent = "Your friends ";

                for (let i = 0; i < author_list.length - 1; i++){
                    modal_dict['body_p'].textContent += author_list[i] + ", ";
                }
    
                modal_dict['body_p'].textContent += "and " + author_list[author_list.length - 1] + " have made new posts !!";
            }
        }

        modal_dict['footer_yes'].addEventListener("click", function(){
            util.removeSelf(modal_dict['modal']);

            // reset the storage
            sessionStorage.setItem("new_post_counter", 0);

            // go to the feed page
            initPage();
            return;
        });

        modal_dict['footer_no'].addEventListener("click", function(){
            util.removeSelf(modal_dict['modal']);
            return;
        });

    }    
}


function logout(){
    // confirm logout first
    let modal_dict = modal.createYesNoModal(
        "Confirm Log Out",
        "Are you sure to log out?",
        "Yes",
        "No"
    );

    modal_dict['footer_yes'].addEventListener('click', function(){
        localStorage.clear();
        sessionStorage.clear();
        initPage();
        return;
    });

    modal_dict['footer_no'].addEventListener('click', function(){
        util.removeSelf(modal_dict['modal']);
        return;
    });
}


function showLoginForm(){
    let main = document.getElementsByTagName("main")[0];
    let form = main.getElementsByTagName("form")[0];

    while (form.firstChild){
        form.removeChild(form.lastChild);
    }

    let title = document.createElement("div");
    title.classList.add("title");
    title.textContent = "Login Form";

    let label_name = document.createElement("label");
    label_name.for = "username";
    label_name.textContent = "Please enter username";

    let input_name = document.createElement("input");
    input_name.type = "text";
    input_name.placeholder = "Username";

    let label_pwd = document.createElement("label");
    label_pwd.for = "password";
    label_pwd.textContent = "Please enter password";

    let input_pwd = document.createElement("input");
    input_pwd.type = "password";
    input_pwd.placeholder = "Password";

    let label_pwd2 = document.createElement("label");
    label_pwd2.for = "password";
    label_pwd2.textContent = "Please confirm password";

    let input_pwd2 = document.createElement("input");
    input_pwd2.type = "password";
    input_pwd2.placeholder = "Confirm password";

    let btn_submit = document.createElement("button");
    btn_submit.type = "button";
    btn_submit.textContent = "Submit";

    // link
    util.appendListChild(form, [
        title,
        label_name, input_name, 
        label_pwd, input_pwd, 
        label_pwd2, input_pwd2,
        btn_submit
    ]);


    // submit function
    btn_submit.onclick = function(){
        let name = input_name.value;
        let pwd = input_pwd.value;
        let pwd2 = input_pwd2.value;

        // check all fields are filled
        if (name == null || name == ""){
            let modal_dict = modal.createSimpleModal(
                "Login Form Error",
                "Please input your username.",
                "OK"
            );

            modal_dict['footer_close'].addEventListener("click", function(){
               main.removeChild(modal_dict['modal']);
               input_name.focus();
               return;                
            });

            return;
        }

        if (pwd == ""){
            let modal_dict = modal.createSimpleModal(
                "Login Form Error",
                "Please enter the password.",
                "OK"
            );

            modal_dict['footer_close'].addEventListener("click", function(){
                main.removeChild(modal_dict['modal']);
                input_pwd.focus();
                return;                
            });

            return;            
        }


        if (pwd2 == ""){
            let modal_dict = modal.createSimpleModal(
                "Login Form Error",
                "Please re-enter the password for confirmation.",
                "OK"
            );
            modal_dict['footer_close'].addEventListener("click", function(){
                main.removeChild(modal_dict['modal']);
                input_pwd2.focus();
                return;                
            });

            return;      
        }

        if (pwd !== pwd2){
            let modal_dict = modal.createSimpleModal(
                "Login Form Error",
                "Password not match. Please check.",
                "OK"
            );

            modal_dict['footer_close'].addEventListener("click", function(){
               main.removeChild(modal_dict['modal']);
               input_pwd2.focus();
               return;                
            });

            return;
        }

        // post        
        let data = {
            'username': name,
            'password': pwd
        };

        let init = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

        api.makeAPIRequest("auth/login", init)
            .then((data) => {
                let token = data['token'];
                sessionStorage.setItem("token", token);

                let modal_dict = modal.createSimpleModal(
                    "Login Status",
                    "Log in success !!",
                    "OK"
                );

                modal_dict['footer_close'].addEventListener('click', function(){
                    initPage();
                    return;
                });
            })
            .catch((error) => {
                if (error == 403){
                    let modal_dict = modal.createSimpleModal(
                        "Login Status",
                        "Log in fail. Please check your username and password.",
                        "OK"
                    );
        
                    modal_dict['footer_close'].addEventListener("click", function(){
                        sessionStorage.clear();

                        util.removeSelf(modal_dict['modal']);
                        input_name.focus();
                        return;                
                    });    
                }
                else if (error == "Failed to fetch"){
                    util.failed_to_fetch_before_login();
                }
                else{
                    alert("error");
                    console.log(error);
                }
            })
        ;

    }
}


function showRegisterForm(){
    let main = document.getElementsByTagName("main")[0];
    util.removeAllChild(main);

    let form = document.createElement("form");
    form.classList.add("authform");
    main.appendChild(form);

    // form details
    let title = document.createElement("div");
    title.classList.add("title");
    title.textContent = "Login Form";    

    let label_username = document.createElement("label");
    label_username.for = "username";
    label_username.textContent = "Please create username";

    let input_username = document.createElement("input");
    input_username.type = "text";
    input_username.placeholder = "Username";

    let label_pwd = document.createElement("label");
    label_pwd.for = "password";
    label_pwd.textContent = "Please create password";

    let input_pwd = document.createElement("input");
    input_pwd.type = "password";
    input_pwd.placeholder = "Password";

    let label_pwd2 = document.createElement("label");
    label_pwd2.for = "password";
    label_pwd2.textContent = "Please confirm password";

    let input_pwd2 = document.createElement("input");
    input_pwd2.type = "password";
    input_pwd2.placeholder = "Confirm password";   
    
    let label_email = document.createElement("label");
    label_email.for = "email";
    label_email.textContent = "Please enter your email";

    let input_email = document.createElement("input");
    input_email.type = "email";
    input_email.placeholder = "Please enter your email";

    let label_name = document.createElement("label");
    label_name.for = "name";
    label_name.textContent = "Please enter your name";    

    let input_name = document.createElement("input");
    input_name.type = "text";
    input_name.placeholder = "Name";

    let btn_submit = document.createElement("button");
    btn_submit.type = "button";
    btn_submit.textContent = "Submit";

    // link
    util.appendListChild(form, [
        title,
        label_username, input_username, 
        label_pwd, input_pwd, 
        label_pwd2, input_pwd2,
        label_email, input_email,
        label_name, input_name,
        btn_submit
    ])


    btn_submit.onclick = function(){
        let username = input_username.value;
        let pwd = input_pwd.value;
        let pwd2 = input_pwd2.value;
        let email = input_email.value;
        let name = input_name.value;
        
        // enter all fields
        if (username == ""){
            let modal_dict = modal.createSimpleModal(
                "Registration Form Error",
                "Please create your username.",
                "OK"
            );

            modal_dict['footer_close'].addEventListener("click", function(){
               main.removeChild(modal_dict['modal']);
               input_username.focus();
               return;                
            });

            return;
        }

        if (pwd == ""){
            let modal_dict = modal.createSimpleModal(
                "Registration Form Error",
                "Please create your password.",
                "OK"
            );

            modal_dict['footer_close'].addEventListener("click", function(){
                main.removeChild(modal_dict['modal']);
                input_pwd.focus();
                return;                
            });

            return;            
        }

        if (pwd2 == ""){
            let modal_dict = modal.createSimpleModal(
                "Registration Form Error",
                "Please confirm your password.",
                "OK"
            );

            modal_dict['footer_close'].addEventListener("click", function(){
                main.removeChild(modal_dict['modal']);
                input_pwd2.focus();
                return;                
            });
            return;
        }

        if (pwd !== pwd2){
            let modal_dict = modal.createSimpleModal(
                "Registration Form Error",
                "Passwords not match. Please check.",
                "OK"
            );

            modal_dict['footer_close'].addEventListener("click", function(){
                main.removeChild(modal_dict['modal']);
                input_pwd2.focus();
                return;                
            });

            return;
        }

        if (email == ""){
            let modal_dict = modal.createSimpleModal(
                "Registration Form Error",
                "Please enter your email",
                "OK"
            );

            modal_dict['footer_close'].addEventListener("click", function(){
                main.removeChild(modal_dict['modal']);
                input_email.focus();
                return;                
            });

            return;
        }

        if (name == ""){
            let modal_dict = modal.createSimpleModal(
                "Registration Form Error",
                "Please enter your name",
                "OK"
            );

            modal_dict['footer_close'].addEventListener("click", function(){
                main.removeChild(modal_dict['modal']);
                input_name.focus();
                return;                
            });

            return;
        }

        // fetch
        let url = "http://localhost:5000/auth/signup";

        let data = {
            'username': username,
            'password': pwd,
            'email': email,
            'name': name
        };

        let init = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

        api.makeAPIRequest("auth/signup", init)
            .then((data) => {
                let token = data['token'];
                sessionStorage.setItem("token", token);

                let modal_dict = modal.createSimpleModal(
                    "Registration Status",
                    "Registration success !!",
                    "OK"
                );

                modal_dict['footer_close'].addEventListener('click', function(){
                    initPage();
                    return;
                });              
            })
            .catch((error) => {
                if (error == 409){
                    let modal_dict = modal.createSimpleModal(
                        "Registration Form Error",
                        "The username has been taken. Please create another one.",
                        "OK"
                    );
        
                    modal_dict['footer_close'].addEventListener("click", function(){
                        main.removeChild(modal_dict['modal']);
                        input_username.focus();
                        return;                
                    });                  
                }
                else if (error == "Failed to fetch"){
                    util.failed_to_fetch_before_login();
                }
                else{
                    alert("error");
                    console.log(error);
                }
            })
        ;
    };
}


window.addEventListener("hashchange", function(){
    let hash_str = window.location.hash.substr(1,);

    if (hash_str.length == 0){
        initPage();
        return;
    }

    let hash_str_params = hash_str.split("&");

    for (let i = 0; i < hash_str_params.length; i++){
        let param_split = hash_str_params[i].split("=");
        
        if (param_split.length == 1){
            if (param_split[0].toLowerCase() == "feed"){
                initPage();
                return;
            }
            else{
                let modal_dict = modal.createSimpleModal(
                    "URL Fragment Error",
                    "Sorry. The URL fragment you entered is not recognized. Currently we support #profile={username} or #feed only. Thank you.",
                    "OK"
                );
    
                modal_dict['footer_close'].addEventListener("click", function(){
                    modal_dict['modal'].parentNode.removeChild(modal_dict['modal']);
                    return;
                })
    
                return;
            }
        }
        else if (param_split[0].toLowerCase() === "profile"){
            // if the name is not provided, default to me
            let username = param_split.length == 2 ? param_split[1] : "me";

            if (username === "me"){
                profile.showProfile(parseInt(sessionStorage.getItem("id")), null);
            }
            else{
                profile.showProfile(null, username);
            }

            return;
        }
        else{
            // wrong fragment
            let modal_dict = modal.createSimpleModal(
                "URL Fragment Error",
                "Sorry. The URL fragment you entered is not recognized. Currently we support #profile={username} or #feed only. Thank you.",
                "OK"
            );

            modal_dict['footer_close'].addEventListener("click", function(){
                modal_dict['modal'].parentNode.removeChild(modal_dict['modal']);
                return;
            })

            return;
        }
    }
});









