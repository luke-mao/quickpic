import * as util from './util.js';
import * as modal from './modal.js';
import * as profile from './profile.js';
import initPage from './init.js';
import * as helpers from "./helpers.js";
import {api} from "./main.js";


export function initPageFeed(){
    // check token
    if (! sessionStorage.getItem("token")){
        initPage();
    }

    // fetch for post
    let init = {
        method: 'GET',
        headers: {
            'Authorization': 'token ' + sessionStorage.getItem("token"),
        }
    };

    api.makeAPIRequest("user/feed", init)
        .then((data) => {
            // store all posts into the localstorage for backup
            localStorage.setItem("posts", JSON.stringify(data['posts']));

            // display all posts
            initPosts(data['posts']);
            createNewPostSection();

            // also add the current time stamp into the sessionStorage
            let timestamp = new Date().getTime() - new Date().getTimezoneOffset();
            sessionStorage.setItem("last_fetch_feed_time", timestamp / 1000);
            sessionStorage.setItem("new_post_counter", 0);

            // add event listener for every 5 seconds to wait for new feed
            setInterval(checkForNewFeed, 5*1000);

            // also add the infinite scroll
            window.addEventListener("scroll", postsInfiniteScroll);
        })
        .catch((error) => {
            if (error == 403){
                util.force_log_out();
            }
            else if (error == "Failed to fetch"){
                util.failed_to_fetch_after_login();
                // here we can still display some posts from the localstorage
                initPosts(JSON.parse(localStorage.getItem("posts")));
                createNewPostSection();
            }
            else{
                alert("error");
                console.log(error);
            }
        })
    ;

    return;
}


function checkForNewFeed(){
    // if cannot source the token from the sessionStorage
    // then remove this function loop
    if (sessionStorage.getItem("token") == null){
        clearInterval(checkForNewFeed);
        return;
    }


    // get last fetch time
    let last_fetch_feed_time = parseFloat(sessionStorage.getItem("last_fetch_feed_time"));
        
    // fetch the new feed, compare the time with the last_fetch_feed_time
    let init = {
        method: 'GET',
        headers: {
            'Authorization': 'token ' + sessionStorage.getItem("token"),
            'accept': 'application/json',
        },
    };

    api.makeAPIRequest("user/feed?n=30", init)
        .then((d) => {
            let data = d['posts'];
    
            let new_post_counter = 0;
            let author_list = [];

            for (let i = 0; i < data.length; i++){
                if (parseFloat(data[i]['meta']['published']) > last_fetch_feed_time){
                    new_post_counter += 1;

                    if (! author_list.includes(data[i]['meta']['author'])){
                        author_list.push(data[i]['meta']['author']);
                    }
                }
                else{
                    break;
                }
            }

            // store in the sessionStorage
            sessionStorage.setItem("new_post_counter", new_post_counter);
            sessionStorage.setItem("new_post_author_list", JSON.stringify(author_list));

            // get dom element
            let nav = document.getElementsByClassName("nav")[0];
            let icon_notice = nav.getElementsByTagName("i")[0];

            if (new_post_counter == 0){
                icon_notice.style.display = "none";
            }
            else{
                icon_notice.style.display = "block";
            }
        })
        .catch((error) => {
            if (error == 403){
                util.force_log_out();
            }
            else if (error == "Failed to fetch"){
                clearInterval(checkForNewFeed);
            }
            else{
                alert("error");
                console.log(error);
            }
        })
    ;

    return;
}


// create a section for user to enter new post and upload image
function createNewPostSection(){
    let main = document.getElementsByTagName("main")[0];

    let div_create_post = document.createElement("div");
    div_create_post.classList.add("create-post");

    // insert at the top of the main
    main.insertBefore(div_create_post, main.firstChild);

    // innser div
    let post_content = document.createElement("div");
    post_content.classList.add("post-content");
    div_create_post.appendChild(post_content);

    // description: textarea 
    // image upload and preview
    // submit button and clear button
    let input_desc = document.createElement("textarea");
    input_desc.rows = 3;
    input_desc.placeholder = "What's on your mind, " + sessionStorage.getItem("username") + " ?";

    let input_img = document.createElement("input");
    input_img.type = "file";
    input_img.textContent = "Upload my photo";

    let input_img_preview = document.createElement("img");
    input_img_preview.style.display = "none";
    input_img_preview.alt = "New post image preview";

    let input_btns = document.createElement("div");
    input_btns.classList.add("btns");

    let input_submit = document.createElement("button");
    input_submit.type = "button";
    input_submit.classList.add("submit");
    input_submit.textContent = "Submit";

    let input_clear = document.createElement("button");
    input_clear.type = "button";
    input_clear.classList.add("clear");
    input_clear.textContent = "Clear";

    // link
    util.appendListChild(input_btns, [input_submit, input_clear]);
    util.appendListChild(post_content, [input_desc, input_img, input_img_preview, input_btns]);

    // event listener for the upload image
    // then preview
    input_img.addEventListener("change", function(){
        // when change, first hide the img preview
        input_img_preview.src = "";
        input_img_preview.style.display = "none";

        // the backend only supports png at this moment
        let file = input_img.files[0];

        let validFileTypes = ['image/png']
        let valid = validFileTypes.find(type => type === file.type);

        // Bad data, let's walk away.
        if (! valid) {
            let modal_dict = modal.createSimpleModal(
                "Image File Type Error",
                "Sorry. The website only supports png at this moment .....",
                "OK",
            );

            modal_dict['footer_close'].addEventListener("click", function(){
                input_img.value = "";
                input_img_preview.src = "";
                input_img_preview.style.display = "none";

                util.removeSelf(modal_dict['modal']);
                return;
            })

            return;
        }

        helpers.fileToDataUrl(file)
            .then((imgurl) => {
                input_img_preview.src = imgurl;
                input_img_preview.style.display = "block";
            })
            .catch((err) => {
                alert("error");
                console.log(err);
            })


        return;
    });


    input_clear.addEventListener("click", function(){
        input_desc.value = "";
        input_img.value = "";
        input_img_preview.src = "";
        input_img_preview.style.display = "none";    

        return;
    });

    input_submit.addEventListener("click", function(){
        // first check value
        if (input_desc.value == ""){
            let modal_dict = modal.createSimpleModal(
                "New Post Submission Error",
                "Sorry. Please fill your feeling :)",
                "OK",
            );

            modal_dict['footer_close'].addEventListener("click", function(){
                util.removeSelf(modal_dict['modal']);
                input_desc.focus();
                return;
            });

            return;
        }

        if (input_img.files.length == 0){
            let modal_dict = modal.createSimpleModal(
                "New Post Submission Error",
                "Sorry. Please upload an image :)",
                "OK",
            );

            modal_dict['footer_close'].addEventListener("click", function(){
                util.removeSelf(modal_dict['modal']);
                input_img.click();
                return;
            });   
            
            return;
        }

        
        // prepare the data
        let new_post_data = {
            'description_text': input_desc.value,
            'src': input_img_preview.src.replace("data:image/png;base64,", ""),
        };
        
        let init = {
            method: 'POST',
            headers: {
                'Authorization': 'token ' + sessionStorage.getItem('token'),
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: JSON.stringify(new_post_data), 
        };

        api.makeAPIRequest("post", init)
            .then((data) => {
                // so the user cannot see own posts in the feed
                // provide a link for the user to see the posts in the profile
                let modal_dict = modal.createYesNoModal(
                    "Success Post",
                    "Great !! The submission is success. You can view the posts in the 'My Profile & Posts' page. Or click the button below.",
                    "Go to my post",
                    "Close",
                );
    
                modal_dict['footer_yes'].addEventListener("click", function(){
                    // go to my profile page
                    // now the latest post is at the top, so no need to scroll
                    profile.showProfile(sessionStorage.getItem("id"), null);
                    return;
                });
                
                modal_dict['footer_no'].addEventListener("click", function(){
                    util.removeSelf(modal_dict['modal']);
                    // clear the post section
                    input_clear.click();
                    return;
                });

                return;
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


    return;
}


function initPosts(data){ 
    let main = document.getElementsByTagName("main")[0];
    util.removeAllChild(main);

    let posts = document.createElement("div");
    posts.classList.add("posts");
    main.appendChild(posts);

    // here also need to consider zero posts

    for (let i = 0; i < data.length; i++){
        let post_data = data[i];

        let post = document.createElement("div");   // empty div
        posts.appendChild(post);

        createPostNode(post, post_data);
    }

    // at the end of posts, give a click to go back to top
    let posts_end = document.createElement("div");
    posts_end.classList.add("posts-end");
    posts_end.textContent = "Posts loading ...";

    posts.appendChild(posts_end);

    return;
}


// input empty div post
// but linked to parent node already
export function createPostNode(post, post_data){
    // remove all contents of the post div
    util.removeAllChild(post);

    let my_id = parseInt(sessionStorage.getItem("id"));

    post.classList.add("post");
    post.setAttribute("post_id", post_data['id']);

    // header: info, & buttons if this post is mine
    let post_header = document.createElement("div");
    post_header.classList.add("post_header");
    post.appendChild(post_header);

    let post_header_info = document.createElement("div");
    post_header_info.classList.add("header-info");
    
    let post_header_btn = document.createElement("div");
    post_header_btn.classList.add("header-btn");

    util.appendListChild(post_header, [post_header_info, post_header_btn]);

    // header-info includes author and time
    let author = document.createElement("div");
    author.classList.add("author");
    author.textContent = post_data['meta']['author'];

    // click the num, will go to the profile page
    author.addEventListener("click", function(){
        profile.showProfile(null, post_data['meta']['author']);
    });

    let time = document.createElement("div");
    time.classList.add("published_time");

    let time_object = new Date(post_data['meta']['published'] * 1000);
    time.textContent = time_object.toString().split(" GMT")[0];

    util.appendListChild(post_header_info, [author, time]);

    // if this post is mine, then add the edit buttons
    if (post_data['meta']['author'] == sessionStorage.getItem("username")){
        addEditDeleteToPostNode(post, post_data);
    }

    // main body
    let description = document.createElement("div");
    description.classList.add("description");
    description.textContent = post_data['meta']['description_text'];
    post.appendChild(description);

    // img
    // the thubmnail is too blur, ignore it
    let img = document.createElement("img");
    img.classList.add("img");
    img.src = "data:image/png;base64," + post_data['src'];
    img.alt = "Big photo for post";
    post.appendChild(img);

    // post_footer
    let post_stats = document.createElement("div");
    post_stats.classList.add("post_stats");
    post.appendChild(post_stats);

    let num_likes = document.createElement("p");
    num_likes.classList.add("num_likes");
    num_likes.textContent = displayNumLikes(post_data['meta']['likes'], my_id);

    num_likes.addEventListener("click", function(){
        showLikesNameList(post_data['meta']['likes']);
        return;        
    });

    // the click event listener is add at below after all dom elements are assigned
    let num_comments = document.createElement("p");
    num_comments.classList.add("num_comments");
    num_comments.textContent = post_data['comments'].length + ' comments';

    util.appendListChild(post_stats, [
        num_likes, num_comments
    ]);

    // two buttons: like, comment
    let post_buttons = document.createElement("div");
    post_buttons.classList.add("post_buttons");
    post.appendChild(post_buttons);        
    
    let btn_like = document.createElement("button");
    btn_like.type = 'button';
    btn_like.textContent = 'Like';

    let btn_comment = document.createElement("button");
    btn_comment.type = 'button';
    btn_comment.textContent = "Comment";

    util.appendListChild(post_buttons, [
        btn_like, btn_comment
    ]); 

    // comment sections
    let post_comments = document.createElement("div");
    post_comments.classList.add("post-comments");
    post.appendChild(post_comments);

    // need to check whether liked already, if already, then change the class
    if (post_data['meta']['likes'].includes(my_id)){
        btn_like.classList.add('liked');
    }
    else{
        btn_like.classList.add('nolike');
    }

    btn_like.addEventListener("click", function(){
        let url_endpoint = "post/";

        let init = {
            method: 'PUT',
            headers: {
                'Authorization': 'token ' + sessionStorage.getItem("token"),
            }
        };

        // need to check whether liked alredy or not
        // if liked already, click this button cancels the like
        if (btn_like.classList.contains("liked")){
            url_endpoint += "unlike" + "?" + "id=" + post_data["id"];
        }
        else{
            url_endpoint += "like" + "?" + "id=" + post_data["id"];
        }

        api.makeAPIRequest(url_endpoint, init)
            .then((data) => {
                if (btn_like.classList.contains("liked")){
                    // pop myid out
                    let id_index = post_data['meta']['likes'].indexOf(my_id);
                    post_data['meta']['likes'].splice(id_index, 1);

                    btn_like.classList.remove("liked");
                    btn_like.classList.add("nolike");
                }
                else{
                    // insert my id
                    post_data['meta']['likes'].push(my_id);

                    btn_like.classList.remove("nolike");
                    btn_like.classList.add("liked");
                }

                num_likes.textContent = displayNumLikes(post_data['meta']['likes'], my_id);

                return;
            })
            .catch((error) => {
                if (error == 403){
                    util.force_log_out();
                }
                else if (error == 404){
                    // post no longer exist, reload the whole page
                    let modal_dict = modal.createSimpleModal(
                        "Error",
                        "Sorry. The post may be deleted just now. Reloading the page...",
                        "OK"
                    );

                    modal_dict['footer_close'].addEventListener("click", function(){
                        util.removeSelf(modal_dict['modal']);
                        initPage();
                        return;
                    });                   
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
    });

    // show a comment section below the post_buttons
    num_comments.addEventListener("click", function(){
        if (post_comments.firstChild){
            util.removeAllChild(post_comments);
            return;
        }

        num_comments.blur();

        // at the top section is for the user to write comment
        let input_comment = document.createElement("textarea");
        input_comment.placeholder = "Write a comment then press Enter...";
        input_comment.rows = 3;
        input_comment.autofocus = true;
        post_comments.appendChild(input_comment);

        // textarea listen to Enter key
        input_comment.addEventListener("keydown", function(e){
            newCommentCheckAndSubmit(e, post_data['id'], post);
            return;
        });


        // the second section is for all existing comments
        if (post_data['comments'].length == 0){
            return;
        }

        let comments = document.createElement("div");
        comments.classList.add("comments");
        post_comments.appendChild(comments);

        let data_comments = post_data['comments'];
        insertAllComments(comments, data_comments);
        
        return;
    });

    btn_comment.addEventListener("click", function(){
        // show comments below the post, not the modal window
        btn_comment.blur();
        num_comments.click();
    });
}


function insertAllComments(comments, data_comments){
    // sort comments based on ascending time
    data_comments.sort(function(a, b){
        return parseFloat(a['published']) - parseFloat(b['published']);
    });


    for (let i = 0; i < data_comments.length; i++){
        let comment = document.createElement("div");
        comment.classList.add("comment");
        comments.appendChild(comment);

        // two sections: comment-header, content
        // the header includes author and time
        let comment_header = document.createElement("div");
        comment_header.classList.add("comment-header");
        
        let comment_author = document.createElement("div");
        comment_author.classList.add("author");
        comment_author.textContent = data_comments[i]['author'];

        comment_author.addEventListener("click", function(){
            profile.showProfile(null, data_comments[i]['author']);
            return;
        })

        let comment_time = document.createElement("div");
        comment_time.classList.add("time");
        let comment_time_object = new Date(data_comments[i]['published'] * 1000);
        comment_time.textContent = comment_time_object.toString().split(" GMT")[0];

        let comment_content = document.createElement("div");
        comment_content.classList.add("content");
        comment_content.textContent = data_comments[i]['comment'];

        // link
        util.appendListChild(comment, [comment_header, comment_content]);
        util.appendListChild(comment_header, [comment_author, comment_time]);               
    }
    
    return;
}


function newCommentCheckAndSubmit(e, post_id, post){
    if (e.keyCode !== 13){
        return;
    }

    // if no comment, alert
    let comment_value = e.target.value;

    if (comment_value === ""){
        let modal_dict = modal.createSimpleModal(
            "Comment Submission Error",
            "Please input your comment first before submission",
            "OK"
        );

        modal_dict['footer_close'].addEventListener("click", function(){
            util.removeSelf(modal_dict['modal']);
            return;
        });

        return;
    }


    // with comment value, confirm comment submission
    let modal_dict = modal.createYesNoModal(
        "Confirm Comment Submission",
        "Ready to submit this comment?",
        "Yes",
        "No"
    );

    modal_dict['footer_no'].addEventListener("click", function(){
        util.removeSelf(modal_dict['modal']);
        return;
    });

    modal_dict['footer_yes'].addEventListener("click", function(){
        util.removeSelf(modal_dict['modal']);

        let url_endpoint_1 = "post/comment/?id=" + post_id;

        let init_1 = {
            method: 'PUT',
            headers: {
                'Authorization': "token " + sessionStorage.getItem("token"),
                'Content-Type': "application/json"
            },
            body: JSON.stringify({
                'comment': comment_value
            })
        };

        api.makeAPIRequest(url_endpoint_1, init_1)
            .then((d) => {
                let url_endpoint_2 = "post/?id=" + post_id;
                    
                let init_2 = {
                    method: 'GET',
                    headers: {
                        'Authorization': 'token ' + sessionStorage.getItem("token"),
                    }
                };

                api.makeAPIRequest(url_endpoint_2, init_2)
                    .then((new_post_data) => {
                        // refresh this post, and open the comment section by default
                        createPostNode(post, new_post_data);
                        post.getElementsByClassName("post_buttons")[0].childNodes[1].click();
                        return;
                    })
                    .catch((error) => {
                        throw error;
                    })
                ;
            })
            .catch((error) => {
                if (error == 403){
                    util.force_log_out();
                }
                else if (error == 404){
                    // post no longer exist, reload the whole page
                    let modal_dict = modal.createSimpleModal(
                        "Error",
                        "Sorry. The post may be deleted just now. Reloading the page...",
                        "OK"
                    );

                    modal_dict['footer_close'].addEventListener("click", function(){
                        util.removeSelf(modal_dict['modal']);
                        initPage();
                        return;
                    });                   
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
    });

    return;    
}


function showLikesNameList(likes_list){
    if (likes_list.length == 0){
        let modal_dict = modal.createSimpleModal(
            "Liked by",
            "This post has not be liked by anyone. Press the 'Like' button to be the first!!",
            "OK"
        );

        modal_dict['modal'].addEventListener("click", function(){
            util.removeSelf(modal_dict['modal']);
            return;
        })

        return;
    }

    // display all names
    // prepare fetch
    let url_endpoint_list = likes_list.map(id => "user/?id=" + id);

    let init = {
        method: 'GET',
        headers: {
            'Authorization': 'token ' + sessionStorage.getItem("token"),
        }
    };


    Promise.all(url_endpoint_list.map(each_endpoint => api.makeAPIRequest(each_endpoint, init)))
        .then((results) => {
            // modal window to show all liked users
            let modal_dict = modal.createSimpleModal(
                "Liked by",
                null,
                "Close"
            );

            // remove the body p
            util.removeAllChild(modal_dict['body']);

            // close button
            modal_dict['footer_close'].addEventListener("click", function(){
                util.removeSelf(modal_dict['modal']);
                return;
            });

            // following list 
            let following_list = JSON.parse(sessionStorage.getItem("following"));

            // add the name list
            for (let i = 0; i < results.length; i++){
                let div_name = document.createElement("div");
                div_name.classList.add("liked-name");
                modal_dict['body'].appendChild(div_name);
                
                // it contains the username in text, 
                // and if liked is not myself, add a button +follow or -follow
                let p = document.createElement("p");
                p.classList.add("username");

                div_name.appendChild(p);

                let button = document.createElement("button");
                button.type = "button";

                if (results[i]['id'] == parseInt(sessionStorage.getItem("id"))){
                    p.textContent = results[i]['username'] + ' (Yourself)';
                }
                else{
                    p.textContent = results[i]['username'];

                    // link the button
                    div_name.appendChild(button);

                    if (following_list.includes(results[i]['id'])){
                        button.textContent = "- follow";
                        button.classList.add("following");
                    }
                    else{
                        button.textContent = "+ follow";
                        button.classList.add("nofollow");
                    }
                }

                // when click, see the profile
                p.addEventListener("click", function(){
                    profile.showProfile(results[i]['id'], null);
                    return;
                })

                // +follow click, -follow click
                button.addEventListener("click", function(){
                    // close the current modal window
                    modal_dict['footer_close'].click();

                    let url_endpoint_2 = "http://localhost:5000/user/";

                    let following = button.classList.contains("following");

                    if (following){
                        url_endpoint_2 += "unfollow/?username=" + results[i]['username'];
                    }
                    else{
                        url_endpoint_2 += "follow/?username=" + results[i]['username'];
                    }

                    let init_2 = {
                        method: 'PUT',
                        headers: {
                            'Authorization': "token " + sessionStorage.getItem("token"),
                        }
                    };

                    api.makeAPIRequest(url_endpoint_2, init_2)
                        .then((d) => {
                            let modal_dict2 = modal.createSimpleModal(
                                "Follow Status",
                                "",
                                "OK"
                            );

                            if (following){
                                modal_dict2['body_p'].textContent = "Unfollow ";
                            }
                            else{
                                modal_dict2['body_p'].textContent = "Follow ";
                            }

                            modal_dict2['body_p'].textContent += results[i]['username'] + " successful. Refreshing the page now..";

                            modal_dict2['footer_close'].addEventListener("click", function(){
                                util.removeSelf(modal_dict2['modal']);

                                // close the modal will refresh the whole screen
                                // consider the person is at the home page or the profile page
                                if (document.getElementsByClassName("profile")[0]){
                                    util.fetchMyInfo();
                                    let target_id = document.getElementsByClassName("profile")[0].getAttribute("id");
                                    profile.showProfile(target_id, null);
                                }
                                else{
                                    // at the home page
                                    initPage();
                                }
                            });
                        })
                        .catch((error) => {
                            throw error;
                        })
                    ;                    
                });
            }
            
        })
        .catch((error) => {
            if (error == 403){
                util.force_log_out();
            }
            else if (error == 404){
                // post no longer exist, reload the whole page
                let modal_dict_2 = modal.createSimpleModal(
                    "Error",
                    "Sorry. Something wrong with the database. Reloading the page...",
                    "OK"
                );

                modal_dict_2['footer_close'].addEventListener("click", function(){
                    util.removeSelf(modal_dict_2['modal']);
                    initPage();
                    return;
                });  
            }
            else{
                alert("error");
                console.log(error);
            }
        })
    ;
    
    return;
}


function displayNumLikes(post_like_list, my_id){
    if (post_like_list.length == 0){
        return "0 likes";
    }
    else if (post_like_list.includes(my_id)){
        if (post_like_list.length == 1){
            return "1 like from you";
        }
        else{
            let other_like_num = post_like_list.length - 1;

            if (other_like_num == 1){
                return "Likes from you and " + other_like_num + ' other';
            }
            else{
                return "Likes from you and " + other_like_num + ' others';
            }
        }
    }
    else if (post_like_list.length == 1){
        return post_like_list.length + ' like';
    }
    else{
        return post_like_list.length + ' likes';
    }
}


function addEditDeleteToPostNode(post, post_data){
    let post_header = post.getElementsByClassName("post_header")[0];
    let post_header_btn = post_header.getElementsByClassName("header-btn")[0];

    // post_header_btn
    // two more buttons: if it is my post
    let btn_edit = document.createElement("button");
    btn_edit.type = "button";
    btn_edit.textContent = "Edit";
    btn_edit.classList.add("edit");

    let btn_delete = document.createElement("button");
    btn_delete.type = "button";
    btn_delete.textContent = "Delete";
    btn_delete.classList.add("delete");

    util.appendListChild(post_header_btn, [btn_edit, btn_delete]);

    // delete function
    btn_delete.addEventListener("click", function(){
        // confirm delete
        let modal_dict = modal.createYesNoModal(
            "Confirm Post Delete",
            "Are you sure to delete this post?",
            "Yes", 
            "No",
        );

        modal_dict['footer_no'].addEventListener("click", function(){
            util.removeSelf(modal_dict['modal']);
            return;
        })

        modal_dict['footer_yes'].addEventListener("click", function(){
            util.removeSelf(modal_dict['modal']);

            let url_endpoint = "post/?id=" + post_data['id'];
            
            let init = {
                method: 'DELETE',
                headers: {
                    'Authorization': 'token ' + sessionStorage.getItem("token"),
                    'accept': 'application/json',
                },
            };

            api.makeAPIRequest(url_endpoint, init)
                .then((d) => {
                    // remove this post node
                    util.removeSelf(post);

                    // post delete successful
                    let modal_dict2 = modal.createSimpleModal(
                        "Success Post Delete",
                        "The post is successfully deleted! Refreshing now !!",
                        "OK",
                    );

                    modal_dict2['footer_close'].addEventListener("click", function(){
                        util.removeSelf(modal_dict2['modal']);

                        // in the website design, delete post only occurs at the profile page
                        profile.showProfile(sessionStorage.getItem("id"), null);

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
    });


    btn_edit.addEventListener("click", function(){
        // modal window shows description text and everything else
        let modal_dict = modal.createYesNoModal(
            "Edit Post",
            "",
            "Submit",
            "Close",
        );

        // remove everything in the body
        util.removeAllChild(modal_dict['body']);

        // add the input box and a image preview
        // support edit the desc and image together
        let div_edit = document.createElement("div");
        div_edit.classList.add("edit");
        modal_dict['body'].appendChild(div_edit);

        let input_desc = document.createElement("textarea");
        input_desc.rows = 3;
        input_desc.placeholder = "Edit post description";
        input_desc.value = post_data['meta']['description_text'];

        let input_img = document.createElement("input");
        input_img.type = "file";

        let input_img_preview = document.createElement("img");
        input_img_preview.src = "data:image/png;base64," + post_data['src'];

        util.appendListChild(div_edit, [input_desc, input_img, input_img_preview]);


        // when input new picture, display it
        input_img.addEventListener("change", function(){    
            // the backend only supports png at this moment
            let file = input_img.files[0];
    
            let validFileTypes = ['image/png']
            let valid = validFileTypes.find(type => type === file.type);
    
            // Bad data, let's walk away.
            if (! valid) {
                // close the original window, display error message, then open the window again
                modal_dict['footer_no'].click();
    
                // new modal window
                let modal_dict2 = modal.createSimpleModal(
                    "Image File Type Error",
                    "Sorry. The website only supports png at this moment .....",
                    "OK",
                );
    
                modal_dict2['footer_close'].addEventListener("click", function(){
                    util.removeSelf(modal_dict2['modal']);
                    btn_edit.click();
                    return;
                })
    
                return;
            }
    
            helpers.fileToDataUrl(file)
                .then((imgurl) => {
                    input_img_preview.src = imgurl;
                })
                .catch((err) => {
                    alert("error");
                    console.log(err);
                })
    
    
            return;
        });       
        

        modal_dict['footer_no'].addEventListener("click", function(){
            util.removeSelf(modal_dict['modal']);
            return;
        });

        
        // submit 
        modal_dict['footer_yes'].addEventListener("click", function(){
            // check if both values are unchanged
            let new_desc = input_desc.value;
            let new_src = input_img_preview.src.replace("data:image/png;base64,", "");

            if (new_desc === post_data['meta']['description_text'] && new_src === post_data['src']){
                // close the current modal window
                util.removeSelf(modal_dict['modal']);

                // modal window alert, then click btn_edit again
                let modal_dict2 = modal.createSimpleModal(
                    "Edit Post Error",
                    "Please edit the description or the image before submit..",
                    "OK",
                );

                modal_dict2['footer_close'].addEventListener("click", function(){
                    util.removeSelf(modal_dict2['modal']);
                    btn_edit.click();
                    return;
                });

                return;
            }


            // also, description text cannot be empty
            if (new_desc === ""){
                // close the current modal window
                util.removeSelf(modal_dict['modal']);

                // modal window alert, then click btn_edit again
                let modal_dict2 = modal.createSimpleModal(
                    "Edit Post Error",
                    "Sorry. The description text cannot be empty...",
                    "OK",
                );

                modal_dict2['footer_close'].addEventListener("click", function(){
                    util.removeSelf(modal_dict2['modal']);
                    btn_edit.click();
                    return;
                });

                return;
            }


            // prepare fetch
            let data = {};
            if (new_desc !==  post_data['meta']['description_text']){
                data['description_text'] = new_desc;
            }

            if (new_src !== post_data['src']){
                data['src'] = new_src;
            }

            let url_endpoint = "post/?id=" + post_data['id'];

            let init = {
                method: 'PUT',
                headers: {
                    'Authorization': 'token ' + sessionStorage.getItem("token") ,
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify(data),
            };

            api.makeAPIRequest(url_endpoint, init)
                .then((data) => {
                    // refetch the whole post and update this node
                    let url_endpoint_2 = "post/?id=" + post_data['id'];
                    let init_2 = {
                        method: 'GET',
                        headers: {
                            'Authorization': 'token ' + sessionStorage.getItem("token"),
                            'accept': 'application/json',
                        },
                    };

                    api.makeAPIRequest(url_endpoint_2, init_2)
                        .then((new_data) => {
                            createPostNode(post, new_data);

                            util.removeSelf(modal_dict['modal']);
        
                            // modal window: successful edit
                            let modal_dict2 = modal.createSimpleModal(
                                "Edit Successful",
                                "The post is successfully updated !!",
                                "OK",
                            );
        
                            modal_dict2['footer_close'].addEventListener("click", function(){
                                util.removeSelf(modal_dict2['modal']);
                                return;
                            });
                        })
                        .catch((error) => {
                            throw error;
                        })
                    ;
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
    });


    return;
}


// infinite scroll
function postsInfiniteScroll(){
    if (window.innerHeight + window.pageYOffset + 150 <= document.body.scrollHeight){
        return;
    }

    let posts = document.getElementsByClassName("posts")[0];
    if (! posts){
        // not at the home page
        return;
    }

    let posts_end = posts.getElementsByClassName("posts-end")[0];

    if (posts_end.getAttribute("end")){
        return;
    }

    // still have chance to get more posts
    let url_endpoint = "user/feed?p=" + posts.childNodes.length;

    let init = {
        method: 'GET',
        headers: {
            'Authorization': 'token ' + sessionStorage.getItem("token"),
        }
    };

    api.makeAPIRequest(url_endpoint, init)
        .then((d) => {
            let data = d['posts'];

            for (let i = 0; i < data.length; i++){
                let post = document.createElement("div");
                createPostNode(post, data[i], parseInt(sessionStorage.getItem("token")));
                posts.insertBefore(post, posts_end)
            }

            if (data.length !== 10){
                posts_end_status_update(posts_end);
            }
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

    return;
}


export function posts_end_status_update(posts_end){
    posts_end.setAttribute("end", true);
    posts_end.textContent = "No more posts. Back to top.";

    posts_end.addEventListener("click", function(){
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        return;
    });
}
