// physics_core.cpp
//
// Núcleo de cálculo em C++ puro. O mesmo arquivo serve para dois alvos:
//
//   1) Binário de linha de comando (g++ physics_core.cpp -o calc)
//   2) Módulo WebAssembly consumido pelo site (emcc physics_core.cpp -o physics.js)
//
// A lógica física fica isolada em funções simples, sem dependências de I/O,
// para que o mesmo código seja reutilizável nos dois contextos.

#include <cmath>
#include <iostream>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

extern "C" {

// Energia potencial gravitacional: E = m * g * h
double EMSCRIPTEN_KEEPALIVE potentialEnergy(double m, double g, double h) {
    return m * g * h;
}

// Energia cinética: E = (m * v^2) / 2
double EMSCRIPTEN_KEEPALIVE kineticEnergy(double m, double v) {
    return (m * std::pow(v, 2)) / 2.0;
}

// Energia potencial elástica (mola): E = (k * x^2) / 2
double EMSCRIPTEN_KEEPALIVE springEnergy(double k, double x) {
    return (k * std::pow(x, 2)) / 2.0;
}

} // extern "C"

// A main() só é compilada quando o alvo NÃO é WebAssembly, preservando
// a versão de terminal original do projeto.
#ifndef __EMSCRIPTEN__
int main() {
    double m, h, g, k, x, v, E;
    char formula;
    g = 9.8;
    k = 4e4;

    std::cout << "Formulas: A = mgh (potencial) | C = cinetica | M = mola\n";
    std::cin >> formula;

    switch (formula) {
        case 'A':
            std::cin >> m >> h;
            E = potentialEnergy(m, g, h);
            std::cout << "E = " << E << " J\n";
            break;
        case 'C':
            std::cin >> m >> v;
            E = kineticEnergy(m, v);
            std::cout << "E = " << E << " J\n";
            break;
        case 'M':
            std::cin >> x;
            E = springEnergy(k, x);
            std::cout << "E = " << E << " J\n";
            break;
        default:
            std::cout << "Formula invalida.\n";
            return 1;
    }
    return 0;
}
#endif
