const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

export class HttpHelper {
    constructor() { }

    // Using callbacks:
    private handleRequest<Request, Response>(
        method: 'GET' | 'POST',
        url: string,
        content?: any,
        headers?: HttpHeader[],
        callback?: (response: Response) => void,
        errorCallback?: (err: any) => void
    ) {

        const request = new XMLHttpRequest();
        request.open(method, url, true);
        request.onload = function () {
            if (this.status >= 200 && this.status < 400) {
                // Success!
                const data = JSON.parse(this.response) as Response;
                callback && callback(data);
            } else {
                console.log(this.response);
                // We reached our target server, but it returned an error
                errorCallback && errorCallback(this.status);
            }
        };

        request.onerror = function (err: any) {
            // There was a connection error of some sort
            errorCallback && errorCallback(err);
        };

        if (method === 'POST') {
            request.setRequestHeader(
                'Content-Type',
                'application/x-www-form-urlencoded; charset=UTF-8');
                
            if(headers) {
                for(let h of headers) {
                    request.setRequestHeader(h.key, h.value);
                }
            }
        }

        
        request.send(content);
    }

    // Using promises:
    public submitRequest<Request, Response>(
        method: 'GET' | 'POST',
        url: string,
        content?: Request, 
        headers? : HttpHeader[]
    ): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            this.handleRequest(method, url, content, headers, resolve, reject);
        });
    }   
}

export interface HttpHeader {
    key: string;
    value: string;
}