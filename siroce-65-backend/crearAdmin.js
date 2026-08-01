'use strict';

const bcrypt = require('bcryptjs');
const { Usuario, Rol } = require('./src/models');
const { connectDB } = require('./src/config/database');

const inyectarAdministrador = async () => {
  try {
    // 1. Conectar a la base de datos usando tu propia configuración
    await connectDB();

    // 2. Asegurarnos de que exista el Rol ADMIN
    const [rol] = await Rol.findOrCreate({
      where: { nombre: 'ADMIN' },
      defaults: { descripcion: 'Administrador General', activo: true }
    });

    // 3. Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordSegura = await bcrypt.hash('admin123', salt);

    // 4. Crear (o actualizar) al usuario maestro 'admin'
    await Usuario.upsert({
      id_usuario: 1, // Forzamos que sea el primer usuario
      nombre_usuario: 'admin', // <-- Regresamos a 'admin' por ser cuenta de entrega
      password: passwordSegura,
      dpi: '0000000000000', // DPI genérico para el admin base
      id_rol: rol.id_rol,
      activo: true
    });

    console.log('\n========================================');
    console.log('✅ ¡Usuario maestro inyectado con éxito!');
    console.log('👉 Usuario: admin');
    console.log('👉 Contraseña: admin123');
    console.log('========================================\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error inyectando usuario:', error);
    process.exit(1);
  }
};

inyectarAdministrador();