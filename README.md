# retry-as-promised

Retry a failed promise

```js
var retry = require('retry-as-promised');

// Will call the until max retries or the promise is resolved.
return retry(function () {
  return promise;
}, 3);
```
