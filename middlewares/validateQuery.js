const parsers = {
  integer: (rawValue) => (/^-?\d+$/.test(rawValue) ? Number(rawValue) : null),
  number: (rawValue) => (/^-?\d+(\.\d+)?$/.test(rawValue) ? Number(rawValue) : null),
};

const buildInvalidParamMessage = (name, rule) =>
  `Query parameter "${name}" must be a valid ${rule.type} between ${rule.min} and ${rule.max}`;

const parseQueryParam = (rawValue, rule) => {
  if (typeof rawValue !== 'string') return null;

  const parsedValue = parsers[rule.type](rawValue);
  const isInRange = parsedValue !== null && parsedValue >= rule.min && parsedValue <= rule.max;

  return isInRange ? parsedValue : null;
};

const validateQuery = (rules) => (req, res, next) => {
  const validatedQuery = {};

  for (const [name, rule] of Object.entries(rules)) {
    const rawValue = req.query[name];

    if (rawValue === undefined) {
      validatedQuery[name] = rule.defaultValue;
      continue;
    }

    const parsedValue = parseQueryParam(rawValue, rule);
    if (parsedValue === null) {
      return res.status(400).json({ error: buildInvalidParamMessage(name, rule) });
    }

    validatedQuery[name] = parsedValue;
  }

  res.locals.query = validatedQuery;
  next();
};

module.exports = validateQuery;
