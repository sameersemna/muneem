# Route Mapping

You can define the route mapping in a separate yaml file (recommend) as they are easy to read, understand, and manage.

Please check [अनुमार्गक (anumargak)](https://github.com/NaturalIntelligence/anumargak) for more detail about uri syntax.

```yaml
- route: 
    uri: /this/is/the/uri
    when: ["POST", "PUT"] #default: GET
    to: serviceName
    after: [ authentication , cache-out ]
    then: [ cache-in , compress ]
    in: dev #environment
```

```JavaScript
const muneem = Muneem({
    mappings : "path/for/routes/mappings",
}).start();
```

You can also add routes from the code.

```JavaScript
const muneem = Muneem();
//Add request handlers
muneem.addHandler("paymentService", (asked, answer, giveMe) => {
    answer.write("I'm a fake service");
});
//Add route
muneem.route({
    uri: "/this/is/the/uri",
    when: ["POST", "PUT"], //default: GET
    to: "paymentService",
    after: [ "authentication" , "cache-out" ],
    then: [ "cache-in" , "compress" ],
    in: "dev" //environment
})
muneem.start();
```

serviceName, authentication , cache-out, cache-in , and compress in above mappings are the name of request handlers. They can be registered against some name and that name can be used as a reference in route mapping (see above examples) or directly;

```JavaScript
const muneem = Muneem();
var paymentService = (asked, answer, giveMe) => {
    answer.write("I'm a fake service");
}
muneem.route({
    uri: "/this/is/the/uri",
    when: ["POST", "PUT"], //default: GET
    to: paymentService,
    after: [ "authentication" , "cache-out" ],
    then: [ "cache-in" , "compress" ],
    in: "dev" //environment
})
muneem.start();
```

All the request handlers can be added in 2 ways: either by code as above or from some file

```JavaScript
Muneem({
    mappings : "path/for/routes/mappings",
    handlers : "path/for/handlers"
}).start();
```

Syntax of the handler file

```JavaScript
module.exports = {
    name : "main",
    handle : (asked,answer, giveMe) => {
        answer.write("from main");
    }
}
```

TODO: make name attribute optional, use fileName as handler name instead.