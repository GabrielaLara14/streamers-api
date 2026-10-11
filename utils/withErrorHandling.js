// Envuelve un controlador para capturar errores y responder 500 en vez de romper el servidor
const withErrorHandling = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = withErrorHandling;
