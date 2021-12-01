/**
 * Make a request to `path` with `options` and parse the response as JSON.
 * @param {*} path The url to make the reques to.
 * @param {*} options Additiona options to pass to fetch.
 * 
 * Note that: usually fetch has 3 types of error to catch
 *  1. API error, we need to reject the promise and consider the various codes
 *  2. TypeError: usually occur for "Failed to fetch", when network is done
 *  3. Generic Error among the codes or other places
 * 
 * so that we can catch these errors separately
*/
const getJSON = (path, init) => 
    fetch(path, init)
        .then((response) => {
            if (! response.ok){
                return Promise.reject(response);
            }
    
            return response.json();
        })
        .catch((error) => {
            if (error.status){
                throw error.status;
            }
            else if (error.message == "Failed to fetch"){
                throw "Failed to fetch";
            }
            else{
                throw error;
            }
        })


/**
 * This is a sample class API which you may base your code on.
 * You may use this as a launch pad but do not have to.
 */
export default class API {
    /** @param {String} url */
    constructor(url) {
        this.url = url;
    } 

    /** @param {String} path */
    makeAPIRequest(path, init) {
        return getJSON(`${this.url}/${path}`, init);
    }
}
