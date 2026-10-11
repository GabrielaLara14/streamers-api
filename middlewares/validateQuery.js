// Middleware que valida los parámetros de consulta antes de llegar al controlador

// Convierte el texto recibido en número; devuelve null si no tiene el formato correcto
const parsers = {
  integer: (rawValue) => (/^-?\d+$/.test(rawValue) ? Number(rawValue) : null),
  number: (rawValue) => (/^-?\d+(\.\d+)?$/.test(rawValue) ? Number(rawValue) : null),
};

// Mensaje de error cuando un parámetro no es válido
const buildInvalidParamMessage = (name, rule) =>
  `Query parameter "${name}" must be a valid ${rule.type} between ${rule.min} and ${rule.max}`;

// Convierte el valor y comprueba que esté dentro del rango; si no, devuelve null
const parseQueryParam = (rawValue, rule) => {
  if (typeof rawValue !== 'string') return null;

  const parsedValue = parsers[rule.type](rawValue);
  const isInRange = parsedValue !== null && parsedValue >= rule.min && parsedValue <= rule.max;

  return isInRange ? parsedValue : null;
};

// Recibe las reglas de cada parámetro y devuelve el middleware de Express
const validateQuery = (rules) => (req, res, next) => {
  const validatedQuery = {};

  for (const [name, rule] of Object.entries(rules)) {
    const rawValue = req.query[name];

    // Si el parámetro no viene en la URL se usa el valor por defecto
    if (rawValue === undefined) {
      validatedQuery[name] = rule.defaultValue;
      continue;
    }

    // Si el valor es inválido responde 400
    const parsedValue = parseQueryParam(rawValue, rule);
    if (parsedValue === null) {
      return res.status(400).json({ error: buildInvalidParamMessage(name, rule) });
    }

    validatedQuery[name] = parsedValue;
  }

  // Deja los valores validados disponibles para el controlador
  res.locals.query = validatedQuery;
  next();
};

module.exports = validateQuery;
