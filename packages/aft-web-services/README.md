# AFT-Web-Services
provides simplified HTTP REST request and response testing support

## Usage
the `aft-web-services` package supports all standard HTTP methods like `GET`, `POST`, `PUT`, `DELETE` and `UPDATE` via the `HttpMethod` module
### GET
```typescript
// perform GET request and return a response
let response: HttpResponse = await HttpService.instance.performRequest({url: 'https://reqres.in/api/users?page=2'});

// deserialise a JSON or XML response into an object
let respObj: ListUsersResponse = response.dataAs<ListUsersResponse>();
```

### POST
```typescript
// perform POST request and return a response
let response: HttpResponse = await HttpService.instance.performRequest({
    url: 'https://reqres.in/api/users',
    method: HttpMethod.POST,
    headers: {'content-type':'application/json'},
    postData: JSON.stringify({name: 'morpheus', job: 'leader'})
});

// deserialise a JSON or XML response into an object
let respObj: CreateUserResponse = response.dataAs<CreateUserResponse>();
```

## Advantages
- using this package automatically logs the request and response details using the `aft-core.TestLog`
- the `aft-web-services` classes rely on asynchronous promises meaning no worrying about callbacks
- built-in support for redirects (HTTP Status Code 302) and http or https requests
- XML and JSON response data can be easily deserialised to objects using the `HttpResponse.dataAs` function

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