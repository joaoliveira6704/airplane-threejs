# ✈️ Simulador de Voo em Three.js

Um simulador de voo interativo desenvolvido em JavaScript com Three.js, que oferece física realista, terreno procedural infinito e um sistema de objetivos.

Número de Aluno: 40240391
Nome: João Pedro Teixeira Oliveira

## 📋 Índice

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Controlos](#controlos)
- [Funcionalidades](#funcionalidades)
- [Estrutura do Código](#estrutura-do-código)
- [Recursos Necessários](#recursos-necessários)
- [Personalização](#personalização)

## 🎮 Características

- **Física de voo realista** com controlo de pitch, roll e yaw e fator de compensação do propeller
- **Terreno procedural infinito** gerado algoritmicamente
- **Sistema de câmara duplo**: terceira pessoa e cockpit
- **HUD completo** com horizonte artificial, altímetro e velocímetro
- **Sistema de objetivos** clicáveis no terreno
- **Efeitos de colisão** com partículas de fogo e fumo
- **Painel de configuração** para ajustar parâmetros do avião
- **Iluminação dinâmica** com sombras em tempo real
- **Skybox** ambiente para maior imersão

## 💻 Requisitos

- Navegador moderno com suporte a WebGL
- Five Server / Live Server

## 🚀 Instalação

1. Clonar o projeto

```bash
git clone https://github.com/joaoliveira6704/airplane-threejs.git
```

2. Certifique-se de que tem a seguinte estrutura de pastas:

```
projeto/
├── index.html
├── main.js
└── assets/
    ├── sh_ft.png
    ├── sh_bk.png
    ├── sh_up.png
    ├── sh_dn.png
    ├── sh_rt.png
    └── sh_lf.png
```

3. Iniciar um servidor local:

   Recomendação: Utilizar Live Server ou Five Server (Extensão VSCode)

4. Aceder a `http://localhost:8000` no navegador

## 🎯 Controlos

### Comandos de Voo

| Tecla | Ação                                               |
| ----- | -------------------------------------------------- |
| **Q** | Inclinar para a esquerda (roll)                    |
| **E** | Inclinar para a direita (roll)                     |
| **W** | Nariz para baixo (pitch down)                      |
| **S** | Nariz para cima (pitch up)                         |
| **A** | Leme para a esquerda (yaw)                         |
| **D** | Leme para a direita (yaw)                          |
| **C** | Alternar entre câmara de terceira pessoa e cockpit |

### Interação com o Mundo

- **Clique esquerdo no terreno**: Define um objetivo (anel verde)
- **Arrasto do rato** (modo terceira pessoa): Rodar câmara
- **Scroll** (modo terceira pessoa): Zoom in/out

## ✨ Funcionalidades

### Painel de Configuração (GUI)

Acessível no canto superior direito, permite ajustar:

**Montagem:**

- Posição Z das asas
- Envergadura das asas

**Voo:**

- Potência do motor (15-100%)
- Modo wireframe (para visualização técnica)

### HUD (Head-Up Display)

Localizado na parte inferior do ecrã, apresenta:

- **Horizonte artificial** com indicação de pitch e roll
- **Fita de rumo** (heading) com valores de 0-360°
- **Altímetro** em pés (relativo ao terreno)
- **Velocímetro** em nós (knots)
- **Contador de objetivos** concluídos

### Sistema de Colisão

Ao colidir com o terreno:

1. Explosão de partículas (fogo laranja e fumo cinzento)
2. Motor desliga automaticamente
3. Avião reseta após 2 segundos

### Terreno Procedural

- Sistema de chunks 3×3 que se movem dinamicamente
- Altura gerada por funções seno/cosseno
- Textura repetida do solo
- Renderização infinita sem limites de mapa

## 🏗️ Estrutura do Código

```javascript
// 1. CONFIGURAÇÃO GLOBAL
const config = { ... }  // Parâmetros ajustáveis

// 2. SETUP BÁSICO
scene, camera, renderer, controls, skybox, lighting

// 3. CONSTRUÇÃO DO AVIÃO
fuselagem, cockpit, asas, cauda, motor, superfícies de controlo

// 4. SISTEMA DE TERRENO INFINITO
createChunk(), updateChunkGeometry(), updateTerrain()

// 5. INTERFACE (GUI)
lil-gui para controlos em tempo real

// 6. LÓGICA DE CONTROLO
Listeners de teclado, variáveis de física

// 7. LÓGICA DE COLISÃO
checkCollision(), partículas, resetPlane()

// 8. SISTEMA DE OBJETIVOS
Raycasting, criação e verificação de objetivos

// 9. TELEMETRIA
updateTelemetry(), initHUD()

// 10. LOOP PRINCIPAL
animate() - atualização de física, câmara e renderização
```

## 📦 Recursos Necessários

### Texturas Skybox (pasta `/assets/`)

São necessárias 6 imagens PNG para formar o cubo do céu:

- `sh_ft.png` - Frente
- `sh_bk.png` - Trás
- `sh_up.png` - Cima
- `sh_dn.png` - Baixo (também usado no chão)
- `sh_rt.png` - Direita
- `sh_lf.png` - Esquerda

### Bibliotecas Three.js

- `three` - Biblioteca principal
- `OrbitControls` - Controlos de câmara
- `lil-gui` - Interface de configuração

## 🔧 Personalização

### Ajustar Física do Avião

```javascript
const config = {
  enginePower: 50, // Potência inicial (15-100)
  wingScale: 1.3365, // Tamanho das asas
  // ... outros parâmetros
};
```

### Modificar Terreno

```javascript
function getTerrainHeight(x, z) {
  // Alterar os valores para diferentes padrões
  let y = Math.sin(x / 150) * Math.cos(z / 150) * 30;
  return y - 40;
}
```

### Alterar Cores do Avião

```javascript
const matBody = new THREE.MeshStandardMaterial({
  color: 0xe74c3c, // Vermelho (alterar o valor hex)
  roughness: 0.4,
});
```

## 📝 Notas Técnicas

- **Sistema de coordenadas**: Y é vertical, Z é profundidade, X é lateral
- **Unidades**: Altitudes em "pés", velocidades em "nós" (escala aproximada)
- **Performance**: Otimizado com 9 chunks de terreno simultâneos
- **Sombras**: Ativadas apenas para objetos principais (avião e terreno)

## 🐛 Resolução de Problemas

**O avião não se move:**

- Verificar se a potência do motor não está a 0% (Recomendação: Manter limite mínimo de 15%)

**Texturas não carregam:**

- Confirmar que o servidor está ligado
- Verificar se as imagens estão na pasta `/assets/`

**FPS baixo:**

- Reduzir a resolução das sombras em `dirLight.shadow.mapSize`
- Diminuir `TERRAIN_SEGMENTS` para menos polígonos

## 📄 Licença

Projeto educacional - livre para uso e modificação.
