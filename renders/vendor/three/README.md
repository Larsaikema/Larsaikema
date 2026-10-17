three.js r186 (MIT, see LICENSE) — only the files the packshot pipeline imports:
build/three.module.js + build/three.core.js, addons/environments/RoomEnvironment.js,
addons/utils/BufferGeometryUtils.js. Addons import 'three' via the import map in scene.html.
