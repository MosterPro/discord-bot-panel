// Agregar este nuevo endpoint después de los otros endpoints existentes

// Obtener mensajes de un canal
app.get('/api/messages/:channelId', validateToken, async (req, res) => {
  const { channelId } = req.params;
  
  if (!channelId) {
    return res.status(400).json({ error: 'ID de canal requerido' });
  }
  
  try {
    // Obtener los últimos 50 mensajes del canal
    const response = await axios.get(`${process.env.DISCORD_API_BASE || 'https://discord.com/api/v10'}/channels/${channelId}/messages?limit=50`, {
      headers: {
        Authorization: `Bot ${req.botToken}`
      }
    });
    
    // Filtrar y formatear mensajes
    const messages = response.data.map(msg => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      type: msg.type === 0 ? 'default' : msg.type === 6 ? 'system' : 'other',
      author: {
        id: msg.author.id,
        username: msg.author.username,
        discriminator: msg.author.discriminator,
        avatar: msg.author.avatar
      }
    }));
    
    res.json(messages);
  } catch (error) {
    console.error('Error obteniendo mensajes:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error obteniendo mensajes del canal' });
  }
});
