EMCC ?= emcc
CXX  ?= g++

EXPORTED_FUNCS = "['_potentialEnergy','_kineticEnergy','_springEnergy']"

.PHONY: all wasm cli clean serve

all: wasm

# Compila o núcleo C++ para WebAssembly (usado pelo site em web/)
wasm: src/physics_core.cpp
	$(EMCC) src/physics_core.cpp -O2 \
		-s WASM=1 \
		-s EXPORTED_FUNCTIONS=$(EXPORTED_FUNCS) \
		-s EXPORTED_RUNTIME_METHODS="['cwrap']" \
		-s ENVIRONMENT=web \
		-o web/physics.js

# Compila a versão de terminal original (sem WebAssembly)
cli: src/physics_core.cpp
	$(CXX) -std=c++17 -O2 src/physics_core.cpp -o calc

# Sobe um servidor local pra testar o site (o WASM precisa de HTTP, não abre via file://)
serve:
	cd web && python3 -m http.server 8080

clean:
	rm -f web/physics.js web/physics.wasm calc
