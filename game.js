// Variáveis globais
let scene, camera, renderer;
let player;
let terrain;
let trees = [];
let selectedHotbarSlot = 0;
let woodCount = 0;
let raycaster;
let isBreakingTree = false;
let breakingProgress = 0;
let selectedTree = null;
let raptor = null;
let isRidingRaptor = false;
let hasWon = false;
let currentTool = 'mãos';
let unlockedTools = ['mãos'];
let terrainSize = 200;
let hasTRex = false;
let tRex = null;
let hasRaptorFood = false;
let blue = null;
let indominus = null;
let blueAttacks = 0;
let gameTitle = 'Jurassic World 1';
let isRunning = false;
let canRun = true;
let lastDamageTime = 0;
let isGameOver = false;

// Novas variáveis para movimento suave
let moveDirection = new THREE.Vector3();
let currentSpeed = 0;
let targetSpeed = 0;
let bobPhase = 0;
let tiltAngle = 0;
let targetTiltAngle = 0;
let lastMoveTime = 0;
let isMoving = false;
let lastStaminaDrain = 0;

// Configurações
const PLAYER_SPEED = 5;
const RUN_SPEED = 8;
const STAMINA_DRAIN = 0.5;
const STAMINA_REGEN = 0.1;
const STAMINA_REGEN_DELAY = 1000; // 1 segundo de delay para regenerar
const PLAYER_HEIGHT = 2;
const INDOMINUS_SPEED = 3;
const INDOMINUS_DAMAGE = 20;
const DAMAGE_COOLDOWN = 1000; // 1 segundo entre danos
const INDOMINUS_HEALTH = 10;

// Configurações de animação
const BOB_AMPLITUDE = 0.1;
const BOB_FREQUENCY = 0.1;
const TILT_AMPLITUDE = 0.1;
const MOVEMENT_SMOOTHING = 0.1;
const SPEED_TRANSITION = 0.1;

function createTree(x, z) {
    const tree = new THREE.Group();

    // Tronco mais detalhado com textura de madeira
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, 8, 16);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5c3a21,  // Marrom mais natural
        roughness: 0.95,
        metalness: 0.05,
        bumpScale: 0.02,
        envMapIntensity: 0.3,
        side: THREE.DoubleSide
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Copa da árvore mais natural (5 níveis de folhas)
    const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2d5a27,
        transparent: true,
        opacity: 0.85,
        roughness: 0.9,
        metalness: 0.05,
        envMapIntensity: 0.2,
        side: THREE.DoubleSide
    });
    
    // Adiciona níveis de folhas com rotações aleatórias
    for (let i = 0; i < 5; i++) {
        const leafGeometry = new THREE.ConeGeometry(2.5 - i * 0.4, 2.5, 16);
        const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
        leaves.position.y = 4 + i * 1.5;
        leaves.rotation.y = Math.random() * Math.PI * 2;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        tree.add(leaves);
    }

    // Adiciona alguns galhos
    const branchMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4a2f1b,
        roughness: 0.95,
        metalness: 0.05,
        side: THREE.DoubleSide
    });
    for (let i = 0; i < 4; i++) {
        const branchGeometry = new THREE.CylinderGeometry(0.1, 0.2, 1.5, 8);
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        branch.position.y = 3 + i * 1.5;
        branch.rotation.z = Math.random() * Math.PI / 4;
        branch.rotation.y = Math.random() * Math.PI * 2;
        branch.castShadow = true;
        branch.receiveShadow = true;
        tree.add(branch);
    }

    tree.position.set(x, 4, z);
    tree.userData = {
        isTree: true,
        health: 100,
        isBreaking: false
    };
    scene.add(tree);
    trees.push(tree);
    return tree;
}

function createTerrain() {
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 200, 200);
    
    // Gera um terreno mais suave usando ruído Perlin
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i] / terrainSize * 5;
        const z = vertices[i + 2] / terrainSize * 5;
        vertices[i + 1] = Math.sin(x) * Math.cos(z) * 0.5;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    // Carregar texturas para o terreno
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big.jpg');
    const grassNormalMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-normal.jpg');
    const grassRoughnessMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-rough.jpg');
    const grassDetailTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grassdetail.jpg');
    const dirtTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/dirt.jpg');
    const rockTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/rock.jpg');
    
    // Configurar repetição das texturas
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(100, 100);
    
    grassNormalMap.wrapS = THREE.RepeatWrapping;
    grassNormalMap.wrapT = THREE.RepeatWrapping;
    grassNormalMap.repeat.set(100, 100);
    
    grassRoughnessMap.wrapS = THREE.RepeatWrapping;
    grassRoughnessMap.wrapT = THREE.RepeatWrapping;
    grassRoughnessMap.repeat.set(100, 100);
    
    grassDetailTexture.wrapS = THREE.RepeatWrapping;
    grassDetailTexture.wrapT = THREE.RepeatWrapping;
    grassDetailTexture.repeat.set(200, 200);
    
    dirtTexture.wrapS = THREE.RepeatWrapping;
    dirtTexture.wrapT = THREE.RepeatWrapping;
    dirtTexture.repeat.set(100, 100);
    
    rockTexture.wrapS = THREE.RepeatWrapping;
    rockTexture.wrapT = THREE.RepeatWrapping;
    rockTexture.repeat.set(100, 100);

    // Material mais realista para o terreno com múltiplas texturas
    const material = new THREE.MeshStandardMaterial({ 
        map: grassTexture,
        normalMap: grassNormalMap,
        roughnessMap: grassRoughnessMap,
        roughness: 0.8,
        metalness: 0.1,
        flatShading: false,
        envMapIntensity: 0.5,
        side: THREE.DoubleSide,
        color: 0x3b7a3b, // Cor verde mais vibrante
        emissive: 0x1a3d1a, // Brilho verde suave
        emissiveIntensity: 0.2
    });
    
    // Adicionar detalhes de grama
    const grassDetailMaterial = new THREE.MeshStandardMaterial({
        map: grassDetailTexture,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        color: 0x4a8f4a // Cor verde mais clara para os detalhes
    });
    
    const grassDetailGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 200, 200);
    const grassDetail = new THREE.Mesh(grassDetailGeometry, grassDetailMaterial);
    grassDetail.rotation.x = -Math.PI / 2;
    grassDetail.position.y = 0.01; // Levemente acima do terreno principal
    
    terrain = new THREE.Group();
    const baseTerrain = new THREE.Mesh(geometry, material);
    baseTerrain.rotation.x = -Math.PI / 2;
    baseTerrain.receiveShadow = true;
    
    terrain.add(baseTerrain);
    terrain.add(grassDetail);
    scene.add(terrain);

    // Adicionar árvores apenas em locais apropriados
    const numTrees = Math.floor((terrainSize / 200) * 50);
    for (let i = 0; i < numTrees; i++) {
        const x = Math.random() * (terrainSize - 20) - (terrainSize/2 - 10);
        const z = Math.random() * (terrainSize - 20) - (terrainSize/2 - 10);
        
        const xRatio = (x + terrainSize/2) / terrainSize * 5;
        const zRatio = (z + terrainSize/2) / terrainSize * 5;
        const height = Math.abs(Math.sin(xRatio) * Math.cos(zRatio) * 0.5);
        
        if (height < 0.3) {
            createTree(x, z);
        }
    }
}

function createUI() {
    // Remover UI antiga
    const oldUI = document.getElementById('ui');
    if (oldUI) oldUI.remove();

    // Remover hotbar antiga
    const oldHotbar = document.getElementById('hotbar');
    if (oldHotbar) oldHotbar.remove();

    // Remover inventário antigo
    const oldInventory = document.getElementById('inventory');
    if (oldInventory) oldInventory.remove();

    // Adicionar estilos CSS globais
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        .hotbar-slot {
            position: relative;
            cursor: pointer;
            pointer-events: auto;
        }

        .hotbar-slot:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .hotbar-slot.selected {
            border-color: #ffd700;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            animation: pulse 1s infinite;
        }

        .hotbar-slot.locked {
            opacity: 0.5;
            cursor: not-allowed;
        }

        #health-bar, #stamina-bar, #hunger-bar, #thirst-bar {
            transition: width 0.3s ease;
        }

        #health-bar.low {
            background: #ff0000;
        }

        #stamina-bar.low {
            background: #ff6600;
        }

        #hunger-bar.low {
            background: #ffcc00;
        }

        #thirst-bar.low {
            background: #00ccff;
        }

        .status-icon {
            font-size: 20px;
            margin-right: 10px;
        }

        .status-value {
            position: absolute;
            right: 10px;
            color: white;
            font-size: 12px;
        }

        #inventory {
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5));
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        }

        #inventory-title {
            color: #ffd700;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 15px;
            text-align: center;
        }

        .game-title {
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
            text-transform: uppercase;
            letter-spacing: 3px;
        }

        .crosshair {
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
    `;
    document.head.appendChild(style);

    // Criar novo container UI
    const ui = document.createElement('div');
    ui.id = 'ui';
    ui.style.cssText = `
        position: fixed;
        width: 100%;
        height: 100%;
        pointer-events: none;
        font-family: 'Arial', sans-serif;
        z-index: 1000;
    `;
    document.body.appendChild(ui);

    // HUD Central (Crosshair)
    const crosshair = document.createElement('div');
    crosshair.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        pointer-events: none;
    `;
    ui.appendChild(crosshair);

    // Barras de Status (Estilo ARK)
    const statusContainer = document.createElement('div');
    statusContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    `;

    // Criar barras de status
    const statusBars = [
        { id: 'health', color: '#ff3333', icon: '❤️' },
        { id: 'stamina', color: '#33ff33', icon: '⚡' }
    ];

    statusBars.forEach(bar => {
        const barContainer = document.createElement('div');
        barContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(0, 0, 0, 0.5);
            padding: 5px 10px;
            border-radius: 5px;
            width: 200px;
        `;

        const icon = document.createElement('span');
        icon.textContent = bar.icon;
        icon.style.fontSize = '20px';

        const barWrapper = document.createElement('div');
        barWrapper.style.cssText = `
            flex: 1;
            height: 20px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
            overflow: hidden;
        `;

        const barFill = document.createElement('div');
        barFill.id = `${bar.id}-bar`;
        barFill.style.cssText = `
            width: 100%;
            height: 100%;
            background: ${bar.color};
            transition: width 0.3s ease;
        `;

        barWrapper.appendChild(barFill);
        barContainer.appendChild(icon);
        barContainer.appendChild(barWrapper);
        statusContainer.appendChild(barContainer);
    });

    ui.appendChild(statusContainer);

    // Hotbar (Estilo ARK)
    const hotbar = document.createElement('div');
    hotbar.id = 'hotbar';
    hotbar.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 5px;
        background: rgba(0, 0, 0, 0.5);
        padding: 10px;
        border-radius: 10px;
        pointer-events: none;
    `;

    const tools = ['mãos', 'machado', 'machado_melhorado', 'raptor', 'trex'];
    tools.forEach((tool, index) => {
        const slot = document.createElement('div');
        slot.className = 'hotbar-slot';
        slot.style.cssText = `
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${unlockedTools.includes(tool) ? 'white' : '#666'};
            font-size: 12px;
            text-align: center;
            transition: all 0.2s ease;
        `;
        slot.textContent = tool;
        hotbar.appendChild(slot);
    });

    ui.appendChild(hotbar);

    // Inventário (Estilo ARK)
    const inventory = document.createElement('div');
    inventory.id = 'inventory';
    inventory.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.5);
        padding: 15px;
        border-radius: 10px;
        color: white;
        font-size: 14px;
        line-height: 1.5;
        pointer-events: none;
    `;
    inventory.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold;">Inventário</div>
        Madeira: <span id="wood-count">${woodCount}</span><br>
        Ferramenta: ${currentTool}
        ${isRidingRaptor ? '<br>Montado no Raptor!' : ''}
    `;
    ui.appendChild(inventory);

    // Título do Jogo
    const title = document.createElement('div');
    title.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 24px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        background: rgba(0, 0, 0, 0.5);
        padding: 10px 20px;
        border-radius: 5px;
        pointer-events: none;
    `;
    title.textContent = gameTitle;
    ui.appendChild(title);
}

function updateUI() {
    // Atualizar barras de status
    const healthBar = document.getElementById('health-bar');
    const staminaBar = document.getElementById('stamina-bar');

    if (healthBar && staminaBar) {
        // Atualizar larguras
        healthBar.style.width = player.userData.health + '%';
        staminaBar.style.width = player.userData.stamina + '%';

        // Adicionar classes para status baixo
        healthBar.className = player.userData.health < 30 ? 'low' : '';
        staminaBar.className = player.userData.stamina < 30 ? 'low' : '';

        // Atualizar valores numéricos
        document.querySelectorAll('.status-value').forEach(el => {
            const type = el.getAttribute('data-type');
            let value = 0;
            switch(type) {
                case 'health':
                    value = Math.round(player.userData.health);
                    break;
                case 'stamina':
                    value = Math.round(player.userData.stamina);
                    break;
            }
            el.textContent = value + '%';
        });

        // Atualizar cor da barra de stamina baseado no status
        if (!canRun) {
            staminaBar.style.backgroundColor = '#666666';
        } else if (isRunning) {
            staminaBar.style.backgroundColor = '#ff6600';
        } else {
            staminaBar.style.backgroundColor = '#33ff33';
        }
    }

    // Atualizar inventário
    const inventory = document.getElementById('inventory');
    if (inventory) {
        inventory.innerHTML = `
            <div id="inventory-title">Inventário</div>
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="margin-right: 10px;">🪵</span>
                Madeira: <span id="wood-count" style="color: #ffd700; margin-left: 5px;">${woodCount}</span>
            </div>
            <div style="display: flex; align-items: center;">
                <span style="margin-right: 10px;">🛠️</span>
                Ferramenta: <span style="color: #ffd700; margin-left: 5px;">${currentTool}</span>
            </div>
            ${isRidingRaptor ? '<div style="color: #33ff33; margin-top: 10px;">🦖 Montado no Raptor!</div>' : ''}
            ${!canRun ? '<div style="color: #ff6600; margin-top: 10px;">⚡ Aguarde a stamina recuperar para correr!</div>' : ''}
            ${isRunning ? '<div style="color: #ff6600; margin-top: 10px;">🏃 Correndo!</div>' : ''}
            ${indominus ? `<div style="color: #ff0000; margin-top: 10px;">🦖 Indominus Rex: ${blueAttacks}/${INDOMINUS_HEALTH} ataques!</div>` : ''}
        `;
    }

    // Atualizar hotbar
    document.querySelectorAll('.hotbar-slot').forEach((slot, index) => {
        const tool = ['mãos', 'machado', 'machado_melhorado', 'raptor', 'trex'][index];
        slot.className = 'hotbar-slot';
        if (index === selectedHotbarSlot) {
            slot.classList.add('selected');
        }
        if (!unlockedTools.includes(tool)) {
            slot.classList.add('locked');
        }
    });
}

function createPlayer() {
    player = new THREE.Group();

    // Corpo simples (apenas um cubo)
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        new THREE.MeshPhongMaterial({ color: 0x2b4b8c })
    );
    body.position.y = PLAYER_HEIGHT - 1;
    body.castShadow = true;
    player.add(body);

    // Posicionar o jogador
    player.position.y = PLAYER_HEIGHT * 1.7;
    scene.add(player);

    // Ajustar câmera para primeira pessoa
    camera.position.set(0, PLAYER_HEIGHT * 1.7, 0);
    player.add(camera);

    // Status do jogador
    player.userData = {
        health: 100,
        stamina: 100,
        food: 100,
        water: 100,
        rotationY: 0,
        rotationX: 0
    };

    updateUI();
}

function init() {
    try {
        console.log('Iniciando jogo...');
        
        // Cena básica
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

        // Raycaster para detecção de clique
        raycaster = new THREE.Raycaster();

        // Câmera em primeira pessoa
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        // Renderer com configurações avançadas
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
    document.body.appendChild(renderer.domElement);

        // Sistema de iluminação melhorado
        // Sol (luz principal)
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        sunLight.shadow.bias = -0.0001;
        scene.add(sunLight);

        // Luz ambiente suave
        const ambientLight = new THREE.AmbientLight(0x404040, 0.7);
    scene.add(ambientLight);

        // Luz de preenchimento para sombras mais suaves
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-50, 50, -50);
        scene.add(fillLight);

        // Luz de céu para melhorar a iluminação geral
        const skyLight = new THREE.HemisphereLight(0x87CEEB, 0x3b7a3b, 0.3);
        skyLight.position.set(0, 100, 0);
        scene.add(skyLight);

        // Criar terreno
        createTerrain();

        // Criar jogador
        createPlayer();

        // Criar Raptor
        raptor = createRaptor();

        // Criar T-Rex
        tRex = createTRex();

        // Eventos
    window.addEventListener('resize', onWindowResize, false);
        setupControls();

        // Travar o mouse
        renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock || renderer.domElement.mozRequestPointerLock;
        renderer.domElement.onclick = function() {
            renderer.domElement.requestPointerLock();
        };

        // Criar nova UI
        createUI();

        // Iniciar animação
        animate();
        
        return true;
    } catch (error) {
        console.error('Erro ao iniciar:', error);
        return false;
    }
}

function createRaptor() {
    const raptorGroup = new THREE.Group();

    // Corpo do Raptor mais detalhado
    const bodyGeometry = new THREE.BoxGeometry(2, 2.5, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2F4F2F,
        roughness: 0.8,
        metalness: 0.2,
        envMapIntensity: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    raptorGroup.add(body);

    // Pescoço
    const neckGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 8);
    const neck = new THREE.Mesh(neckGeometry, bodyMaterial);
    neck.position.set(0, 1.5, 1.5);
    neck.rotation.x = Math.PI / 4;
    neck.castShadow = true;
    raptorGroup.add(neck);

    // Cabeça mais detalhada
    const headGeometry = new THREE.BoxGeometry(0.8, 1, 2);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 2.5, 2.5);
    head.castShadow = true;
    raptorGroup.add(head);

    // Mandíbula
    const jawGeometry = new THREE.BoxGeometry(0.7, 0.4, 1.5);
    const jaw = new THREE.Mesh(jawGeometry, bodyMaterial);
    jaw.position.set(0, 2.2, 2.8);
    jaw.castShadow = true;
    raptorGroup.add(jaw);

    // Cauda
    const tailGeometry = new THREE.CylinderGeometry(0.3, 0.1, 4, 8);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.5, -2.5);
    tail.rotation.x = -Math.PI / 6;
    tail.castShadow = true;
    raptorGroup.add(tail);

    // Pernas mais detalhadas
    const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2F4F2F,
        roughness: 0.8,
        metalness: 0.2
    });
    const upperLegGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const lowerLegGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    const footGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.8);

    const legs = [];
    const legPositions = [
        [-0.7, -1, -1],
        [0.7, -1, -1],
        [-0.7, -1, 1],
        [0.7, -1, 1]
    ];

    legPositions.forEach(pos => {
        const legGroup = new THREE.Group();
        
        const upperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
        const lowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
        const foot = new THREE.Mesh(footGeometry, legMaterial);
        
        upperLeg.position.y = 0.75;
        lowerLeg.position.y = -0.75;
        foot.position.y = -1.5;
        foot.position.z = 0.2;
        
        legGroup.add(upperLeg);
        legGroup.add(lowerLeg);
        legGroup.add(foot);
        
        legGroup.position.set(...pos);
        legGroup.castShadow = true;
        
        raptorGroup.add(legGroup);
        legs.push(legGroup);
    });

    raptorGroup.position.set(10, PLAYER_HEIGHT * 1.7, 10);
    raptorGroup.userData = {
        isRaptor: true,
        legs: legs
    };

    scene.add(raptorGroup);
    return raptorGroup;
}

function createTRex() {
    const tRexGroup = new THREE.Group();

    // Corpo do T-Rex mais detalhado
    const bodyGeometry = new THREE.BoxGeometry(5, 6, 10);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B0000,
        roughness: 0.8,
        metalness: 0.2,
        envMapIntensity: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    tRexGroup.add(body);

    // Pescoço grosso
    const neckGeometry = new THREE.CylinderGeometry(1, 1.5, 3, 8);
    const neck = new THREE.Mesh(neckGeometry, bodyMaterial);
    neck.position.set(0, 2, 4);
    neck.rotation.x = Math.PI / 6;
    neck.castShadow = true;
    tRexGroup.add(neck);

    // Cabeça grande e detalhada
    const headGeometry = new THREE.BoxGeometry(2, 3, 4);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 4, 6);
    head.castShadow = true;
    tRexGroup.add(head);

    // Mandíbula poderosa
    const jawGeometry = new THREE.BoxGeometry(1.8, 1, 3.5);
    const jaw = new THREE.Mesh(jawGeometry, bodyMaterial);
    jaw.position.set(0, 3, 6.5);
    jaw.castShadow = true;
    tRexGroup.add(jaw);

    // Cauda robusta
    const tailGeometry = new THREE.CylinderGeometry(1, 0.3, 8, 8);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 1, -5);
    tail.rotation.x = -Math.PI / 8;
    tail.castShadow = true;
    tRexGroup.add(tail);

    // Pernas poderosas
    const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B0000,
        roughness: 0.8,
        metalness: 0.2
    });
    const upperLegGeometry = new THREE.BoxGeometry(1.2, 3, 1.2);
    const lowerLegGeometry = new THREE.BoxGeometry(1, 3, 1);
    const footGeometry = new THREE.BoxGeometry(1.5, 1, 2);

    const legs = [];
    const legPositions = [
        [-2, -2, -2],
        [2, -2, -2],
        [-2, -2, 2],
        [2, -2, 2]
    ];

    legPositions.forEach(pos => {
        const legGroup = new THREE.Group();
        
        const upperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
        const lowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
        const foot = new THREE.Mesh(footGeometry, legMaterial);
        
        upperLeg.position.y = 1.5;
        lowerLeg.position.y = -1.5;
        foot.position.y = -3;
        foot.position.z = 0.5;
        
        legGroup.add(upperLeg);
        legGroup.add(lowerLeg);
        legGroup.add(foot);
        
        legGroup.position.set(...pos);
        legGroup.castShadow = true;
        
        tRexGroup.add(legGroup);
        legs.push(legGroup);
    });

    tRexGroup.position.set(20, PLAYER_HEIGHT * 2, 20);
    tRexGroup.userData = {
        isTRex: true,
        legs: legs
    };

    scene.add(tRexGroup);
    return tRexGroup;
}

function setupControls() {
    // Mouse movement
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            player.userData.rotationY -= e.movementX * 0.002;
            player.userData.rotationX -= e.movementY * 0.002;
            
            // Limitar rotação vertical
            player.userData.rotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, player.userData.rotationX));
            
            // Aplicar rotações
            player.rotation.y = player.userData.rotationY;
            camera.rotation.x = player.userData.rotationX;
        }
    });

    // Teclas numéricas para hotbar
    document.addEventListener('keydown', (e) => {
        if (e.code.startsWith('Digit')) {
            const num = parseInt(e.code.replace('Digit', '')) - 1;
            if (num >= 0 && num < 5) {
                updateHotbarSelection(num);
            }
        }
    });

    // Tecla E para montar/desmontar
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyE') {
            if (currentTool === 'raptor' && !isRidingRaptor) {
                const distance = player.position.distanceTo(raptor.position);
                if (distance < 5) {
                    mountRaptor();
                }
            } else if (currentTool === 'trex' && !isRidingRaptor && hasTRex) {
                const distance = player.position.distanceTo(tRex.position);
                if (distance < 5) {
                    mountTRex();
                }
            } else if (isRidingRaptor) {
                if (currentTool === 'raptor') {
                    dismountRaptor();
                } else if (currentTool === 'trex') {
                    dismountTRex();
                }
                updateHotbarSelection(0);
            }
        }
    });

    // Tecla Shift para correr
    document.addEventListener('keydown', (e) => {
        if (e.code === 'ShiftLeft' && !isRidingRaptor && canRun) {
            isRunning = true;
            targetSpeed = RUN_SPEED;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'ShiftLeft') {
            isRunning = false;
            targetSpeed = PLAYER_SPEED;
        }
    });

    // Movimento WASD
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'KeyW':
                moveDirection.z = -1;
                isMoving = true;
                break;
            case 'KeyS':
                moveDirection.z = 1;
                isMoving = true;
                break;
            case 'KeyA':
                moveDirection.x = -1;
                isMoving = true;
                break;
            case 'KeyD':
                moveDirection.x = 1;
                isMoving = true;
                break;
            case 'Space':
                if (!isRidingRaptor && player.position.y <= PLAYER_HEIGHT * 1.7) {
                    player.position.y += 2;
                } else if (isRidingRaptor) {
                    const mount = currentTool === 'raptor' ? raptor : tRex;
                    if (mount.position.y <= PLAYER_HEIGHT * 1.7) {
                        mount.position.y += 3;
                    }
                }
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.code) {
            case 'KeyW':
            case 'KeyS':
                moveDirection.z = 0;
                break;
            case 'KeyA':
            case 'KeyD':
                moveDirection.x = 0;
                break;
        }
        if (moveDirection.x === 0 && moveDirection.z === 0) {
            isMoving = false;
            targetSpeed = 0;
        }
    });

    // Mouse click para quebrar árvores
    document.addEventListener('mousedown', (e) => {
        if (e.button === 0 && document.pointerLockElement === renderer.domElement) {
            isBreakingTree = true;
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            isBreakingTree = false;
            breakingProgress = 0;
            if (selectedTree) {
                selectedTree.children[0].material.color.setHex(0x5c3a21);
            }
        }
    });
}

function updateHotbarSelection(slot) {
    const tools = ['mãos', 'machado', 'machado_melhorado', 'raptor', 'trex'];
    const selectedTool = tools[slot];
    
    if (!unlockedTools.includes(selectedTool)) {
        return;
    }

    selectedHotbarSlot = slot;
    currentTool = selectedTool;
    
    if (isRidingRaptor && currentTool !== 'raptor') {
        dismountRaptor();
    }
    
    createUI();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function resetTrees() {
    // Remover árvores existentes
    trees.forEach(tree => scene.remove(tree));
    trees = [];

    // Remover terreno antigo
    scene.remove(terrain);

    // Criar novo terreno com tamanho atualizado
    createTerrain();

    // Atualizar câmera para ver o terreno maior
    camera.far = terrainSize * 2;
    camera.updateProjectionMatrix();
}

function checkToolUpgrade() {
    if (woodCount >= 70 && !unlockedTools.includes('raptor')) {
        unlockedTools.push('raptor');
        createUI(); // Recriar UI para atualizar hotbar
        alert('Parabéns! Você desbloqueou o Raptor! Selecione-o na hotbar.');
        resetTrees();
    } else if (woodCount >= 30 && !unlockedTools.includes('machado_melhorado')) {
        unlockedTools.push('machado_melhorado');
        createUI(); // Recriar UI para atualizar hotbar
        alert('Machado Melhorado desbloqueado! Selecione-o na hotbar.');
        resetTrees();
    } else if (woodCount >= 10 && !unlockedTools.includes('machado')) {
        unlockedTools.push('machado');
        createUI(); // Recriar UI para atualizar hotbar
        alert('Machado desbloqueado! Selecione-o na hotbar.');
        resetTrees();
    }
}

function getBreakingSpeed() {
    switch(currentTool) {
        case 'trex':
            return 100; // Ainda é muito forte, mas mais realista que quebrar instantaneamente
        case 'raptor':
            return 40;  // Mais forte que o machado melhorado, mas não absurdamente
        case 'machado_melhorado':
            return 25;  // 2.5x mais eficiente que o machado normal
        case 'machado':
            return 10;  // Mantido como base de comparação
        default:
            return 2;   // Mãos um pouco mais eficientes para não ser muito frustrante
    }
}

function checkTreeHit() {
    if (!isBreakingTree) return;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(trees, true);
    
    if (intersects.length > 0) {
        const hitObject = intersects[0].object.parent;
        if (hitObject.userData.isTree && intersects[0].distance < 5) {
            selectedTree = hitObject;
            
            if (!hitObject.userData.isBreaking) {
                breakingProgress += getBreakingSpeed();
            }
            
            const trunk = hitObject.children[0];
            trunk.material.color.setHex(0x8B4513);
            
            const time = Date.now() * 0.001;
            hitObject.rotation.y = Math.sin(time * 10) * 0.1;
            
            if (breakingProgress >= 100 && !hitObject.userData.isBreaking) {
                hitObject.userData.isBreaking = true;

                const fallDuration = 1000;
                const startTime = Date.now();
                const startPosition = hitObject.position.clone();
                
                const fallAnimation = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / fallDuration, 1);
                    
                    hitObject.position.y = startPosition.y - (progress * 10);
                    hitObject.rotation.x = progress * Math.PI / 2;
                    
                    if (progress < 1) {
                        requestAnimationFrame(fallAnimation);
                    } else {
                        let woodGained = 1;
                        switch(currentTool) {
                            case 'trex':
                                woodGained = 5;
                                // Aumentar a chance de encontrar ração para 20%
                                if (Math.random() < 0.50 && !hasRaptorFood) {
                                    hasRaptorFood = true;
                                    alert('Você encontrou uma ração para raptors!');
                                }
                                break;
                            case 'raptor':
                                woodGained = 5;
                                break;
                            case 'machado_melhorado':
                                woodGained = 3;
                                break;
                            case 'machado':
                                woodGained = 2;
                                break;
                            default:
                                woodGained = 1;
                        }
                        
                        woodCount += woodGained;
                        createUI(); // Atualizar UI com novo valor de madeira
                        
                        const index = trees.indexOf(hitObject);
                        if (index > -1) {
                            trees.splice(index, 1);
                        }
                        scene.remove(hitObject);
                        
                        if (currentTool === 'trex') {
                            destroyNearbyTrees(hitObject.position, true);
                        }
                        
                        checkToolUpgrade();
                        checkVictory();
                    }
                };
                
                fallAnimation();
            }
        }
    } else {
        if (selectedTree) {
            selectedTree.children[0].material.color.setHex(0x5c3a21);
            selectedTree.rotation.y = 0;
        }
        selectedTree = null;
        breakingProgress = 0;
    }
}

function mountRaptor() {
    isRidingRaptor = true;
    player.position.copy(raptor.position);
    player.position.y += 1;
    camera.position.y += 0.5;
    createUI(); // Atualizar UI ao montar
}

function dismountRaptor() {
    isRidingRaptor = false;
    player.position.set(raptor.position.x, PLAYER_HEIGHT * 1.7, raptor.position.z + 2);
    camera.position.y -= 0.5;
    createUI(); // Atualizar UI ao desmontar
}

function mountTRex() {
    isRidingRaptor = true; // Usamos a mesma variável para simplificar
    player.position.copy(tRex.position);
    player.position.y += 2; // Mais alto que o Raptor
    camera.position.y += 1;
    createUI(); // Atualizar UI ao montar
}

function dismountTRex() {
    isRidingRaptor = false;
    player.position.set(tRex.position.x, PLAYER_HEIGHT * 1.7, tRex.position.z + 3);
    camera.position.y -= 1;
    createUI(); // Atualizar UI ao desmontar
}

function updateMovement() {
    if (isRidingRaptor) {
        const mount = currentTool === 'raptor' ? raptor : tRex;
        moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), mount.rotation.y);
        mount.position.x += moveDirection.x * currentSpeed;
        mount.position.z += moveDirection.z * currentSpeed;
        player.position.copy(mount.position);
        player.position.y += 1;
    } else {
        // Atualizar velocidade atual com interpolação suave
        currentSpeed += (targetSpeed - currentSpeed) * SPEED_TRANSITION;

        // Aplicar movimento com direção atual
        moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
        player.position.x += moveDirection.x * currentSpeed;
        player.position.z += moveDirection.z * currentSpeed;

        // Atualizar animação de bob (movimento para cima e para baixo)
        if (isMoving) {
            bobPhase += BOB_FREQUENCY;
            const bobOffset = Math.sin(bobPhase) * BOB_AMPLITUDE;
            player.position.y = PLAYER_HEIGHT * 1.7 + bobOffset;

            // Atualizar inclinação ao virar
            targetTiltAngle = moveDirection.x * TILT_AMPLITUDE;
            tiltAngle += (targetTiltAngle - tiltAngle) * MOVEMENT_SMOOTHING;
            player.rotation.z = tiltAngle;
        } else {
            // Resetar posição e rotação quando parado
            player.position.y = PLAYER_HEIGHT * 1.7;
            player.rotation.z = 0;
            tiltAngle = 0;
            targetTiltAngle = 0;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Atualizar movimento
    updateMovement();

    // Animar pernas do Raptor/T-Rex se estiver montado e em movimento
    if (isRidingRaptor) {
        const time = Date.now() * 0.001;
        const mount = currentTool === 'raptor' ? raptor : tRex;
        if (mount && mount.userData.legs) {
            mount.userData.legs.forEach((leg, i) => {
                leg.position.y = -2 + Math.sin(time * 10 + i * Math.PI/2) * 0.2;
            });
        }
    }

    // Sistema de perseguição e dano do Indominus
    if (indominus && !isGameOver) {
        const currentTime = Date.now();
        const distanceToPlayer = player.position.distanceTo(indominus.position);
        
        // Perseguir o jogador
        if (distanceToPlayer > 5) {
            const direction = new THREE.Vector3();
            direction.subVectors(player.position, indominus.position).normalize();
            indominus.position.x += direction.x * INDOMINUS_SPEED;
            indominus.position.z += direction.z * INDOMINUS_SPEED;
            
            // Rotacionar o Indominus para olhar para o jogador
            indominus.rotation.y = Math.atan2(direction.x, direction.z);
        }
        
        // Causar dano ao jogador
        if (distanceToPlayer < 5 && currentTime - lastDamageTime > DAMAGE_COOLDOWN) {
            player.userData.health = Math.max(0, player.userData.health - INDOMINUS_DAMAGE);
            lastDamageTime = currentTime;
            
            // Efeito visual de dano
            document.body.style.backgroundColor = '#ff0000';
            setTimeout(() => {
                document.body.style.backgroundColor = 'black';
            }, 100);
            
            // Verificar morte do jogador
            if (player.userData.health <= 0) {
                gameOver();
            }
        }
    }

    // Verificar quebra de árvores
    checkTreeHit();

    // Verificar limites do mapa
    checkBoundaries();

    // Sistema de stamina para corrida
    const currentTime = Date.now();
    if (isRunning && !isRidingRaptor) {
        if (player.userData.stamina > 0) {
            player.userData.stamina = Math.max(0, player.userData.stamina - STAMINA_DRAIN);
            lastStaminaDrain = currentTime;
        } else {
            isRunning = false;
            canRun = false;
            targetSpeed = PLAYER_SPEED;
        }
    } else if (!isRunning && currentTime - lastStaminaDrain > STAMINA_REGEN_DELAY) {
        player.userData.stamina = Math.min(100, player.userData.stamina + STAMINA_REGEN);
        if (player.userData.stamina >= 20) {
            canRun = true;
        }
    }

    updateUI();
    renderer.render(scene, camera);
}

function createBlue() {
    const blueGroup = new THREE.Group();
    const textureLoader = new THREE.TextureLoader();
    
    // Texturas mais realistas para a Blue
    const blueSkinTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/patterns/dragon_scales.jpg');
    const blueNormalMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/water/Water_2_M_Normal.jpg');
    const blueRoughnessMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/leather/leather_black_rough.jpg');
    
    const bodyMaterial = new THREE.MeshPhysicalMaterial({ 
        color: 0x1E90FF,
        map: blueSkinTexture,
        normalMap: blueNormalMap,
        roughnessMap: blueRoughnessMap,
        roughness: 0.7,
        metalness: 0.3,
        envMapIntensity: 1.2,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
        bumpScale: 0.05
    });

    // Corpo principal com segmentos curvos
    const segments = 7;
    for (let i = 0; i < segments; i++) {
        const segmentGeometry = new THREE.BoxGeometry(2.5 - i * 0.15, 3 - i * 0.2, 1.2);
        segmentGeometry.vertices.forEach(vertex => {
            vertex.y += Math.sin(vertex.z * 0.5) * 0.2;
        });
        const segment = new THREE.Mesh(segmentGeometry, bodyMaterial);
        segment.position.z = -3 + i * 1;
        segment.rotation.x = Math.sin(i * 0.2) * 0.1;
        segment.castShadow = true;
        segment.receiveShadow = true;
        blueGroup.add(segment);
    }

    // Cabeça mais detalhada
    const headGroup = new THREE.Group();
    
    // Crânio principal com detalhes
    const headGeometry = new THREE.BoxGeometry(1.5, 2, 2.8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    
    // Mandíbulas mais detalhadas
    const upperJawGeometry = new THREE.BoxGeometry(1.4, 0.8, 2.2);
    const upperJaw = new THREE.Mesh(upperJawGeometry, bodyMaterial);
    upperJaw.position.y = -0.8;
    upperJaw.position.z = 0.3;
    
    const lowerJawGeometry = new THREE.BoxGeometry(1.3, 0.6, 2);
    const lowerJaw = new THREE.Mesh(lowerJawGeometry, bodyMaterial);
    lowerJaw.position.y = -1.2;
    lowerJaw.position.z = 0.3;
    
    headGroup.add(head);
    headGroup.add(upperJaw);
    headGroup.add(lowerJaw);
    headGroup.position.set(0, 2.8, 3);
    blueGroup.add(headGroup);

    // Olhos mais realistas
    const eyeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.9,
        reflectivity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });

    const eyeGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    
    // Brilho nos olhos melhorado
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.8
    });
    
    const glowGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const leftGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    const rightGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    
    leftEye.add(leftGlow);
    rightEye.add(rightGlow);
    
    leftEye.position.set(0.6, 3.2, 4);
    rightEye.position.set(-0.6, 3.2, 4);
    
    blueGroup.add(leftEye);
    blueGroup.add(rightEye);

    // Pernas mais detalhadas
    const legGeometry = new THREE.BoxGeometry(0.4, 2, 0.4);
    const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1E90FF,
        roughness: 0.8,
        metalness: 0.2
    });

    const legs = [];
    const legPositions = [
        [-0.7, -1, -1],
        [0.7, -1, -1],
        [-0.7, -1, 1],
        [0.7, -1, 1]
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        leg.receiveShadow = true;
        blueGroup.add(leg);
        legs.push(leg);
    });

    blueGroup.position.set(30, PLAYER_HEIGHT * 2, 30);
    blueGroup.userData = {
        isBlue: true,
        legs: legs
    };

    scene.add(blueGroup);
    return blueGroup;
}

function createIndominus() {
    const indominusGroup = new THREE.Group();
    const textureLoader = new THREE.TextureLoader();

    // Texturas mais realistas para o Indominus
    const indomSkinTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/patterns/white_scales.jpg');
    const indomNormalMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/water/Water_1_M_Normal.jpg');
    const indomRoughnessMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/leather/leather_white_rough.jpg');
    
    const bodyMaterial = new THREE.MeshPhysicalMaterial({ 
        color: 0xF8F8FF,
        map: indomSkinTexture,
        normalMap: indomNormalMap,
        roughnessMap: indomRoughnessMap,
        roughness: 0.5,
        metalness: 0.3,
        envMapIntensity: 1.5,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
        bumpScale: 0.1
    });

    // Corpo mais detalhado e segmentado
    const segments = 8;
    for (let i = 0; i < segments; i++) {
        const segmentGeometry = new THREE.BoxGeometry(6 - i * 0.25, 8 - i * 0.3, 2.5);
        segmentGeometry.vertices.forEach(vertex => {
            vertex.y += Math.sin(vertex.z * 0.3) * 0.3;
        });
        const segment = new THREE.Mesh(segmentGeometry, bodyMaterial);
        segment.position.z = -8 + i * 2;
        segment.rotation.x = Math.sin(i * 0.15) * 0.1;
        segment.castShadow = true;
        segment.receiveShadow = true;
        indominusGroup.add(segment);
    }

    // Cabeça mais detalhada e ameaçadora
    const headGroup = new THREE.Group();
    
    // Crânio principal com detalhes adicionais
    const skullGeometry = new THREE.BoxGeometry(3.5, 4.5, 5.5);
    const skull = new THREE.Mesh(skullGeometry, bodyMaterial);
    
    // Mandíbulas articuladas mais detalhadas
    const upperJawGeometry = new THREE.BoxGeometry(3.2, 2.5, 4.5);
    const upperJaw = new THREE.Mesh(upperJawGeometry, bodyMaterial);
    upperJaw.position.y = -1.2;
    upperJaw.position.z = 0.5;
    
    const lowerJawGeometry = new THREE.BoxGeometry(3, 2, 4);
    const lowerJaw = new THREE.Mesh(lowerJawGeometry, bodyMaterial);
    lowerJaw.position.y = -2.5;
    lowerJaw.position.z = 0.5;
    
    // Adicionar dentes
    const teethMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFF0,
        roughness: 0.3,
        metalness: 0.1
    });
    
    for (let i = 0; i < 6; i++) {
        const toothGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const upperTooth = new THREE.Mesh(toothGeometry, teethMaterial);
        const lowerTooth = new THREE.Mesh(toothGeometry, teethMaterial);
        
        upperTooth.position.set(-1.2 + i * 0.5, -1.8, 2);
        lowerTooth.position.set(-1.2 + i * 0.5, -2.2, 2);
        lowerTooth.rotation.x = Math.PI;
        
        upperJaw.add(upperTooth);
        lowerJaw.add(lowerTooth);
    }
    
    headGroup.add(skull);
    headGroup.add(upperJaw);
    headGroup.add(lowerJaw);
    headGroup.position.set(0, 4.5, 7);
    indominusGroup.add(headGroup);

    // Olhos mais ameaçadores
    const eyeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xFF4500,
        emissive: 0xFF4500,
        emissiveIntensity: 1.0,
        roughness: 0.1,
        metalness: 0.9,
        reflectivity: 1.0,
        clearcoat: 1.0
    });

    const eyeGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    
    leftEye.position.set(1.2, 6, 9);
    rightEye.position.set(-1.2, 6, 9);
    
    indominusGroup.add(leftEye);
    indominusGroup.add(rightEye);

    // Pernas mais detalhadas
    const legGeometry = new THREE.BoxGeometry(1.2, 4, 1.2);
    const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        roughness: 0.8,
        metalness: 0.2
    });

    const legs = [];
    const legPositions = [
        [-2, -2, -2],
        [2, -2, -2],
        [-2, -2, 2],
        [2, -2, 2]
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        leg.receiveShadow = true;
        indominusGroup.add(leg);
        legs.push(leg);
    });

    indominusGroup.position.set(40, PLAYER_HEIGHT * 3, 40);
    indominusGroup.userData = {
        isIndominus: true,
        health: INDOMINUS_HEALTH,
        legs: legs,
        lastAttackTime: 0
    };

    scene.add(indominusGroup);
    return indominusGroup;
}

function playIndominusDeathAnimation() {
    const duration = 3000; // 3 segundos
    const startTime = Date.now();
    const startPosition = indominus.position.clone();
    
    const deathAnimation = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Rotação e queda
        indominus.rotation.z = Math.PI * 0.5 * progress;
        indominus.position.y = startPosition.y - (10 * progress);
        
        if (progress < 1) {
            requestAnimationFrame(deathAnimation);
        } else {
            scene.remove(indominus);
        }
    };
    
    deathAnimation();
}

function gameOver() {
    isGameOver = true;
    
    // Remover o Indominus
    scene.remove(indominus);
    indominus = null;
    
    // Resetar o jogador
    player.userData.health = 100;
    player.userData.stamina = 100;
    
    // Resetar a Blue
    scene.remove(blue);
    blue = null;
    blueAttacks = 0;
    
    // Criar nova Blue
    blue = createBlue();
    alert('Você morreu! A Blue apareceu novamente. Pressione F perto dela para dar a ração!');
    
    // Adicionar evento de alimentar a Blue
    const feedBlue = (e) => {
        if (e.code === 'KeyF' && blue) {
            const distance = player.position.distanceTo(blue.position);
            if (distance < 10) {
                indominus = createIndominus();
                alert('A Blue aceitou a ração! Mas um Indominus Rex apareceu! Use o botão direito do mouse para fazer a Blue atacar!');
                document.removeEventListener('keydown', feedBlue);
                isGameOver = false;
                
                document.addEventListener('mousedown', (e) => {
                    if (e.button === 2 && blue && indominus && blueAttacks < INDOMINUS_HEALTH) {
                        blueAttacks++;
                        
                        const startPos = blue.position.clone();
                        const attackAnimation = () => {
                            blue.position.lerp(indominus.position, 0.1);
                            if (blue.position.distanceTo(indominus.position) > 0.1) {
                                requestAnimationFrame(attackAnimation);
                            } else {
                                blue.position.copy(startPos);
                                
                                if (blueAttacks >= INDOMINUS_HEALTH) {
                                    playIndominusDeathAnimation();
                                    
                                    setTimeout(() => {
                                        scene.remove(blue);
                                        
                                        document.body.style.backgroundColor = 'black';
                                        const endText = document.createElement('div');
                                        endText.style.color = 'white';
                                        endText.style.position = 'fixed';
                                        endText.style.top = '50%';
                                        endText.style.left = '50%';
                                        endText.style.transform = 'translate(-50%, -50%)';
                                        endText.style.fontSize = '32px';
                                        endText.textContent = 'Continua em Jurassic World Game 2...';
                                        document.body.appendChild(endText);
                                    }, 3000);
                                }
                            }
                        };
                        
                        attackAnimation();
                    }
                });
            }
        }
    };
    
    document.addEventListener('keydown', feedBlue);
}

// Adicionar barreira invisível
function checkBoundaries() {
    const boundary = terrainSize / 2 - 5; // 5 unidades de margem
    const playerPos = isRidingRaptor ? (currentTool === 'raptor' ? raptor.position : tRex.position) : player.position;
    
    // Limitar posição X
    if (playerPos.x > boundary) {
        playerPos.x = boundary;
    } else if (playerPos.x < -boundary) {
        playerPos.x = -boundary;
    }
    
    // Limitar posição Z
    if (playerPos.z > boundary) {
        playerPos.z = boundary;
    } else if (playerPos.z < -boundary) {
        playerPos.z = -boundary;
    }
    
    // Atualizar posição do jogador se estiver montado
    if (isRidingRaptor) {
        if (currentTool === 'raptor') {
            raptor.position.copy(playerPos);
        } else {
            tRex.position.copy(playerPos);
        }
        player.position.copy(playerPos);
        player.position.y += 1;
    }
}

// Iniciar jogo
window.addEventListener('load', () => {
    console.log('Página carregada, iniciando jogo...');
    if (!init()) {
        alert('Erro ao iniciar o jogo. Por favor, recarregue a página.');
    }
});