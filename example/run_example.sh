

mkdir -p example/links
pushd example/links
ln -s ../../node_modules/@comfyorg/litegraph/dist/css/litegraph.css comfyui_litegraph.css
ln -s ../../node_modules/@comfyorg/litegraph/dist/litegraph.es.js comfyui_litegraph.js
ln -s ../../node_modules/litegraph.js/css/litegraph.css litegraph.css
ln -s ../../node_modules/litegraph.js/build/litegraph.js litegraph.js
popd
echo "Visit... http://localhost:8000/example/quick_conn.html"
python3 -m http.server

