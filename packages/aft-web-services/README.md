# AFT-Web-Services
provides simplified HTTP REST request and response testing support

## Installation
`> npm i aft-web-services`

## Usage
the `aft-web-services` package supports all standard HTTP methods like `GET`, `POST`, `PUT`, `DELETE` and `UPDATE` by setting the `HttpRequest.method` field
### GET
```typescript
// perform GET request and return a response
let response: HttpResponse = await httpService.performRequest({url: 'https://reqres.in/api/users?page=2'});

// deserialise a JSON or XML response into an object
let respObj: ListUsersResponse = httpData.as<ListUsersResponse>(response);
```

### POST
```typescript
// perform POST request and return a response
let response: HttpResponse = await httpService.performRequest({
    url: 'https://reqres.in/api/users',
    method: 'POST',
    headers: {...HttpHeaders.ContentType.get(HttpHeaders.MimeType.applicationJson)},
    postData: JSON.stringify({name: 'morpheus', job: 'leader'})
});

// deserialise a JSON or XML response into an object
let respObj: CreateUserResponse = httpData.as<CreateUserResponse>(response);
```

## Advantages
- using this package can automatically log the request and response details using a `aft-core.LogManager` that can be passed in as part of the `HttpRequest` to maintain the same `logName` within a single test
- the `aft-web-services` classes rely on asynchronous promises meaning no worrying about callbacks
- built-in support for redirects (HTTP Status Code 302) and http or https requests
- XML and JSON response data can be easily deserialised to objects using the `httpData.as<T>(response: HttpResponse)` function

### NOTE:
XML to object deserialisation will use the following rules:
- element names become property names
- attributes become properties preceeded by an `@` symbol inside the element object
- element text content is rendered in a special property named `keyValue`

*Ex:*
```xml
<xml>
    <image src="./foo/bar/baz.jpg" />
    <hr />
    <span style="color:#808080">
        This is coloured
    </span>
</xml>
```
will become:
```json
{
    "xml": {
        "image": {
            "@src": "./foo/bar/baz.jpg",
        },
        "hr": {},
        "span": {
            "@style": "color:#808080",
            "keyValue": "This is coloured"
        }
    }
}
```