function validate(schema) {
  return async (req, res, next) => {
    try {
      const data = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.validated = data;
      next();
    } catch (err) {
      if (err.errors) {
        const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        return res.status(400).json({ error: 'Ошибка валидации', details: messages });
      }
      return res.status(400).json({ error: 'Ошибка валидации' });
    }
  };
}

module.exports = validate;
