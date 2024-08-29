
Adds circuit board connections, quick connections to ComfyUI

![Example](imgs/CircuitBoardExample.webp)
![Example](imgs/CreateSimple.gif)


* To install, go to [ComfyUI manager](https://github.com/ltdrdata/ComfyUI-Manager) -> look up "quick-connections"
* [Demo](https://niknah.github.io/quick-connections/quick_conn.html?nodebug=1)

## How to use...


* Don't block the output / input areas.
* Give it some room.  If the connections have no room to move, it'll get confused.
* There is no insert dot in the middle of the connection.  Drag the output to an empty spot, add a new node, and drag the output of the new node.  Sorry.
* Can be disabled in options under "Quick connections", "Circuit Board lines"


## Can be used with litegraph too.  See example folder.  
To run examples...
```
npm install
python -m http.server
# visit in browser: http://localhost:8000/example/quick_conn.html
```

