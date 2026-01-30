const { z } = require('zod');

const assetTypeEnum = ['Pozo', 'Motor', 'Transformador'];

const assetCreateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  type: z.enum(assetTypeEnum, 'Tipo de activo inválido'),
  lat: z.number().refine((value) => value >= -90 && value <= 90, 'Latitud inválida'),
  lng: z.number().refine((value) => value >= -180 && value <= 180, 'Longitud inválida'),
  comments: z.string().max(1024).optional(),
});

const assetUpdateSchema = assetCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'Debes enviar al menos un campo para actualizar',
);

const userCreateSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin', 'operator'], 'Rol inválido'),
});

const userUpdateSchema = userCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'Debes enviar al menos un campo para actualizar',
);

const formatZodErrors = (error) =>
  error.errors.map(({ path, message }) => ({
    field: path.join('.') || 'body',
    message,
  }));

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({ errors: formatZodErrors(result.error) });
  }
  req.body = result.data;
  next();
};

module.exports = {
  validateBody,
  assetCreateSchema,
  assetUpdateSchema,
  userCreateSchema,
  userUpdateSchema,
};
