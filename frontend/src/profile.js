import * as util from './util.js';
import * as modal from './modal.js';
import * as post_module from './post.js';
import initPage from './init.js';
import {api} from "./main.js";


export function showProfile(id, username){
    // if id not null, use id
    // otherwise use username
    if (id === null && username === null){
        alert("error");
        console.log("showProfile requires one from id and username");
        return;
    }

    let url_endpoint = "user/?";

    if (id !== null){
        url_endpoint += "id=" + id;
    }
    else{
        url_endpoint += "username=" + username;
    }

    let init = {
        method: 'GET',
        headers: {
            'Authorization': 'token ' + sessionStorage.getItem("token"),
        }
    };

    api.makeAPIRequest(url_endpoint, init)
        .then((data) => {
            displayProfile(data);
        })
        .catch((error) => {
            if (error == 403){
                util.force_log_out();
            }
            else if (error == 404){
                // user not found: very rare
                let modal_dict = modal.createSimpleModal(
                    'User Profile Error',
                    "Sorry. We cannot find the user. Please try again later...",
                    "OK"
                );

                modal_dict['footer_close'].addEventListener("click", function(){
                    util.removeSelf(modal_dict['modal']);
                    initPage();
                    return;
                });

                return;                
            }
            else if (error == "Failed to fetch"){
                util.failed_to_fetch_after_login();
                // here we can still display some posts from the sessionStorage
            }
            else{
                alert("error");
                console.log(error);
            }
        })
    ;

    return;
}


function displayProfile(data){
    // first clear the main tag
    let main = document.getElementsByTagName("main")[0];
    util.removeAllChild(main);

    // wrap with a div called main-profile
    let wrapper = document.createElement("div");
    wrapper.classList.add("profile-wrapper");
    main.appendChild(wrapper);


    // profile: two parts, profile and posts
    let profile = document.createElement("div");
    profile.classList.add("profile");
    profile.setAttribute("id", data['id']);

    let posts = document.createElement("div");
    posts.classList.add("profile-posts");

    util.appendListChild(wrapper, [profile, posts]);
 
    displayProfileFillProfile(profile, data);
    displayProfileFillPosts(posts, data);

    return;
}


function displayProfileFillProfile(profile, data){
    // profile: username, name, email, following who and followed_num
    // need to have two formats: my profile, and others's profile
    // for my profile, add the edit function
    // for others' profile, add follow / unfollow button

    let is_my_profile = sessionStorage.getItem("username") == data['username'];

    let username = document.createElement("div");
    username.classList.add("username");
    
    let name = document.createElement("div");
    name.classList.add("name");

    let email = document.createElement("div");
    email.classList.add("email");

    if (is_my_profile){
        username.textContent = "Your username: " + data['username'];
        name.textContent = "Your name: " + data['name'];
        email.textContent = "Your email: " + data['email'];
    }
    else{
        username.textContent = "Username: " + data['username'];
        name.textContent = "Name: " + data['name'];
        email.textContent = "Email: " + data['email'];        
    }


    // following: a title, and various username, also has click event 
    let following = document.createElement("div");
    following.classList.add("following");

    if (data['following'].length == 0){
        let following_nothing = document.createElement("div");
        following_nothing.classList.add("nothing");

        if (is_my_profile){
            following_nothing.textContent = "You are not following anyone at this moment..";
        }
        else{
            following_nothing.textContent = "The user is not following anyone at this moment..";
        }
        
        following.appendChild(following_nothing);
    }
    else{
        // label, then names
        // each name also has click event
        let following_label = document.createElement("div");
        following_label.classList.add("label");
        
        if (data['following'].length == 1){
            following_label.textContent = is_my_profile ? "You are following 1 user: " : "Following 1 user: ";
        }
        else{
            if (is_my_profile){
                following_label.textContent = "You are following " + data['following'].length + " users: ";
            }
            else{
                following_label.textContent = "Following " + data['following'].length + " users: ";
            }
        }

        let following_names = document.createElement("div");
        following_names.classList.add("names");
        
        util.appendListChild(following, [following_label, following_names]);

        // promise to get all names from id
        let url_endpoint_list = data['following'].map(id => "user/?id=" + id);

        let init = {
            method: 'GET',
            headers: {
                'Authorization': 'token ' + sessionStorage.getItem("token"),
            }
        };


        Promise.all(url_endpoint_list.map(each_endpoint => api.makeAPIRequest(each_endpoint, init)))
            .then((results) => {
                for (let i = 0; i < results.length; i++){
                    let this_name = document.createElement("div");
                    this_name.classList.add("name");
                    this_name.textContent = results[i]['username'];

                    this_name.addEventListener("click", function(){
                        showProfile(results[i]['id'], null);
                        return;
                    });

                    following_names.appendChild(this_name);
                }
            })
            .catch((error) => {
                if (error == 403){
                    util.force_log_out();
                }
                else{
                    alert("error");
                    console.log(error);
                }
            })
        ;
    }

    // follwed num
    let followed_num = document.createElement("div");
    followed_num.classList.add("followed");

    if (data['followed_num'] == 0){
        if (is_my_profile){
            followed_num.textContent = "You are not followed by anyone at this moment..";
        }
        else{
            followed_num.textContent = "So far no one has followed this user.";
        }
    }
    else if (data['followed_num'] == 1){
        if (is_my_profile){
            followed_num.textContent = "You are followed by one user.";
        }
        else{
            followed_num.textContent = "This user is followed by one user.";
        }
    }
    else{
        if (is_my_profile){
            followed_num.textContent = "You are follwed by " + data['followed_num'] + " users";
        }
        else{
            followed_num.textContent = "This user is follwed by " + data['followed_num'] + " users";
        }        
    }

    // link info
    util.appendListChild(profile, [
        username, name, email, following, followed_num
    ]);


    // if it is my profile, then add the edit button
    // if not mine, then add follow / unfollow button
    if (is_my_profile){
        let btn_edit = document.createElement("button");
        btn_edit.type = "button";
        btn_edit.classList.add("edit");
        btn_edit.textContent = "Edit Profile";
        profile.appendChild(btn_edit);

        btn_edit.addEventListener("click",function(){
            openWindowForProfileEdit(data);
            return;
        });
    }
    else{
        let btn_follow = document.createElement("button");
        btn_follow.type = "button";
        profile.appendChild(btn_follow);

        // check is following or not
        let my_following_list = JSON.parse(sessionStorage.getItem("following"));
        let is_following = false;

        if (my_following_list.includes(data['id'])){
            is_following = true;
            btn_follow.textContent = "- Follow";
            btn_follow.classList.add("follow");
        }
        else{
            btn_follow.textContent = "+ Follow";
            btn_follow.classList.add("nofollow");
        }


        // button click to follow or unfollow
        btn_follow.addEventListener("click", function(){
            let url_endpoint = "user/";

            if (is_following){
                url_endpoint += "unfollow/?username=" + data['username'];
            }
            else{
                url_endpoint += "follow/?username=" + data['username'];
            }

            let init = {
                method: 'PUT',
                headers: {
                    'Authorization': 'token ' + sessionStorage.getItem("token"),
                    'accept': 'application/json',
                },
            };

            api.makeAPIRequest(url_endpoint, init)
                .then((d) => {
                    let modal_dict = modal.createSimpleModal(
                        "", "", "OK"
                    );

                    if (is_following){
                        modal_dict['header_title'].textContent = "Unfollow Success";
                        modal_dict['body_p'].textContent = "Unfollow " + data['username'] + " Successful. Refresh the page now..";
                    }
                    else{
                        modal_dict['header_title'].textContent = "Follow Success";
                        modal_dict['body_p'].textContent = "Follow " + data['username'] + " Successful. Refresh the page now..";
                    }

                    modal_dict['footer_close'].addEventListener("click", function(){
                        util.removeSelf(modal_dict['modal']);
                        util.fetchMyInfo();
                        showProfile(data['id'], null);
                        return;
                    });
                })
                .catch((error) => {
                    if (error == 403){
                        util.force_log_out();
                    }
                    else if (error == "Failed to fetch"){
                        util.failed_to_fetch_after_login();
                        // here we can still display some posts from the sessionStorage
                    }
                    else{
                        alert("error");
                        console.log(error);
                    }
                })
            ;
        });
    }

    return;
}


function openWindowForProfileEdit(data){
    // modal window
    // can only edit name, email, password
    let modal_dict = modal.createYesNoModal(
        "Edit Profile: Edit what you need, and leave others unchanged",
        "",
        "Submit",
        "Close"
    );

    modal_dict['footer_no'].addEventListener("click",function(){
        util.removeSelf(modal_dict['modal']);
        return;
    });

    util.removeAllChild(modal_dict['body']);

    let div_edit = document.createElement("div");
    div_edit.classList.add("profile-edit");
    modal_dict['body'].appendChild(div_edit);

    // section one: name
    let edit_name = document.createElement("div");
    
    let name_label = document.createElement("label");
    name_label.textContent = "Edit Name: ";

    let name_input = document.createElement("input");
    name_input.type = "text";
    name_input.placeholder = "New Name";
    name_input.value = data['name'];

    util.appendListChild(edit_name, [name_label, name_input]);

    // section two: email
    let edit_email = document.createElement("div");

    let email_label = document.createElement("label");
    email_label.textContent = "Edit Email: ";

    let email_input = document.createElement("input");
    email_input.type = "text";
    email_input.placeholder = "New Email";
    email_input.value = data['email'];

    util.appendListChild(edit_email, [email_label, email_input]);

    // section 3: password
    let edit_pwd = document.createElement("div");

    let pwd_label = document.createElement("label");
    pwd_label.textContent = "Edit Password: ";

    let pwd_input = document.createElement("input");
    pwd_input.type = "password";
    pwd_input.placeholder = "New Password";

    util.appendListChild(edit_pwd, [pwd_label, pwd_input]);            

    // section 4: confirm password
    let edit_pwd_2 = document.createElement("div");

    let pwd_label_2 = document.createElement("label");
    pwd_label_2.textContent = "Confirm if you want to edit the password: ";

    let pwd_input_2 = document.createElement("input");
    pwd_input_2.type = "password";
    pwd_input_2.placeholder = "New Password again..";

    util.appendListChild(edit_pwd_2, [pwd_label_2, pwd_input_2]);    

    // last section: error message
    let error_msg = document.createElement("p");
    error_msg.textContent = "";

    // link everything first
    util.appendListChild(div_edit, [edit_name, edit_email, edit_pwd, edit_pwd_2, error_msg]);

    // submit function
    modal_dict['footer_yes'].addEventListener("click", function(){            
        error_msg.textContent = "";                

        let new_name = name_input.value;
        let new_email = email_input.value;
        let new_pwd = pwd_input.value;
        let new_pwd_2 = pwd_input_2.value;

        // check if changed
        if (new_name === ""){
            error_msg.textContent = "Error: The new name cannot be blank !!";
            name_input.focus();
            return;
        }

        if (new_email === ""){
            error_msg.textContent = "Error: The new email cannot be blank !!";
            email_input.focus();
            return;
        }

        let re_email = /^[^\s@]+@[^\s@]+$/;
        if (! re_email.test(new_email)){
            error_msg.textContent = "Error: Wrong email format !!";
            email_input.focus();
            return;
        }

        if (new_pwd !== new_pwd_2){
            error_msg.textContent = "Error: Both passwords do not match !!";
            return;
        }

        // password should be at least 6 characters
        if (new_pwd !== "" && new_pwd.length < 6){
            error_msg.textContent = "Error: Both passwords do not match !!";
            return;
        }

        // prepare the data
        let new_profile_data = {};

        if (new_name !== data['name']){
            new_profile_data['name'] = new_name;
        }

        if (new_email !== data['email']){
            new_profile_data['email'] = new_email;
        }

        if (new_pwd !== ""){
            new_profile_data['password'] = new_pwd;
        }

        // check if nothing new
        if (Object.keys(new_profile_data).length === 0){
            error_msg.style.display = "block";
            error_msg.textContent = "Please edit before submit..";
            return;
        }


        // fetch
        let init = {
            method: 'PUT',
            headers: {
                'Authorization': 'token ' + sessionStorage.getItem("token"),
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: JSON.stringify(new_profile_data),
        };

        api.makeAPIRequest("user/", init)
            .then((data) => {
                // close the current modal window
                util.removeSelf(modal_dict['modal']);

                // open new modal says ok
                let modal_dict_2 = modal.createSimpleModal(
                    "Edit Profile Success",
                    "You have successfully updated your profile !!",
                    "OK",
                );

                // refresh the profile page
                modal_dict_2['footer_close'].addEventListener("click", function(){
                    util.removeSelf(modal_dict_2['modal']);
                    showProfile(sessionStorage.getItem("id"), null);
                    return;
                });
            })
            .catch((error) => {
                if (error == 403){
                    util.force_log_out();
                }
                else if (error == "Failed to fetch"){
                    util.failed_to_fetch_after_login();
                    // here we can still display some posts from the sessionStorage
                }
                else{
                    alert("error");
                    console.log(error);
                }
            })
        ;
    });    
}


function displayProfileFillPosts(posts, data){
    // posts
    if (data['posts'].length == 0){
        let no_posts = document.createElement("div");
        no_posts.classList.add("no-posts");
        no_posts.textContent = "This user has not made any posts yet.";

        let no_posts2 = no_posts.cloneNode(true);
        no_posts2.textContent = "Please try again later";

        util.appendListChild(posts, [no_posts, no_posts2]);

    }
    else{
        // inside post: post position, post controls, and post-end
        let div_post = document.createElement("div");
        posts.appendChild(div_post);
        

        // use the post id to fetch all posts
        // we also list the posts in a descending order of date
        data['posts'].sort(function(a, b){
            return b - a;
        });

        let url_endpoint_list = data['posts'].map(post_id => "post/?id=" + post_id);

        let init = {
            method: 'GET',
            headers: {
                'Authorization': 'token ' + sessionStorage.getItem("token"),
            }
        };


        Promise.all(url_endpoint_list.map(each_endpoint => api.makeAPIRequest(each_endpoint, init)))
            .then((post_data) => {
                // post control button: prev, next
                // insert at the end, before the post-end
                let div_control = document.createElement("div");
                div_control.classList.add("profile-post-control");
                posts.appendChild(div_control);

                let btn_prev = document.createElement("i");
                btn_prev.classList.add("material-icons");
                btn_prev.textContent = "keyboard_arrow_left";

                let btn_next = document.createElement("i");
                btn_next.classList.add("material-icons");
                btn_next.textContent = "keyboard_arrow_right";

                util.appendListChild(div_control, [btn_prev, btn_next]);


                // at first, we only show the first post
                // and the user click 'prev' and 'next' to move back and forth
                let i = 0; 
                post_module.createPostNode(div_post, post_data[i]);

                btn_next.addEventListener("click", function(){
                    i += 1;
                    if (i >= post_data.length){
                        i -= 1;

                        // modal window alert this is already the last page
                        let modal_dict = modal.createSimpleModal(
                            "No More Posts",
                            "Sorry, this is already the last post of this user..",
                            "OK",
                        );

                        modal_dict['footer_close'].addEventListener("click", function(){
                            util.removeSelf(modal_dict['modal']);
                            return;
                        });
                        
                        return;
                    }

                    post_module.createPostNode(div_post, post_data[i]);
                    return;
                });

                btn_prev.addEventListener("click", function(){
                    i -= 1;
                    if (i < 0){
                        i = 0;

                        // modal window alert this is already the last page
                        let modal_dict = modal.createSimpleModal(
                            "No More Posts",
                            "Sorry, this is already the most recent post of this user..",
                            "OK",
                        );

                        modal_dict['footer_close'].addEventListener("click", function(){
                            util.removeSelf(modal_dict['modal']);
                            return;
                        });
                        
                        return;
                    }

                    post_module.createPostNode(div_post, post_data[i]);
                    return;
                });
            })
            .catch((error) => {
                if (error == 403){
                    util.force_log_out();
                }
                else{
                    alert("error");
                    console.log(error);
                }
            })
        ;
    }    
}

