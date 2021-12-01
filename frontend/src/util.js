import * as modal from "./modal.js";
import {api} from "./main.js";


export function appendListChild(node, nodeList){
    if (! Array.isArray(nodeList)){
        console.log("wrong input");
        console.log(node);
        console.log(nodeList);
        return;
    }

    if (node == null){
        console.log("first parameter is null");
        return;
    }

    for (let i = 0; i < nodeList.length; i++){
        node.appendChild(nodeList[i]);
    }

    return;
}


export function removeAllChild(node){
    if (node != null){
        while (node.firstChild){
            node.removeChild(node.lastChild);
        }
    }

    return;
}


export function removeSelf(node){
    if (node == null){
        return;
    }

    node.parentNode.removeChild(node);
    return;
}


export function force_log_out(){
    let modal_dict = modal.createSimpleModal(
        "Authentication Error",
        "Sorry.. Something wrong with the authentication.. Please log in again..",
        "OK"
    );

    modal_dict['footer_close'].addEventListener("click", function(){
        localStorage.clear();
        sessionStorage.clear();
        removeSelf(modal_dict['modal']);
        window.location.reload();
        return;
    })

    return;
}


export function failed_to_fetch_before_login(){
    let modal_dict = modal.createSimpleModal(
        "Network Error",
        "Sorry. The network connection is broken. We are trying our best to recover. We cannot support registration or log in at this moment...",
        "OK"
    );

    modal_dict['footer_close'].addEventListener("click", function(){
        removeSelf(modal_dict['modal']);
        return;
    })

    return;
}


export function failed_to_fetch_after_login(){
    let modal_dict = modal.createSimpleModal(
        "Network Error",
        "Sorry. The network connection is broken. We are trying our best to recover. Meanwhile, you can still visit existing contents, but many features will not be available..",
        "OK"
    );

    modal_dict['footer_close'].addEventListener("click", function(){
        removeSelf(modal_dict['modal']);
        return;
    })

    return;
}



export function fetchMyInfo(){
    // refresh to get most updated following list, username, id
    let init = {
        method: 'GET',
        headers: {
            'Authorization': 'token ' + sessionStorage.getItem("token"),
            'Accept': 'application/json',
        },
    };

    api.makeAPIRequest("user", init)
        .then((data) => {
            // store my profile
            sessionStorage.setItem("username", data['username']);
            sessionStorage.setItem("id", data['id']);
            sessionStorage.setItem("following", JSON.stringify(data['following']));
        })
        .catch((error) => {
            if (error == 403){
                force_log_out();
            }
            else if (error == "Failed to fetch"){
                failed_to_fetch_before_login();
            }
            else{
                alert("error");
                console.log(error);
            }
        })
    ;    
}







