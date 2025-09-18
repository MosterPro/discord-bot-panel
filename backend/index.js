require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 1 // per 1 second by IP
});

const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({ error: 'Demasiadas solicitudes, inténtalo más tarde' });
    });
};

app.use(rateLimiterMiddleware);

// Almacenamiento temporal de tokens (en producción usar base de datos)
let botTokens = new Map();

// Middleware para validar token
const validateToken = (req, res, next) => {
  const { token } = req.headers;
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  // Verificar si el token es válido consultando la API de Discord
  axios.get(`${process.env.DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bot ${token}`
    }
  })
  .then(response => {
    req.botToken = token;
    req.botUser = response.data;
    next();
  })
  .catch(error => {
    console.error('Error validando token:', error.response?.data || error.message);
    return res.status(401).json({ error: 'Token inválido' });
  });
};

// Endpoint para establecer token
app.post('/api/set-token', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token es requerido' });
  }
  
  // Validar token con Discord
  axios.get(`${process.env.DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bot ${token}`
    }
  })
  .then(response => {
    botTokens.set(req.ip, token);
    res.json({ 
      success: true, 
      bot: {
        id: response.data.id,
        username: response.data.username,
        avatar: response.data.avatar ? 
          `https://cdn.discordapp.com/avatars/${response.data.id}/${response.data.avatar}.png` : 
          null
      }
    });
  })
  .catch(error => {
    console.error('Error validando token:', error.response?.data || error.message);
    return res.status(401).json({ error: 'Token inválido' });
  });
});

// Obtener servidores del bot
app.get('/api/guilds', validateToken, (req, res) => {
  axios.get(`${process.env.DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bot ${req.botToken}`
    }
  })
  .then(response => {
    res.json(response.data);
  })
  .catch(error => {
    console.error('Error obteniendo servidores:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error obteniendo servidores' });
  });
});

// Obtener canales de un servidor
app.get('/api/channels/:guildId', validateToken, (req, res) => {
  const { guildId } = req.params;
  
  if (!guildId) {
    return res.status(400).json({ error: 'ID de servidor requerido' });
  }
  
  axios.get(`${process.env.DISCORD_API_BASE}/guilds/${guildId}/channels`, {
    headers: {
      Authorization: `Bot ${req.botToken}`
    }
  })
  .then(response => {
    // Filtrar solo canales de texto
    const textChannels = response.data.filter(channel => channel.type === 0);
    res.json(textChannels);
  })
  .catch(error => {
    console.error('Error obteniendo canales:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error obteniendo canales' });
  });
});

// Obtener miembros de un servidor
app.get('/api/members/:guildId', validateToken, (req, res) => {
  const { guildId } = req.params;
  
  if (!guildId) {
    return res.status(400).json({ error: 'ID de servidor requerido' });
  }
  
  axios.get(`${process.env.DISCORD_API_BASE}/guilds/${guildId}/members?limit=1000`, {
    headers: {
      Authorization: `Bot ${req.botToken}`
    }
  })
  .then(response => {
    res.json(response.data);
  })
  .catch(error => {
    console.error('Error obteniendo miembros:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error obteniendo miembros' });
  });
});

// Enviar mensaje a un canal
app.post('/api/message', validateToken, (req, res) => {
  const { channelId, content } = req.body;
  
  if (!channelId || !content) {
    return res.status(400).json({ error: 'ID de canal y contenido son requeridos' });
  }
  
  axios.post(`${process.env.DISCORD_API_BASE}/channels/${channelId}/messages`, {
    content
  }, {
    headers: {
      Authorization: `Bot ${req.botToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    res.json({ success: true, message: response.data });
  })
  .catch(error => {
    console.error('Error enviando mensaje:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error enviando mensaje' });
  });
});

// Servir frontend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/../frontend/index.html');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
