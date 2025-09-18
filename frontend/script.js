// Variables globales
let botToken = null;
let selectedGuildId = null;
let selectedChannelId = null;

// Elementos del DOM
const connectBtn = document.getElementById('connect-btn');
const botTokenInput = document.getElementById('bot-token');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const botInfo = document.getElementById('bot-info');
const botAvatar = document.getElementById('bot-avatar');
const botName = document.getElementById('bot-name');
const botId = document.getElementById('bot-id');
const fetchGuildsBtn = document.getElementById('fetch-guilds');
const guildSelect = document.getElementById('guild-select');
const fetchChannelsBtn = document.getElementById('fetch-channels');
const channelSelect = document.getElementById('channel-select');
const messageContent = document.getElementById('message-content');
const sendMessageBtn = document.getElementById('send-message');
const fetchMembersBtn = document.getElementById('fetch-members');
const membersList = document.getElementById('members-list');
const logContainer = document.getElementById('log-container');

// Función para registrar en el historial
function log(message, type = 'info') {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = timeString;
    
    const messageSpan = document.createElement('span');
    messageSpan.className = 'log-message';
    messageSpan.textContent = message;
    
    if (type === 'success') {
        messageSpan.classList.add('log-success');
    } else if (type === 'error') {
        messageSpan.classList.add('log-error');
    } else if (type === 'warning') {
        messageSpan.classList.add('log-warning');
    }
    
    logEntry.appendChild(timeSpan);
    logEntry.appendChild(messageSpan);
    logContainer.appendChild(logEntry);
    
    // Scroll al final
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Función para actualizar el estado de conexión
function updateConnectionStatus(connected) {
    if (connected) {
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'Conectado';
    } else {
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = 'Desconectado';
    }
}

// Función para conectar con el bot
async function connectBot() {
    const token = botTokenInput.value.trim();
    
    if (!token) {
        log('Por favor ingresa un token', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/set-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            botToken = token;
            updateConnectionStatus(true);
            botInfo.classList.remove('hidden');
            
            // Actualizar información del bot
            botName.textContent = data.bot.username;
            botId.textContent = `ID: ${data.bot.id}`;
            botAvatar.src = data.bot.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
            
            log(`Conectado como ${data.bot.username}`, 'success');
            
            // Habilitar botones
            fetchGuildsBtn.disabled = false;
        } else {
            log(data.error || 'Error al conectar', 'error');
            updateConnectionStatus(false);
        }
    } catch (error) {
        log('Error de conexión con el servidor', 'error');
        updateConnectionStatus(false);
        console.error('Error:', error);
    }
}

// Función para obtener servidores
async function fetchGuilds() {
    if (!botToken) {
        log('No estás conectado a un bot', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/guilds', {
            headers: {
                'Authorization': `Bearer ${botToken}`
            }
        });
        
        const guilds = await response.json();
        
        if (response.ok) {
            // Limpiar select
            guildSelect.innerHTML = '<option value="">-- Selecciona un servidor --</option>';
            
            // Agregar servidores
            guilds.forEach(guild => {
                const option = document.createElement('option');
                option.value = guild.id;
                option.textContent = guild.name;
                guildSelect.appendChild(option);
            });
            
            log(`Obtenidos ${guilds.length} servidores`, 'success');
        } else {
            log(guilds.error || 'Error al obtener servidores', 'error');
        }
    } catch (error) {
        log('Error de conexión con el servidor', 'error');
        console.error('Error:', error);
    }
}

// Función para obtener canales
async function fetchChannels() {
    if (!botToken) {
        log('No estás conectado a un bot', 'error');
        return;
    }
    
    if (!selectedGuildId) {
        log('Selecciona un servidor primero', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/channels/${selectedGuildId}`, {
            headers: {
                'Authorization': `Bearer ${botToken}`
            }
        });
        
        const channels = await response.json();
        
        if (response.ok) {
            // Limpiar select
            channelSelect.innerHTML = '<option value="">-- Selecciona un canal --</option>';
            
            // Agregar canales
            channels.forEach(channel => {
                const option = document.createElement('option');
                option.value = channel.id;
                option.textContent = `# ${channel.name}`;
                channelSelect.appendChild(option);
            });
            
            log(`Obtenidos ${channels.length} canales`, 'success');
            sendMessageBtn.disabled = false;
        } else {
            log(channels.error || 'Error al obtener canales', 'error');
        }
    } catch (error) {
        log('Error de conexión con el servidor', 'error');
        console.error('Error:', error);
    }
}

// Función para obtener miembros
async function fetchMembers() {
    if (!botToken) {
        log('No estás conectado a un bot', 'error');
        return;
    }
    
    if (!selectedGuildId) {
        log('Selecciona un servidor primero', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/members/${selectedGuildId}`, {
            headers: {
                'Authorization': `Bearer ${botToken}`
            }
        });
        
        const members = await response.json();
        
        if (response.ok) {
            // Limpiar lista
            membersList.innerHTML = '';
            
            // Agregar miembros
            members.forEach(member => {
                const memberItem = document.createElement('div');
                memberItem.className = 'member-item';
                
                const avatar = document.createElement('img');
                avatar.className = 'member-avatar';
                avatar.src = member.user.avatar ? 
                    `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : 
                    `https://cdn.discordapp.com/embed/avatars/${member.user.discriminator % 5}.png`;
                avatar.alt = member.user.username;
                
                const name = document.createElement('span');
                name.textContent = member.user.username;
                
                memberItem.appendChild(avatar);
                memberItem.appendChild(name);
                membersList.appendChild(memberItem);
            });
            
            log(`Obtenidos ${members.length} miembros`, 'success');
        } else {
            log(members.error || 'Error al obtener miembros', 'error');
        }
    } catch (error) {
        log('Error de conexión con el servidor', 'error');
        console.error('Error:', error);
    }
}

// Función para enviar mensaje
async function sendMessage() {
    if (!botToken) {
        log('No estás conectado a un bot', 'error');
        return;
    }
    
    if (!selectedChannelId) {
        log('Selecciona un canal primero', 'error');
        return;
    }
    
    const content = messageContent.value.trim();
    
    if (!content) {
        log('Escribe un mensaje primero', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`
            },
            body: JSON.stringify({
                channelId: selectedChannelId,
                content: content
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            log(`Mensaje enviado: "${content}"`, 'success');
            messageContent.value = '';
        } else {
            log(result.error || 'Error al enviar mensaje', 'error');
        }
    } catch (error) {
        log('Error de conexión con el servidor', 'error');
        console.error('Error:', error);
    }
}

// Event Listeners
connectBtn.addEventListener('click', connectBot);

fetchGuildsBtn.addEventListener('click', fetchGuilds);

guildSelect.addEventListener('change', () => {
    selectedGuildId = guildSelect.value;
    fetchChannelsBtn.disabled = !selectedGuildId;
    fetchMembersBtn.disabled = !selectedGuildId;
    
    if (selectedGuildId) {
        log(`Servidor seleccionado: ${guildSelect.options[guildSelect.selectedIndex].text}`);
    }
});

fetchChannelsBtn.addEventListener('click', fetchChannels);

channelSelect.addEventListener('change', () => {
    selectedChannelId = channelSelect.value;
    sendMessageBtn.disabled = !selectedChannelId;
    
    if (selectedChannelId) {
        log(`Canal seleccionado: ${channelSelect.options[channelSelect.selectedIndex].text}`);
    }
});

fetchMembersBtn.addEventListener('click', fetchMembers);

sendMessageBtn.addEventListener('click', sendMessage);

// Evento para enviar con Enter en el textarea
messageContent.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Inicializar
log('Panel de control iniciado');
