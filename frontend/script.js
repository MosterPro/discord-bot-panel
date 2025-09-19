// Variables globales
let botToken = null;
let botInfo = null;
let selectedGuildId = null;
let selectedChannelId = null;
let currentMessages = [];

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const loginBtn = document.getElementById('login-btn');
const loginText = document.getElementById('login-text');
const loginSpinner = document.getElementById('login-spinner');
const loginError = document.getElementById('login-error');
const errorMessage = document.getElementById('error-message');
const botTokenInput = document.getElementById('bot-token');
const logoutBtn = document.getElementById('logout-btn');
const headerBotAvatar = document.getElementById('header-bot-avatar');
const headerBotName = document.getElementById('header-bot-name');
const headerBotId = document.getElementById('header-bot-id');
const statusIndicator = document.getElementById('status-indicator');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const fetchGuildsBtn = document.getElementById('fetch-guilds');
const guildSelect = document.getElementById('guild-select');
const fetchChannelsBtn = document.getElementById('fetch-channels');
const channelSelect = document.getElementById('channel-select');
const messageContent = document.getElementById('message-content');
const sendMessageBtn = document.getElementById('send-message');
const fetchMembersBtn = document.getElementById('fetch-members');
const membersList = document.getElementById('members-list');
const logContainer = document.getElementById('log-container');
const guildsCount = document.getElementById('guilds-count');
const channelsCount = document.getElementById('channels-count');
const membersCount = document.getElementById('members-count');
const messagesContainer = document.getElementById('messages-container');
const refreshMessagesBtn = document.getElementById('refresh-messages');

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.getElementById('notification-container').appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

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
    messageSpan.className = `log-message log-${type}`;
    messageSpan.textContent = message;
    
    logEntry.appendChild(timeSpan);
    logEntry.appendChild(messageSpan);
    logContainer.appendChild(logEntry);
    
    // Scroll al final
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Función para actualizar el estado de conexión
function updateConnectionStatus(connected) {
    if (connected) {
        statusIndicator.className = 'status-indicator';
        statusDot.className = 'status-dot';
        statusText.textContent = 'Conectado';
    } else {
        statusIndicator.className = 'status-indicator offline';
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Desconectado';
    }
}

// Función para conectar con el bot
async function connectBot() {
    const token = botTokenInput.value.trim();
    
    if (!token) {
        showError('Por favor ingresa un token');
        return;
    }
    
    // Mostrar spinner
    loginText.style.display = 'none';
    loginSpinner.style.display = 'inline-block';
    loginBtn.disabled = true;
    loginError.style.display = 'none';
    
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
            botInfo = data.bot;
            
            // Actualizar información del bot en el header
            headerBotName.textContent = data.bot.username;
            headerBotId.textContent = `ID: ${data.bot.id}`;
            headerBotAvatar.src = data.bot.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
            
            // Mostrar la aplicación
            loginScreen.style.display = 'none';
            appContainer.style.display = 'block';
            
            updateConnectionStatus(true);
            log(`Conectado como ${data.bot.username}`, 'success');
            showNotification(`¡Bienvenido ${data.bot.username}!`, 'success');
            
            // Cargar servidores automáticamente
            fetchGuilds();
        } else {
            showError(data.error || 'Error al conectar');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión con el servidor');
    } finally {
        // Ocultar spinner
        loginText.style.display = 'inline-block';
        loginSpinner.style.display = 'none';
        loginBtn.disabled = false;
    }
}

// Función para mostrar errores
function showError(message) {
    errorMessage.textContent = message;
    loginError.style.display = 'block';
    log(message, 'error');
    showNotification(message, 'error');
}

// Función para cerrar sesión
function logout() {
    botToken = null;
    botInfo = null;
    selectedGuildId = null;
    selectedChannelId = null;
    currentMessages = [];
    
    // Limpiar campos
    botTokenInput.value = '';
    guildSelect.innerHTML = '<option value="">-- Cargando servidores --</option>';
    channelSelect.innerHTML = '<option value="">-- Selecciona un servidor primero --</option>';
    messageContent.value = '';
    messagesContainer.innerHTML = '<div class="empty-messages"><i class="fas fa-comment-slash"></i><p>Selecciona un canal para ver sus mensajes</p></div>';
    membersList.innerHTML = '<p class="text-center text-muted">Selecciona un servidor para ver sus miembros</p>';
    logContainer.innerHTML = `
        <div class="log-entry">
            <span class="log-time">--:--:--</span>
            <span class="log-message log-info">Panel de control iniciado</span>
        </div>
    `;
    
    // Actualizar contadores
    guildsCount.textContent = '0 servidores encontrados';
    channelsCount.textContent = '0 canales disponibles';
    membersCount.textContent = '0 miembros';
    
    // Deshabilitar botones
    fetchChannelsBtn.disabled = true;
    sendMessageBtn.disabled = true;
    fetchMembersBtn.disabled = true;
    refreshMessagesBtn.disabled = true;
    
    // Mostrar login
    appContainer.style.display = 'none';
    loginScreen.style.display = 'flex';
    
    updateConnectionStatus(false);
    log('Sesión cerrada', 'info');
    showNotification('Sesión cerrada correctamente', 'success');
}

// Función para obtener servidores
async function fetchGuilds() {
    if (!botToken) return;
    
    try {
        fetchGuildsBtn.innerHTML = '<span class="spinner"></span>';
        fetchGuildsBtn.disabled = true;
        
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
            
            guildsCount.textContent = `${guilds.length} servidor${guilds.length !== 1 ? 'es' : ''} encontrado${guilds.length !== 1 ? 's' : ''}`;
            log(`Obtenidos ${guilds.length} servidores`, 'success');
        } else {
            showError(guilds.error || 'Error al obtener servidores');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión con el servidor');
    } finally {
        fetchGuildsBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        fetchGuildsBtn.disabled = false;
    }
}

// Función para obtener canales
async function fetchChannels() {
    if (!botToken || !selectedGuildId) return;
    
    try {
        fetchChannelsBtn.innerHTML = '<span class="spinner"></span>';
        fetchChannelsBtn.disabled = true;
        
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
            
            channelsCount.textContent = `${channels.length} canal${channels.length !== 1 ? 'es' : ''} disponible${channels.length !== 1 ? 's' : ''}`;
            sendMessageBtn.disabled = false;
            log(`Obtenidos ${channels.length} canales`, 'success');
        } else {
            showError(channels.error || 'Error al obtener canales');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión con el servidor');
    } finally {
        fetchChannelsBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        fetchChannelsBtn.disabled = false;
    }
}

// Función para obtener mensajes de un canal
async function fetchMessages() {
    if (!botToken || !selectedChannelId) return;
    
    try {
        refreshMessagesBtn.innerHTML = '<span class="spinner"></span>';
        refreshMessagesBtn.disabled = true;
        
        // Obtener los últimos 50 mensajes del canal
        const response = await fetch(`/api/messages/${selectedChannelId}`, {
            headers: {
                'Authorization': `Bearer ${botToken}`
            }
        });
        
        const messages = await response.json();
        
        if (response.ok) {
            currentMessages = messages;
            displayMessages(messages);
            log(`Obtenidos ${messages.length} mensajes del canal`, 'success');
        } else {
            showError(messages.error || 'Error al obtener mensajes');
            messagesContainer.innerHTML = '<div class="empty-messages"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar mensajes</p></div>';
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión con el servidor');
        messagesContainer.innerHTML = '<div class="empty-messages"><i class="fas fa-exclamation-triangle"></i><p>Error de conexión</p></div>';
    } finally {
        refreshMessagesBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refrescar';
        refreshMessagesBtn.disabled = false;
    }
}

// Función para mostrar mensajes en la interfaz
function displayMessages(messages) {
    if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = '<div class="empty-messages"><i class="fas fa-comment-slash"></i><p>No hay mensajes en este canal</p></div>';
        return;
    }
    
    messagesContainer.innerHTML = '';
    
    // Ordenar mensajes por fecha (más recientes al final)
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.type === 'system' ? 'message-system' : ''}`;
        
        // Formatear fecha
        const timestamp = new Date(message.timestamp);
        const timeString = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
        
        // Avatar del usuario
        const avatarUrl = message.author.avatar ? 
            `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png` : 
            `https://cdn.discordapp.com/embed/avatars/${message.author.discriminator % 5}.png`;
        
        messageElement.innerHTML = `
            <div class="message-header">
                <img src="${avatarUrl}" alt="${message.author.username}" class="message-avatar">
                <div class="message-author">${message.author.username}</div>
                <div class="message-timestamp">${timeString}</div>
            </div>
            <div class="message-content">${escapeHtml(message.content)}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
    });
    
    // Scroll al final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Función para escapar HTML (seguridad)
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '<',
        '>': '>',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Función para obtener miembros
async function fetchMembers() {
    if (!botToken || !selectedGuildId) return;
    
    try {
        fetchMembersBtn.innerHTML = '<span class="spinner"></span>';
        fetchMembersBtn.disabled = true;
        
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
                
                const nameContainer = document.createElement('div');
                const name = document.createElement('div');
                name.className = 'member-name';
                name.textContent = member.user.username;
                
                const tag = document.createElement('div');
                tag.className = 'member-tag';
                tag.textContent = `#${member.user.discriminator}`;
                
                nameContainer.appendChild(name);
                nameContainer.appendChild(tag);
                
                memberItem.appendChild(avatar);
                memberItem.appendChild(nameContainer);
                membersList.appendChild(memberItem);
            });
            
            membersCount.textContent = `${members.length} miembro${members.length !== 1 ? 's' : ''}`;
            log(`Obtenidos ${members.length} miembros`, 'success');
        } else {
            showError(members.error || 'Error al obtener miembros');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión con el servidor');
    } finally {
        fetchMembersBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        fetchMembersBtn.disabled = false;
    }
}

// Función para enviar mensaje
async function sendMessage() {
    if (!botToken || !selectedChannelId) return;
    
    const content = messageContent.value.trim();
    
    if (!content) {
        showError('Escribe un mensaje primero');
        return;
    }
    
    try {
        sendMessageBtn.innerHTML = '<span class="spinner"></span> Enviando...';
        sendMessageBtn.disabled = true;
        
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
            showNotification('Mensaje enviado correctamente', 'success');
            
            // Refrescar mensajes después de enviar
            setTimeout(fetchMessages, 1000);
        } else {
            showError(result.error || 'Error al enviar mensaje');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión con el servidor');
    } finally {
        sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensaje';
        sendMessageBtn.disabled = false;
    }
}

// Event Listeners
loginBtn.addEventListener('click', connectBot);

botTokenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        connectBot();
    }
});

logoutBtn.addEventListener('click', logout);

fetchGuildsBtn.addEventListener('click', fetchGuilds);

guildSelect.addEventListener('change', () => {
    selectedGuildId = guildSelect.value;
    fetchChannelsBtn.disabled = !selectedGuildId;
    fetchMembersBtn.disabled = !selectedGuildId;
    channelSelect.innerHTML = selectedGuildId ? 
        '<option value="">-- Cargando canales --</option>' : 
        '<option value="">-- Selecciona un servidor primero --</option>';
    channelsCount.textContent = '0 canales disponibles';
    messagesContainer.innerHTML = '<div class="empty-messages"><i class="fas fa-comment-slash"></i><p>Selecciona un canal para ver sus mensajes</p></div>';
    
    if (selectedGuildId) {
        log(`Servidor seleccionado: ${guildSelect.options[guildSelect.selectedIndex].text}`);
        fetchChannels();
    }
});

fetchChannelsBtn.addEventListener('click', fetchChannels);

channelSelect.addEventListener('change', () => {
    selectedChannelId = channelSelect.value;
    sendMessageBtn.disabled = !selectedChannelId;
    refreshMessagesBtn.disabled = !selectedChannelId;
    
    if (selectedChannelId) {
        log(`Canal seleccionado: ${channelSelect.options[channelSelect.selectedIndex].text}`);
        messagesContainer.innerHTML = '<div class="loading-messages"><span class="spinner"></span><p>Cargando mensajes...</p></div>';
        fetchMessages();
    } else {
        messagesContainer.innerHTML = '<div class="empty-messages"><i class="fas fa-comment-slash"></i><p>Selecciona un canal para ver sus mensajes</p></div>';
    }
});

fetchMembersBtn.addEv
