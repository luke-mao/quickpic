import * as util from './util.js';
import {api} from "./main.js";


// modal with a close button
// no event listener
export function createSimpleModal(title_text=null, body_text=null, close_text=null){
    let main = document.getElementsByTagName("main")[0];

    let modal = document.createElement('div');
    modal.classList.add("modal");

    let content = document.createElement('div');
    content.classList.add("modal-content");

    let header = document.createElement("div");
    header.classList.add("modal-header");

    let body = document.createElement("div");
    body.classList.add("modal-body");

    let footer = document.createElement("div");
    footer.classList.add("modal-footer");

    // link the main structure
    main.insertBefore(modal, main.firstChild);
    modal.appendChild(content);
    util.appendListChild(content, [
        header, body, footer
    ]);

    // inside the header, a title (no close button)
    let header_title = document.createElement("div");
    header_title.classList.add("header-title");
    header.appendChild(header_title);

    if (title_text !== null){
        header_title.textContent = title_text;
    }

    // inside content, a <p> tag for short message
    let body_p = document.createElement("p");
    body_p.classList.add("body-p");
    body.appendChild(body_p);

    if (body_text !== null){
        body_p.textContent = body_text;
    }

    // inside footer, a close button
    let footer_close = document.createElement("button");
    footer_close.type = "button";
    footer_close.classList.add("footer-btn-1");
    footer.appendChild(footer_close);

    if (close_text !== null){
        footer_close.textContent = close_text;
    }
    else{
        footer_close.textContent = "Close";
    }

    // return a list of contents
    // easier to edit
    return {
        'modal': modal,
        'header_title': header_title,
        'body': body,
        'body_p': body_p,
        'footer': footer,
        'footer_close': footer_close
    };
}


// modal with yes no two options
// better to re-assign the event listener
export function createYesNoModal(title_text=null, body_text=null, yes_text=null, no_text=null){
    let modal_dict = createSimpleModal(title_text, body_text, no_text);

    // add yes no button
    let footer = modal_dict['footer'];

    let footer_no = footer.firstChild;

    let footer_yes = document.createElement("button");
    footer_yes.type = "button";
    footer_yes.classList.add("footer-btn-1");
    footer.insertBefore(footer_yes, footer_no);

    modal_dict['footer_close'].classList.remove("footer-btn-1");
    modal_dict['footer_close'].classList.add("footer-btn-2");

    if (yes_text !== null){
        footer_yes.textContent = yes_text;
    }

    delete modal_dict['footer_close'];
    modal_dict['footer_yes'] = footer_yes;
    modal_dict['footer_no'] = footer_no;

    return modal_dict;
}

